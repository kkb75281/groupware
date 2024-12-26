import { Reactive, reactive } from 'vue';
import { skapi } from './main';
import { makeSafe } from './user';
export const employeeDict: Reactive<{ [key: string]: any }> = reactive({});

export const empInfo: {
    [employee_user_id: string]: {
        division: string,
        position: string
    }
} = reactive({});

export const getEmpDivisionPosition = async (user: any, refresh: boolean = false) => {
    let userId = user.user_id;
    if (user.picture) {
        skapi.getFile(user.picture, { dataType: 'endpoint' })
            .then(url => user.picture = url)
            .catch(err => err);
    }

    if (!refresh && empInfo[userId]) {
        Object.assign(user, empInfo[userId]);
        return user;
    }

    let record = (await skapi.getRecords({
        unique_id: "[emp_position_current]" + makeSafe(userId)
    })).list?.[0];

    if (!record) return;

    let emp_dvs = record?.index?.name?.split('.')[0];
    let emp_pst = record?.index?.name?.split('.')[1].replaceAll('_', ' ');

    empInfo[userId] = {
        division: emp_dvs,
        position: emp_pst
    }

    user.division = empInfo[userId].division;
    user.position = empInfo[userId].position;

    return user;
}

export const getUserCache: { [hash: string]: string[] } = {};
export const getUsers = async (params: any = null, refresh:boolean = false, options: { [k: string]: any } = {}): Promise<any[]> => {
    console.log({params})
    options = Object.assign({ limit: 100 }, options || {});

    let paramsHash = params?.searchFor === 'approved' ? params.value : null; // 기본 approved / suspended 리스트만 캐싱
    let userCached: any[] = [];

    if(refresh) {
        if(paramsHash && getUserCache[paramsHash]) {
            getUserCache[paramsHash].splice(0, getUserCache[paramsHash].length); // 캐시 초기화
        }
    }

    if (params.searchFor === 'user_id' && !refresh) {
        let value = params.value;
        if (!Array.isArray(value)) {
            value = [value];
        }

        value.filter((v: string) => {
            if (employeeDict[v]) {
                userCached.push(employeeDict[v]);
                return false;
            }
            return true;
        });

        if (!value.length) {
            return userCached;
        }

        params.value = value;
    }

    if (paramsHash) {
        let cacheUidList = getUserCache[paramsHash];
        if(cacheUidList && cacheUidList.length) {
            return cacheUidList.map(uid=>employeeDict[uid]);
        }
    }

    let res = await skapi.getUsers(params, options);

    res.list.filter((emp: any) => {
        if (emp.approved.includes('by_master')) {
            return false;
        }

        employeeDict[emp.user_id] = emp;

        if (paramsHash && params.searchFor !== 'user_id') {
            if (getUserCache[paramsHash]) {
                if (!getUserCache[paramsHash].includes(emp.user_id)) {
                    getUserCache[paramsHash].push(emp.user_id);
                }
                else {
                    getUserCache[paramsHash] = [emp.user_id];
                }
            }
        }

        return true;
    });

    return userCached.concat(res.list);
}

export const getInvitationsCache: string[] = [];
export const getInvitations = async (refresh:boolean = false, options: { [k: string]: any } = {}): Promise<any[]> => {
    options = Object.assign({ limit: 100 }, options || {});
    if(refresh) {
        if(getInvitationsCache.length) {
            getInvitationsCache.splice(0, getInvitationsCache.length); // 캐시 초기화
        }
    }

    if(!getInvitationsCache.length || refresh) {
        let res = await skapi.getInvitations(null, options);

        res.list.forEach(u=>{
            employeeDict[u.user_id] = u;
            getInvitationsCache.push(u.user_id)
        });

        return res.list;
    }

    return getInvitationsCache.map(uid=>employeeDict[uid]);
}