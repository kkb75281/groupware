<template lang="pug">
h1.title {{ currentPage === 'audit-list' ? '결재 수신함' : currentPage === 'audit-reference' ? '수신참조' : currentPage === 'audit-list-favorite' ? '중요 결재' : '' }}

hr

.table-wrap
	.tb-overflow
		table.table#tb-auditList
			colgroup
				col(v-show="isDesktop" style="width: 3rem")
				col(style="width: 3rem")
				col
				template(v-if="currentPage === 'audit-list'")
					col(:style="{ width: isDesktop ? '12%' : '24%' }")
				col(v-show="isDesktop" style="width: 12%")
				col(v-show="isDesktop" style="width: 10%")
			thead
				tr
					th(v-show="isDesktop" scope="col") NO
					th(scope="col") 
					th.left(scope="col") 결재 사안
					template(v-if="currentPage === 'audit-list'")
						th(scope="col") 나의 현황
					th(v-show="isDesktop" scope="col") 결재 현황
					th(v-show="isDesktop" scope="col") 기안자

			tbody
				template(v-if="auditListRunning")
					tr.nohover.loading(style="border-bottom: unset;")
						td(colspan="6")
							Loading#loading
				template(v-else-if="!filterAuditList || !filterAuditList.length")
					tr.nohover
						td(colspan="6") {{ currentPage === 'audit-list' ? '결재 목록이 없습니다.' : currentPage === 'audit-reference' ? '수신참조 목록이 없습니다.' : currentPage === 'audit-list-favorite' ? '지정하신 중요 결재가 없습니다.' : '' }}
				template(v-else)
					tr(v-for="(audit, index) of filterAuditList" :key="audit.record_id" @click.stop="(e) => showAuditDoc(e, audit)" style="cursor: pointer;" :class="{ 'canceled': audit.isCanceled }")
						td(v-show="isDesktop") {{ filterAuditList.length - index }}
						td.td-icon
							.icon-wrap
								.icon-favorite(@click.stop="toggleFavoriteAudit(audit)")
									template(v-if="favoriteAuditList.length && favoriteAuditList.includes(audit.record_id)")
										.icon
											svg(style="fill: rgb(255 191 79)")
												use(xlink:href="@/assets/icon/material-icon.svg#icon-star-fill")
									template(v-else)
										.icon
											svg
												use(xlink:href="@/assets/icon/material-icon.svg#icon-star")
								.icon-read(style="cursor: default;")
									template(v-if="isAuditRead(audit)")
										.icon
											svg
												use(xlink:href="@/assets/icon/material-icon.svg#icon-read-mail")
									template(v-else)
										.icon
											svg(style="fill: var(--gray-color-500)")
												use(xlink:href="@/assets/icon/material-icon.svg#icon-mail")
						td.left
							.audit-title {{ audit.data.to_audit }}
						template(v-if="currentPage === 'audit-list'")
							td
								span.audit-state(:class="{ approve: audit.my_state === '결재함', reject: audit.my_state === '반려함', canceled: audit.my_state === '회수됨' }") {{ audit.my_state }}
						//- td(v-show="isDesktop")
							span.audit-state(:class="{ approve: audit.referenced_count === ((JSON.parse(audit.data.auditors).approvers?.length || 0) + (JSON.parse(audit.data.auditors).agreers?.length || 0)), canceled: audit.isCanceled }") {{ audit.isCanceled ? '회수됨' : (audit.referenced_count === ((JSON.parse(audit.data.auditors).approvers?.length || 0) + (JSON.parse(audit.data.auditors).agreers?.length || 0)) ? '완료됨' : '진행중') }}
						td(v-show="isDesktop")
							span.audit-state(:class="{ approve: audit.documentStatus === '완료됨', reject: audit.documentStatus === '반려됨', canceled: audit.documentStatus === '회수됨' }") {{ audit.documentStatus }}
						td.drafter(v-show="isDesktop") {{ audit.user_info?.name }}

Pagination(:totalItems="totalItems" :itemsPerPage="itemsPerPage" v-model:currentPageNum="currentPageNum")
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue';
import { skapi } from '@/main';
import { user, makeSafe } from '@/user';
import { auditList, auditListRunning, auditReferenceList, auditReferenceListRunning, getAuditList, getAuditReferenceList, goToAuditDetail } from '@/audit';
import { readList, realtimes, readNoti } from '@/notifications';

import Loading from '@/components/loading.vue';
import Pagination from '@/components/pagination.vue';

const router = useRouter();
const route = useRoute();

const isDesktop = ref(window.innerWidth > 768); // 반응형
const favoriteAudit = ref(false); // 중요 결재 지정 여부
const favoriteAuditList = ref([]); // 중요 결재 리스트
const favoriteAuditId = ref(''); // 중요 결재 리스트 레코드 아이디
const favoriteAuditRecords = ref([]); // 중요 결재 레코드 전체 목록

const allItems = ref([]); // 전체 데이터를 불러오는 게 아니라 특정 페이지 데이터만 저장
const itemsPerPage = ref(5); // 한 페이지당 개수
const currentPageNum = ref(1); // 현재 페이지 번호
const totalItems = ref(0); // 전체 데이터 개수

// 데이터 가져오기
const fetchData = async () => {
	try {
		await getAuditList();
		await getAuditReferenceList();

		// 전체 데이터 저장
		allItems.value = [...auditList.value, ...auditReferenceList.value];
		totalItems.value = allItems.value.length;

		console.log('allItems : ', allItems.value);
		console.log('totalItems : ', totalItems.value);
	} catch (err) {
		console.error('데이터 가져오기 실패:', err);
	}
};

// 페이지 변경 시
watch(currentPageNum, async () => {
	await fetchData();
});

// 화면 크기 변경 시
const updateScreenSize = () => {
  isDesktop.value = window.innerWidth > 768;
};

// 현재 페이지 구분
const currentPage = computed(() => {
  if (route.path.includes('audit-list-favorite')) {
    return 'audit-list-favorite'; // 즐겨찾기한 결재 리스트
  } else if (route.path.includes('audit-reference')) {
    return 'audit-reference'; // 수신참조
  } else if (route.path.includes('audit-list')) {
    return 'audit-list'; // 결재 수신함
  }
  return ''; // 기본값
});

const filterAuditList = computed(() => {
	// 즐겨찾기 페이지인 경우
	if (currentPage.value === 'audit-list-favorite') {
		const allAudits = [...auditList.value, ...auditReferenceList.value];
		return allAudits.filter(audit => Array.isArray(favoriteAuditList.value) && favoriteAuditList.value.includes(audit.record_id));
	} 
	else if (currentPage.value === 'audit-reference') {
		return auditReferenceList.value; // 수신참조 페이지인 경우
	} 
	else {
		return auditList.value; // 결재 수신함 페이지인 경우
	}
});

// 중요 결재 저장/해제
const toggleFavoriteAudit = async (audit) => {
    if (favoriteAudit.value) return;
    favoriteAudit.value = true;

    try {
        // 현재 audit.record_id가 즐겨찾기에 포함되어 있는지 확인
        const favoriteRecord = favoriteAuditRecords.value.find(record => record.data.auditId === audit.record_id);
        
        const isFavorite = !!favoriteRecord;
        // console.log('isFavorite : ', isFavorite);

        if (isFavorite) {
            // console.log('중요 결재 해제');
            // 중요 결재 해제
            await skapi.deleteRecords({
                table: {
                    name: 'audit_favorite_' + makeSafe(user.user_id),
                    access_group: 'private',
                },
                record_id: favoriteRecord.record_id,
            });
            
            // UI 업데이트
            favoriteAuditRecords.value = favoriteAuditRecords.value.filter(record => record.record_id !== favoriteRecord.record_id);
            favoriteAuditList.value = favoriteAuditList.value.filter(id => id !== audit.record_id);
        } else {
            // console.log('중요 결재 저장');
            // 중요 결재 저장
            const data = {
                auditId: audit.record_id,
                // auditTitle: audit.data.to_audit,
            };

            const config = {
                table: {
                    name: 'audit_favorite_' + makeSafe(user.user_id),
                    access_group: 'private',
                }
            };

			// console.log('data : ', data);
			// console.log('config : ', config);

            const saveFavoriteAudit = await skapi.postRecord(data, config);
            // console.log('saveFavoriteAudit : ', saveFavoriteAudit);

            // UI 업데이트
            favoriteAuditRecords.value.push(saveFavoriteAudit);
            favoriteAuditList.value.push(audit.record_id);
        }

    } catch (err) {
        console.error('중요 결재 저장/해제 실패:', err);
    } finally {
        favoriteAudit.value = false;
    }
};

// 중요 결재 리스트 가져오기
const getFavoriteAuditList = async () => {
    try {
        const res = await skapi.getRecords({
            table: {
                name: 'audit_favorite_' + makeSafe(user.user_id),
                access_group: 'private',
            },
        });
        // console.log('=== getFavoriteAuditList === res : ', res.list);

        // 전체 레코드 목록 저장
        favoriteAuditRecords.value = res.list || [];
        
        // 즐겨찾기 ID 목록 추출
        favoriteAuditList.value = favoriteAuditRecords.value.map(record => record.data.auditId);

        return res;
    } catch (err) {
        console.error('중요 결재 리스트 가져오기 실패:', err);
        favoriteAuditRecords.value = [];
        favoriteAuditList.value = [];
    }
};

// 결재 문서 읽음 여부 확인
const isAuditRead = (audit) => {
	const auditNoti = realtimes.value.find(rt => rt.audit_info?.audit_doc_id === audit.record_id);
	if (!auditNoti) return false;
	
	return Object.keys(readList.value).includes(auditNoti.noti_id);
};

// 해당 결재 상세 페이지로 이동
const showAuditDoc = (e, audit) => {
  const searchCurrentAuditNoti = realtimes.value.find(rt => rt.audit_info?.audit_doc_id === audit.record_id);
  
  if (searchCurrentAuditNoti && !Object.keys(readList.value).includes(searchCurrentAuditNoti.noti_id)) {
    readNoti(searchCurrentAuditNoti);
  }

  if (e.target.closest('.icon-favorite') || e.target.closest('.icon-read')) {
    return;
  }
  
  goToAuditDetail(e, audit.record_id, router);
};

// 현재 페이지에 따라 필요한 데이터 로드
const loadPageData = async () => {
  await getFavoriteAuditList();
  
  if (currentPage.value === 'audit-reference') {
    await getAuditReferenceList();
  } else if (currentPage.value === 'audit-list') {
    await getAuditList();
  } else if (currentPage.value === 'audit-list-favorite') {
    // 즐겨찾기 페이지는 모든 데이터가 필요함
    await Promise.all([getAuditList(), getAuditReferenceList()]);
  }
}

onMounted(async () => {
	await loadPageData();
	await fetchData();
	window.addEventListener('resize', updateScreenSize);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateScreenSize);
});
</script>

<style scoped lang="less">
.audit-title {
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
}

.audit-state {
	font-size: 0.75rem;
	font-weight: 500;
	padding: 1px 0.4rem;
	border-radius: 6px;
	border: 1px solid var(--gray-color-400);
	color: var(--gray-color-500);
	display: inline-flex;
	justify-content: center;
	align-items: center;

	&.approve {
		color: var(--primary-color-400);
		border-color: var(--primary-color-400);
	}

	&.reject {
		color: var(--warning-color-400);
		border-color: var(--warning-color-400);
	}

	&.canceled {
		color: var(--gray-color-300);
		border-color: var(--gray-color-300);
	}
}

.table-wrap {
	margin-top: 3rem;

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

.canceled {
	.audit-title,
	.drafter {
		color: var(--gray-color-300);
	}

	.audit-state {
		color: var(--gray-color-300);
		border-color: var(--gray-color-300);
	}
}

.td-icon {
	padding: 0;
}

.icon-wrap {
	display: flex;
	align-items: center;
	gap: 0.35rem;

	.icon {
		svg {
			width: 1.05rem;
			height: 1.05rem;
			fill: var(--gray-color-300);
		}
	}
}

.icon {
	padding: 0;
}

@media (max-width: 768px) {
	.td-icon {
		padding: 0.5rem;
	}
}
</style>