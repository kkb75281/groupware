<template lang="pug">
.inner
    div(style="display: flex; gap: 1rem")
        //- h1.title(v-if="user.access_group > 98") 직원 관리
        //- h1.title(v-else) 직원 목록
        .input-wrap(v-if="user.access_group > 98" style="max-width: 370px;width: 100%;")
            select(v-model="empListType")
                option(value="직원목록") 직원목록
                option(value="초청여부") 초청여부
                option(value="숨김여부") 숨김여부

            br
            br

    //- hr

    .table-wrap
        .tb-head-wrap
            form#searchForm(@submit.prevent="searchEmp")
                .input-wrap
                    select(v-model="searchFor" :disabled="empListType !== '직원목록'")
                        option(value="name") 이름
                        option(value="division") 부서/직책
                        option(value="email") 이메일
                .input-wrap.search(v-if="searchFor !== 'division'")
                    input(v-model="searchValue" type="text" placeholder="검색어를 입력하세요" :disabled="empListType !== '직원목록'")
                    button.btn-search
                template(v-else)
                    .input-wrap
                        select(name="searchDivision" v-model="searchValue" :disabled="empListType !== '직원목록'" @change="searchEmp")
                    .input-wrap.search(style="width: 176px;")
                        input(v-model="searchPositionValue" type="text" placeholder="직책을 입력하세요" :disabled="searchValue === '전체'")
                        button.btn-search

            .tb-toolbar
                .btn-wrap
                    button.btn.outline.refresh-icon(:disabled="loading" @click="refresh")
                        svg(:class="{'rotate' : loading}")
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-refresh")

                    template(v-if="user.access_group > 98")
                        template(v-if="empListType === '직원목록'")
                            button.btn.bg-gray.btn-block(:disabled="!selectedList.length" @click="employeeState('block')") 숨김
                            button.btn.outline(@click="router.push('/admin/add-employee')") 등록
                        template(v-else-if="empListType === '초청여부'")
                            button.btn.outline(@click="router.push('/admin/add-employee')") 등록
                        template(v-else-if="empListType === '숨김여부'")
                            button.btn.bg-gray.btn-block(:disabled="!selectedList.length" @click="employeeState('unblock')") 숨김 해제
                            button.btn.outline.warning.btn-remove(:disabled="!selectedList.length" @click="employeeState('delete')") 삭제

        .tb-overflow
            table.table#employee_list
                colgroup
                    template(v-if="user.access_group > 98 && empListType !== '초청여부'")
                        col(style="width: 5%;")
                    col(v-show="isDesktop" style="width: 5%;")
                    col(:style="{ width: isDesktop ? '10%' : '24%' }")
                    col(:style="{ width: isDesktop ? '10%' : '24%' }")
                    col(v-show="isDesktop" style="width: 10%;")
                    col(v-show="isDesktop" style="width: 25%;")
                    //- template(v-if='empListType === "초청여부"')
                    //-     col(style="width: 11%;")
                    //- template(v-if='(empListType === "직원목록" || empListType === "숨김여부") && user.access_group > 98')
                    //-     col(style="width: 11%;")
                    col(v-show="isDesktop" style="width: 10%; min-width: 6rem;")
                    col(v-show="isDesktop" style="width: 10%; min-width: 6rem;")
                    col(v-show="isDesktop" style="min-width: 15rem;")
                thead
                    tr
                        template(v-if="user.access_group > 98 && empListType !== '초청여부'")
                            th(scope="col")
                                label.checkbox
                                    input(type="checkbox" name="checkbox" :checked="isAllSelected" @change="toggleSelectAll")
                                    span.label-checkbox
                        th(v-show="isDesktop" scope="col") NO
                        template(v-if="empListType !== '초청여부'")
                            th(scope="col") 직책<br>(직급)
                            th(scope="col") 부서
                        th(scope="col") 이름
                        th(v-show="isDesktop" scope="col") 이메일
                        template(v-if='empListType === "초청여부"')
                            th(scope="col") 초청여부
                        //- template(v-if='(empListType === "직원목록" || empListType === "숨김여부") && user.access_group > 98')
                        //-     th(scope="col") 상세보기
                        th(v-show="isDesktop" scope="col") 생년월일
                        th(v-show="isDesktop" scope="col") 전화번호
                        th(v-show="isDesktop" scope="col") 주소
                tbody
                    template(v-if="loading")
                        tr.nohover.loading
                            td(colspan="10")
                                Loading#loading
                    template(v-else-if="!employee || Object.keys(employee).length === 0 || (empListType === '숨김여부' && suspendedLength === 0)")
                        tr.nohover
                            td(colspan="10") 데이터가 없습니다.
                    template(v-else)
                        tr(v-for="(emp, index) in employee" :key="emp.user_id" @click.stop="(e) => empListType !== '초청여부' && goToEditEmp(e, emp.user_id)" :style="{cursor: empListType !== '초청여부' ? 'pointer' : 'default'}")
                            //- 직원목록/숨김여부
                            template(v-if="empListType === '직원목록' || empListType === '숨김여부'")
                                template(v-if="user.access_group > 98")
                                    td
                                        label.checkbox
                                            input(type="checkbox" name="checkbox" :checked="selectedList.includes(emp.user_id)" @click.stop="toggleSelect(emp.user_id)")
                                            span.label-checkbox
                                td.list-num(v-show="isDesktop") {{ index + 1 }}
                                td {{ emp?.position }}
                                td {{ divisionNameList?.[emp?.division] }}
                                //- template(v-if='user.access_group > 98')
                                //-     td {{ emp.name }}
                                //- template(v-else)
                                td
                                    .name-wrap
                                        .img-wrap(style="width: 36px; height: 36px;")
                                            template(v-if="emp.picture")
                                                img(:src="emp.picture" alt="img-profile")
                                            template(v-else)
                                                .icon(style="padding: 0; widght: 100%; height: 100%; display: flex; justify-content: center; align-items: center;")
                                                    svg(style="width: 16px; height: 16px; fill: var(--gray-color-400);")
                                                        use(xlink:href="@/assets/icon/material-icon.svg#icon-person")
                                        span {{ emp.name }}

                                td(v-show="isDesktop") {{ emp.email }}
                                td(v-show="isDesktop") {{ emp.birthdate }}
                                td(v-show="isDesktop") {{ emp.phone_number }}
                                td(v-show="isDesktop") {{ emp.address }}
                            
                            //- 초청여부
                            template(v-else-if="empListType === '초청여부'")
                                td.list-num(v-show="isDesktop") {{ index + 1 }}
                                //- td {{ emp?.position }}
                                //- td {{ divisionNameList?.[emp?.division] }}
                                td {{ emp.name }}
                                td(v-show="isDesktop") {{ emp.email }}
                                td
                                    .btn-wrap
                                        button.btn.bg-gray.sm(@click.stop="resendInvite(emp.email)") 재전송
                                        button.btn.bg-gray.sm(@click.stop="cancelInvite(emp)") 초청취소
                                td(v-show="isDesktop") {{ emp.birthdate }}
                                td(v-show="isDesktop") {{ emp.phone_number }}
                                td(v-show="isDesktop") {{ emp.address }}

        //- .pagination
            button.btn-prev.icon(type="button") 
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-back-ios")
                | Prev
            button.btn-next.icon(type="button" @click="currentPage++;" :class="{'nonClickable': endOfList && currentPage >= maxPage }") Next
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")


//- Modal
#modal.modal(v-if="isModalOpen" @click="closeModal")
    .modal-cont(@click.stop)
        .modal-header
            h2.modal-title 직원 상세
            button.btn-close(@click="closeModal")
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-close")
        .modal-body
            #_el_pictureForm
                .image
                    img#profile-img(:src="selectedEmp?.picture" alt="profile image")

            .input-wrap
                p.label 직책
                input(type="text" name="position" v-model="selectedEmpTags.emp_pst" placeholder="직책을 입력해주세요." :readonly="disabled")

            .input-wrap
                p.label 부서
                template(v-if="disabled")
                    input(type="text" name="division" :value="divisionNameList?.[selectedEmp?.division]" :placeholder="divisionNameList?.[selectedEmp?.division] === '' ? '부서를 선택해주세요.' : ''" readonly)
                template(v-else)
                    select(name="division" required disabled v-model="selectedEmpTags.emp_dvs")
                        option(value="" disabled) 부서 선택
            
            .input-wrap
                p.label 권한
                template(v-if="disabled")
                    input(type="text" name="access_group" :value="access_group[selectedEmp?.access_group] || '-' " readonly)
                template(v-else)
                    select(name="access_group" v-model="selectedEmp.access_group" style="height: 40px;")
                        option(value="" disabled selected) 권한선택
                        option(value="1") 직원
                        option(value="98") 관리자
                        option(value="99") 마스터
                
            .input-wrap
                p.label 이름
                input(type="text" name="name" :value="selectedEmp?.name || '-' "  placeholder="이름을 입력해주세요." disabled)

            .input-wrap
                p.label 이메일
                input(type="email" name="email" :value="selectedEmp?.email || '-' " placeholder="예) user@email.com" disabled)

            .input-wrap
                p.label 생년월일
                input(type="date" name="birthdate" :value="selectedEmp?.birthdate" disabled)

            .input-wrap
                p.label 전화번호
                input(type="tel" name="phone_number" :value="selectedEmp?.phone_number || '-' " placeholder="예) +821012345678" disabled)

            .input-wrap
                p.label 주소
                input(type="text" name="address" :value="selectedEmp?.address || '-' " placeholder="예) 서울시 마포구" disabled)

            .input-wrap.upload-file
                p.label(style="margin-bottom: 0;") 기타자료
                template(v-if="!disabled")
                    .btn-upload-file
                        input#file(type="file" name="additional_data" multiple :disabled="disabled" @change="updateFileList" hidden)
                        label.btn.outline.btn-upload(for="file") 파일 추가
                        ul.upload-file-list
                            li.file-name(v-for="(name, index) in fileNames" :key="index") {{ name }}

                .file-wrap
                    ul.file-list
                        template(v-if="uploadFile.length === 0")
                            li.file-item(style="height: 36px;") 등록된 파일이 없습니다.
                        template(v-else)
                            li.file-item(v-for="(file, index) in uploadFile" :key="index" :class="{'remove': removeFileList.includes(file.record_id)}")
                                a.file-name(:href="file.url" target="_blank") {{ file.filename }}
                                template(v-if="!disabled")
                                    button.btn-cancel(v-if="removeFileList.includes(file.record_id)" type="button" @click="removeFileList = removeFileList.filter((id) => id !== file.record_id);")
                                        svg
                                            use(xlink:href="@/assets/icon/material-icon.svg#icon-undo")
                                    button.btn-remove(v-else type="button" @click="removeFileList.push(file.record_id);")
                                        svg
                                            use(xlink:href="@/assets/icon/material-icon.svg#icon-delete")
        .modal-footer
            template(v-if="disabled")
                button.btn.btn-edit(type="button" @click="editEmp") 수정
            template(v-else)
                button.btn.bg-gray.btn-cancel(type="button" @click="cancelEdit") 취소
                button.btn.btn-register(type="submit" @click="registerEmp") 등록
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, computed, watch, onMounted, nextTick, onUnmounted } from 'vue';
import { skapi } from '@/main.ts';
import { user, makeSafe } from '@/user.ts';
import { divisionNameList } from '@/division.ts';
import {
  getEmpDivisionPosition,
  getUsers,
  getInvitations,
  getUserCache,
  getInvitationsCache
} from '@/employee.ts';

import Loading from '@/components/loading.vue';

let router = useRouter();
let route = useRoute();

let loading = ref(false);
let currentPage = ref(1);
let selectedList = ref([]);
let empListType = ref(route.query.empListType || '직원목록');

let isAllSelected = computed(() => {
  return (
    selectedList.value.length > 0 &&
    employee.value.every((emp) => selectedList.value.includes(emp.user_id))
  );
});

let employee = ref([]);
let suspendedLength = ref(0);
let isModalOpen = ref(false);
let selectedEmp = ref(null);
let selectedEmpOriginal = {};
let selectedEmpTags = ref({
  emp_dvs: '',
  emp_pst: ''
});
let searchFor = ref('name');
let searchValue = ref('');
let searchPositionValue = ref('');
let uploadFile = ref([]);
let backupUploadFile = ref([]);
let disabled = ref(true);
let removeFileList = ref([]);

let fileNames = ref([]);

let access_group = {
  1: '직원',
  98: '관리자',
  99: '마스터'
};

let callParams = computed(() => {
  switch (searchFor.value) {
    case 'name':
      return {
        searchFor: 'name',
        value: searchValue.value,
        condition: '>='
      };
    case 'division':
      return {
        searchFor: 'timestamp',
        value: new Date().getTime(),
        condition: '<='
      };
    case 'email':
      return {
        searchFor: 'email',
        value: searchValue.value,
        condition: '='
      };
  }
});

watch(
  () => route.query.empListType,
  (newType) => {
    if (newType) {
      empListType.value = newType;
    }
  }
);

watch(searchFor, (nv) => {
  if (nv) {
    searchValue.value = '';

    if (nv === 'division') {
      nextTick(() => {
        displayDivisionOptions('searchDivision');
        searchValue.value = '전체';
      });
    }
  }
});

watch(searchValue, (nv) => {
  if (nv) {
    if (nv === '전체' && searchFor.value === 'division') {
      callParams.value.searchFor = 'approved';
      callParams.value.value = 'by_skapi:approved';
      callParams.value.condition = '>=';

      searchEmp();
    }
  }
});

async function arrangeEmpDivisionPosition(li) {
  // console.log({li})
  let list = await Promise.all(
    li.map((l) => {
      if (l) {
        return getEmpDivisionPosition(l).catch((err) => err);
      }
      return null;
    })
  );
  let toReturn = [];
  list.forEach((l) => {
    if (l) {
      toReturn.push(l);
    }
  });
  return toReturn;
}

async function getEmpList(type, refresh = false) {
  loading.value = true;

  if (type === '직원목록') {
    router.replace({
      path: '/list-employee',
      query: {}
    });

    employee.value = await getUsers(
      {
        searchFor: 'approved',
        value: 'by_skapi:approved',
        condition: '>='
      },
      refresh
    )
      .then((li) => arrangeEmpDivisionPosition(li))
      .finally(() => (loading.value = false));
  } else if (type === '숨김여부') {
    router.replace({
      path: '/list-employee',
      query: {}
    });

    let result = await getUsers(
      {
        searchFor: 'approved',
        // value: 'by_admin:suspended',
        value: 'by_skapi:suspended',
        condition: '>='
      },
      refresh
    )
      .then((li) => arrangeEmpDivisionPosition(li))
      .finally(() => (loading.value = false));

    employee.value = result;
    suspendedLength.value = result.length;
  } else if (type === '초청여부') {
    employee.value = await getInvitations(refresh)
      .then((li) => arrangeEmpDivisionPosition(li))
      .finally(() => (loading.value = false));
    // console.log('=== getEmpList === employee.value : ', employee.value);
  }
}

watch(empListType, getEmpList, { immediate: true });

let refresh = () => {
  getEmpList(empListType.value, true);
};

let displayDivisionOptions = (selectName) => {
  let divisionList = document.querySelector(`select[name="${selectName}"]`);

  // 기존 옵션을 제거하지 않고 새로운 옵션을 추가
  divisionList.innerHTML = ''; // 기존 옵션 초기화

  const allOption = document.createElement('option');
  const defaultOption = document.createElement('option');

  let matchFound = false;

  // 기본 옵션 추가
  if (selectName == 'searchDivision') {
    allOption.value = '전체';
    allOption.innerText = '전체';
    allOption.selected = true;
    divisionList.appendChild(allOption);
  } else {
    defaultOption.disabled = true;
    defaultOption.selected = true;
    defaultOption.innerText = '부서 선택';
    divisionList.appendChild(defaultOption);
  }

  // 동적으로 부서 옵션 추가
  for (let key in divisionNameList.value) {
    if (divisionNameList.value[key] !== '') {
      const option = document.createElement('option');
      option.value = key;
      option.innerText = divisionNameList.value[key];

      // 선택된 부서 처리
      if (selectName === 'division' && key === selectedEmp.value.division) {
        option.selected = true;
        matchFound = true;
      }

      divisionList.appendChild(option);
    }
  }

  // 일치하는 키가 없으면 기본 옵션에 selected 추가
  if (selectName === 'division' && !matchFound) {
    defaultOption.selected = true;
  }

  // 선택박스 활성화
  divisionList.disabled = false;
};

async function searchEmp(refresh) {
  loading.value = true;

  if (!searchValue.value) {
    searchFor.value = 'name';
    searchValue.value = '';
    callParams.value.searchFor = 'approved';
    callParams.value.value = 'by_skapi:approved';
    callParams.value.condition = '>=';
  }

  if (searchFor.value === 'division' && searchValue.value !== '전체') {
    employee.value = [];

    try {
      const res = await skapi.getRecords({
        table: {
          name: 'emp_position_current',
          access_group: 1
        },
        index: {
          name: searchPositionValue.value
            ? searchValue.value + '.' + searchPositionValue.value
            : searchValue.value + '.',
          value: ' ',
          condition: '>'

          // 이름도 검색할거면
          // value: searchNameValue.value ? searchNameValue.value : ' ',
          // condition: searchNameValue.value ? '>=' : '>'
        }
      });

      // user_id만 추출
      let gu = [];

      res.list.forEach((rec) => gu.push(rec.data.user_id));

      const result = [...new Set(gu)]; // 중복 제거

      employee.value = await getUsers(
        {
          searchFor: 'user_id',
          value: result // 절대값 검색(user_id)는 어레이 가능
        },
        refresh
      ).then((li) => arrangeEmpDivisionPosition(li));
    } finally {
      loading.value = false;
    }
  } else {
    // division이 아닌 다른 검색 조건일 경우 처리
    employee.value = await getUsers(callParams.value, refresh)
      .then((li) => arrangeEmpDivisionPosition(li))
      .finally(() => (loading.value = false));
  }
}

// 추가자료 업로드 한 것 가져오기
let getAdditionalData = () => {
  skapi
    .getRecords({
      table: {
        name: 'emp_additional_data',
        access_group: 99
      },
      reference: '[emp_additional_data]' + makeSafe(selectedEmp.value.user_id)
    })
    .then((res) => {
      if (res.list.length > 0) {
        let fileList = [];

        function getFileUserId(str) {
          if (!str) return '';

          return str.split('/')[3];
        }

        res.list.forEach((item) => {
          if (item.bin.additional_data && item.bin.additional_data.length > 0) {
            const result = item.bin.additional_data.map((el) => ({
              ...el,
              user_id: getFileUserId(el.path),
              record_id: item.record_id
            }));

            fileList.push(...result);
          }
        });

        uploadFile.value = fileList;
      }
    });
};

let closeModal = () => {
  isModalOpen.value = false;
  selectedEmp.value = null;
  disabled.value = true;
};

let toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedList.value = [];
  } else {
    selectedList.value = employee.value.map((item) => item.user_id);
  }
};

let toggleSelect = (el) => {
  if (selectedList.value.includes(el)) {
    selectedList.value = selectedList.value.filter((itemId) => itemId !== el);
  } else {
    selectedList.value.push(el);
  }
};

let employeeState = async (state) => {
  let userId = Object.values(selectedList.value);
  let alertMsg = '';
  let isSuccess = [];
  let isFail = [];

  if (state == 'block') {
    alertMsg = '숨김 처리';

    await Promise.all(
      userId.map((el) => {
        return skapi
          .blockAccount({ user_id: el })
          .then((res) => {
            // let appr_cache = getUserCache['by_skapi:approved'];
            // let sus_cache = getUserCache['by_admin:suspended'];
            // console.log('appr_cache', appr_cache);
            // console.log('sus_cache', sus_cache);
            // if(appr_cache.length) {
            //     let index = appr_cache.findIndex(uid => uid === el);
            //     appr_cache.splice(index, 1);
            // }
            // sus_cache.push(el);

            isSuccess.push(el);
          })
          .catch((err) => {
            console.log({ err });
            isFail.push(el);
          });
      })
    );
  } else if (state == 'unblock') {
    alertMsg = '숨김 해제';

    await Promise.all(
      userId.map((el) => {
        return skapi
          .unblockAccount({ user_id: el })
          .then((res) => {
            // let appr_cache = getUserCache['by_skapi:approved'];
            // let sus_cache = getUserCache['by_admin:suspended'];
            // console.log('appr_cache', appr_cache);
            // console.log('sus_cache', sus_cache);
            // if(sus_cache.length) {
            //     let index = sus_cache.findIndex(uid => uid === el);
            //     sus_cache.splice(index, 1);
            // }
            // appr_cache.push(el);

            isSuccess.push(el);
          })
          .catch((err) => {
            console.log({ err });
            isFail.push(el);
          });
      })
    );
  } else if (state == 'delete') {
    alertMsg = '삭제';

    const userDvsList = await skapi.getRecords({
      table: {
        name: 'emp_division' + makeSafe(userId),
        access_group: 1
      },
      tag: '[emp_id]' + makeSafe(userId)
    });
    const currentUserDvs = userDvsList.list[userDvsList.list.length - 1];
    const userDvs = currentUserDvs.tags[0].split(']')[1];
    console.log('userDvsList : ', userDvsList);

    await Promise.all(
      userId.map((el) => {
        console.log('userDvs : ', userDvs);
        return skapi
          .deleteAccount({ user_id: el })
          .then((res) => {
            skapi.deleteRecords({ unique_id: `[emp_position_current]${makeSafe(el)}:${userDvs}` }); // 현재 직책 삭제

            // let sus_cache = getUserCache['by_admin:suspended'];
            // console.log('sus_cache', sus_cache);
            // if(sus_cache.length) {
            //     let index = sus_cache.findIndex(uid => uid === el);
            //     sus_cache.splice(index, 1);
            // }

            isSuccess.push(el);
          })
          .catch((err) => {
            console.log({ err });
            isFail.push(el);
          });
      })
    );
  }

  if (isSuccess.length > 0) {
    alert(`${isSuccess.length}명의 직원이 ${alertMsg}되었습니다.`);
  } else {
    alert(`${alertMsg}에 실패하였습니다.`);
  }

  selectedList.value = [];
  getEmpList(empListType.value, true);
};

let resendInvite = (email) => {
  skapi
    .resendInvitation({ email: email })
    .then((res) => {
      alert('초대메일이 재전송되었습니다.');
    })
    .catch((err) => {
      alert('초대메일 재전송에 실패하였습니다.');
    });
};

let cancelInvite = (employee_info) => {
  let safeEmail = makeSafe(employee_info.email);
  let safeUserId = makeSafe(employee_info.user_id);

  let picTable = {
    table: {
      name: 'init_profile_pic_' + safeEmail, // 관리자가 올리는 초기 프로필 사진을 저장하는 테이블
      access_group: 1
    }
  };

  let positionTable = {
    table: {
      name: 'emp_division' + safeUserId,
      access_group: 1
    },
    index: {
      name: 'user_id',
      value: safeUserId
    }
  };

  let privateStorage = {
    table: {
      name: 'emp_access_ref',
      access_group: 99
    },
    index: {
      name: 'user_id',
      value: safeUserId
    }
  };

  let ref_info = {
    table: {
      name: 'ref_ids',
      access_group: 1
    },
    index: {
      name: 'user_id',
      value: safeUserId
    }
  };

  skapi
    .cancelInvitation(employee_info)
    .then(async (res) => {
      // 이제 record_id 몰라도 query로 레코드 삭제 가능
      skapi.deleteRecords(picTable);
      skapi.deleteRecords(positionTable);
      skapi.deleteRecords(privateStorage);
      skapi.deleteRecords(ref_info);

      getInvitationsCache.splice(
        getInvitationsCache.findIndex((inv) => res.user_id === inv),
        1
      ); // 캐시에서 삭제

      let inv = await getInvitations();
      alert('초대메일이 취소되었습니다.');

      employee.value = employee.value.filter((emp) => emp.user_id !== employee_info.user_id); // 리스트에서 삭제

      // employee.value = await inv;
    })
    .catch((err) => {
      alert('초대메일 취소에 실패하였습니다.');
    });
};

let editEmp = () => {
  disabled.value = false;
  fileNames.value = [];

  nextTick(() => {
    displayDivisionOptions('division');
  });

  if (uploadFile.value) {
    backupUploadFile.value = [...uploadFile.value];
  }
};

let cancelEdit = () => {
  disabled.value = true;
  removeFileList.value = [];
  uploadFile.value = [...backupUploadFile.value];
};

let registerEmp = async (e) => {
  e.preventDefault();
  disabled.value = true;

  let user_id_safe = makeSafe(selectedEmp.value.user_id);
  let needUpdate = false;

  // 부서, 직책 업데이트 (history/current)
  if (
    selectedEmpOriginal.division !== selectedEmpTags.value.emp_dvs ||
    selectedEmpOriginal.position !== selectedEmpTags.value.emp_pst
  ) {
    skapi
      .postRecord(null, {
        table: {
          name: 'emp_division' + user_id_safe,
          access_group: 1
        },
        tags: [
          '[emp_pst]' + selectedEmpTags.value.emp_pst,
          '[emp_id]' + user_id_safe,
          '[emp_dvs]' + selectedEmpTags.value.emp_dvs
        ]
      })
      .then((r) => {
        // console.log('history 부서직책업데이트', r);
      });

    await skapi
      .deleteRecords({
        unique_id: `[emp_position_current]${user_id_safe}:${selectedEmpTags.value.emp_dvs}`
      })
      .then(async (r) => {
        // console.log(r)
        // current
        await skapi
          .postRecord(
            {
              user_id: selectedEmp.value.user_id
            },
            {
              unique_id: `[emp_position_current]${user_id_safe}:${selectedEmpTags.value.emp_dvs}`,
              table: {
                name: 'emp_position_current',
                access_group: 1
              },
              index: {
                name: selectedEmpTags.value.emp_dvs + '.' + selectedEmpTags.value.emp_pst,
                value: selectedEmp.value.name
              }
            }
          )
          .then((r) => {
            // console.log('current 부서직책업데이트', r);
          });
      });
    needUpdate = true;
  }

  // 권한 업데이트
  if (selectedEmpOriginal.access_group !== selectedEmp.value.access_group) {
    skapi
      .grantAccess({
        user_id: selectedEmp.value.user_id,
        access_group: selectedEmp.value.access_group
      })
      .then((r) => {
        // console.log('권한업데이트' ,r)
      });
  }

  // 추가자료 업데이트
  let filebox = document.querySelector('input[name=additional_data]');

  if (filebox && filebox.files.length) {
    for (let file of filebox.files) {
      const formData = new FormData();

      formData.append('additional_data', file);

      await skapi.postRecord(formData, {
        table: {
          name: 'emp_additional_data',
          access_group: 99
        },
        reference: '[emp_additional_data]' + makeSafe(selectedEmp.value.user_id)
      });
    }

    if (uploadFile.value && uploadFile.value.length) {
      backupUploadFile.value = [...uploadFile.value];
    }
  }

  if (removeFileList.value.length) {
    await skapi.deleteRecords({ record_id: removeFileList.value }).then((r) => {
      uploadFile.value = uploadFile.value.filter(
        (file) => !removeFileList.value.includes(file.record_id)
      );

      removeFileList.value = [];
    });
  }

  for (let e of employee.value) {
    if (e.user_id === selectedEmp.value.user_id) {
      e.division = selectedEmpTags.value.emp_dvs;
      e.position = selectedEmpTags.value.emp_pst;
      selectedEmpOriginal = { ...e };
      break;
    }
  }

  getAdditionalData(); // 추가자료 가져오기
  window.alert('등록완료');

  if (needUpdate) {
    searchEmp(true);
  }
  disabled.value = true;
};

// 파일 추가시 파일명 표시
let updateFileList = (e) => {
  let target = e.target;
  if (target.files) {
    fileNames.value = Array.from(target.files).map((file) => file.name);
  }
};

const goToEditEmp = (e, userId) => {
  if (e.target.classList.contains('label-checkbox')) return;
  router.push({ name: 'detail-employee', params: { userId } });
};

const isDesktop = ref(window.innerWidth > 768);

const updateScreenSize = () => {
  isDesktop.value = window.innerWidth > 768;
};

onMounted(() => {
  window.addEventListener('resize', updateScreenSize);

  if (empListType.value === '초청여부' && route.query.refresh) {
    refresh();
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', updateScreenSize);
});
</script>

<style scoped lang="less">
.inner {
  max-width: 1600px;
  margin: 0 auto;
  padding: 2rem;
}

#divisions_list > a > * {
  vertical-align: middle;
}

.division-logo {
  width: 2rem;
  height: 2rem;
  object-fit: contain;
}

.table-wrap {
  #searchForm {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .loading {
    position: relative;
    border-bottom: unset;

    #loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  }
}

#employee_list {
  tbody {
    td {
      white-space: nowrap;
    }
  }
}

.go-detail {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 16px;

  span {
    white-space: nowrap;
  }
}

.img-wrap {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid var(--gray-color-300);
  border-radius: 50%;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

#_el_pictureForm {
  text-align: center;

  .image {
    position: relative;
    display: inline-block;

    .label {
      position: absolute;
      right: 0;
      bottom: 0;
      background-color: var(--primary-color-400);
      border-radius: 50%;
      cursor: pointer;

      &.disabled {
        pointer-events: none;
        background-color: var(--gray-color-300);
      }

      .icon {
        padding: 4px;
        width: 32px;
        height: 32px;
        position: relative;

        svg {
          width: 18px;
          height: 18px;
          transform: translate(-50%, -50%);
          top: 50%;
          left: 50%;
          position: absolute;
        }
      }
    }

    .options {
      position: absolute;
      right: -113px;
      bottom: -40px;
      z-index: 9;
      background-color: var(--gray-color-100);
      border: 1px solid var(--gray-color-300);
      padding: 5px;
      border-radius: 4px;

      li {
        font-size: 0.8rem;
        text-align: left;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;

        &:first-child {
          margin-bottom: 4px;
        }
        &:hover {
          background-color: var(--primary-color-400);
          color: #fff;

          &.disabled {
            background-color: unset;
            color: unset;
          }
        }
        &.disabled {
          opacity: 0.25;
          cursor: default;
          pointer-events: none;
        }
      }
    }
  }

  #profile-img {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    display: block;
    // object-fit: contain;
    object-fit: cover;
    position: relative;
    background-color: var(--gray-color-100);

    &::before {
      content: 'No Image';
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      background-color: var(--gray-color-100);
      color: #888;
      font-size: 14px;
      text-align: center;
      position: absolute;
      top: 0;
      left: 0;
    }
  }
}

.modal {
  .input-wrap {
    input {
      border-color: var(--primary-color-400);
      cursor: initial;

      &:read-only {
        border-color: var(--gray-color-200);
        cursor: default;

        &:hover {
          border-color: var(--gray-color-200);
        }
      }

      &:hover {
        border-color: var(--primary-color-400);
      }
    }

    select {
      border-color: var(--primary-color-400);
    }
  }
}

.upload-file {
  .file-item {
    &.remove {
      background-color: var(--warning-color-50);
      border: 1px dashed var(--warning-color-400);
      color: var(--warning-color-500);
    }
  }
}

.btn-upload-file {
  margin-top: 12px;
}

.name-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;

  .img-wrap {
    width: 1.5rem;
    height: 1.5rem;
    overflow: hidden;
    border: 1px solid var(--gray-color-300);
    border-radius: 50%;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }
}

@media (max-width: 768px) {
  .inner {
    padding: 1rem;
  }
}
</style>
