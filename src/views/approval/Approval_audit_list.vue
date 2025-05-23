<template lang="pug">
//- h1.title {{ isCurrentPage === 'audit-list' ? '결재 수신함' : isCurrentPage === 'audit-reference' ? '수신 참조함' : isCurrentPage === 'audit-list-favorite' ? '중요 결재함' : '' }}

//- hr

.table-wrap
	.tb-overflow
		table.table#tb-auditList
			colgroup
				col(v-show="isDesktop" style="width: 3rem")
				col(style="width: 3rem")
				col
				template(v-if="isCurrentPage === 'audit-list'")
					col(:style="{ width: isDesktop ? '12%' : '24%' }")
				col(v-show="isDesktop" style="width: 12%")
				col(v-show="isDesktop" style="width: 10%")
			thead
				tr
					th(v-show="isDesktop" scope="col") NO
					th(scope="col") 
					th.left(scope="col") 결재 사안
					template(v-if="isCurrentPage === 'audit-list'")
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
						td(colspan="6") {{ isCurrentPage === 'audit-list' ? '결재 목록이 없습니다.' : isCurrentPage === 'audit-reference' ? '수신참조 목록이 없습니다.' : isCurrentPage === 'audit-list-favorite' ? '지정하신 중요 결재가 없습니다.' : '' }}
				template(v-else)
					tr(v-for="(audit, index) of filterAuditList" :key="audit.record_id" @click.stop="(e) => showAuditDoc(e, audit)" style="cursor: pointer;" :class="{ 'canceled': audit.documentStatus === '회수됨' }")
						td(v-show="isDesktop") {{ index + 1 + (10 * (currentPage - 1)) }}
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
						template(v-if="isCurrentPage === 'audit-list'")
							td
								span.audit-state(:class="{ approve: audit.my_state === '결재함', reject: audit.my_state === '반려함', canceled: audit.my_state === '회수됨' }") {{ audit.my_state }}
						td(v-show="isDesktop")
							span.audit-state(:class="{ approve: audit.documentStatus === '완료됨', reject: audit.documentStatus === '반려됨', canceled: audit.documentStatus === '회수됨' }") {{ audit.documentStatus }}
						td.drafter(v-show="isDesktop") {{ audit.user_info?.name }}

.pagination
	button.btn-prev.icon(type="button" @click="currentPage--;" :class="{'nonClickable': fetching || currentPage <= 1 }")
		svg
			use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-back-ios")
		| Prev

	button.btn-next.icon(type="button" @click="currentPage++;" :class="{'nonClickable': fetching || endOfList && currentPage >= maxPage }") Next
		svg
			use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue';
import { skapi } from '@/main.ts';
import { user, makeSafe } from '@/user.ts';
import {
  auditList,
  auditListRunning,
  auditReferenceList,
  auditReferenceListRunning,
  getAuditList,
  getAuditReferenceList,
  goToAuditDetail
} from '@/audit.ts';
import { readList, realtimes, readNoti } from '@/notifications.ts';

import Loading from '@/components/loading.vue';
import Pager from '@/components/pager.ts';

const router = useRouter();
const route = useRoute();

const isDesktop = ref(window.innerWidth > 768); // 반응형
const favoriteAudit = ref(false); // 중요 결재 지정 여부
const favoriteAuditList = ref([]); // 중요 결재 리스트
const favoriteAuditId = ref(''); // 중요 결재 리스트 레코드 아이디
const favoriteAuditRecords = ref([]); // 중요 결재 레코드 전체 목록

let pager = null;

const searchFor = ref('uploaded'); // 검색 'uploaded' or 'to_audit'

const fetching = ref(false); // 데이터를 가져오는 중인지 여부
const maxPage = ref(0); // 최대 페이지 수
const currentPage = ref(1); // 현재 페이지
const endOfList = ref(false); // 리스트의 끝에 도달했는지 여부
const ascending = ref(false); // 오름차순 정렬 여부
const disp = ref({ list: [], maxPage: 1 }); // 페이지 데이터 저장

// 화면 크기 변경 시
const updateScreenSize = () => {
  isDesktop.value = window.innerWidth > 768;
};

// 현재 페이지 구분
const isCurrentPage = computed(() => {
  if (route.path.includes('audit-list-favorite')) {
    return 'audit-list-favorite'; // 즐겨찾기한 결재 리스트
  } else if (route.path.includes('audit-reference')) {
    return 'audit-reference'; // 수신참조
  } else if (route.path.includes('audit-list')) {
    return 'audit-list'; // 결재 수신함
  }
  return ''; // 기본값
});

// 결재 리스트 화면별로 필터링
const filterAuditList = computed(() => disp.value.list);

// 중요 결재 저장/해제
const toggleFavoriteAudit = async (audit) => {
  if (favoriteAudit.value) return;
  favoriteAudit.value = true;

  try {
    // 현재 audit.record_id가 즐겨찾기에 포함되어 있는지 확인
    const favoriteRecord = favoriteAuditRecords.value.find(
      (record) => record.data.auditId === audit.record_id
    );

    const isFavorite = !!favoriteRecord;

    if (isFavorite) {
      // 중요 결재 해제
      await skapi.deleteRecords({
        table: {
          name: 'audit_favorite_' + makeSafe(user.user_id),
          access_group: 'private'
        },
        record_id: favoriteRecord.record_id
      });

      // UI 업데이트
      favoriteAuditRecords.value = favoriteAuditRecords.value.filter(
        (record) => record.record_id !== favoriteRecord.record_id
      );
      favoriteAuditList.value = favoriteAuditList.value.filter((id) => id !== audit.record_id);

      // 현재 페이지가 중요 결재 페이지인 경우 화면에서 즉시 제거
      if (isCurrentPage.value === 'audit-list-favorite' && pager) {
        // 페이저의 deleteItem 메소드를 사용하여 항목 제거
        await pager.deleteItem(audit.record_id);

        // 현재 페이지 데이터 업데이트
        disp.value = pager.getPage(currentPage.value);

        // 현재 페이지의 항목이 없는 경우 처리
        if (disp.value.list.length === 0 && currentPage.value > 1) {
          currentPage.value--;
        } else if (disp.value.list.length === 0 && maxPage.value === 0) {
          // 데이터가 더 이상 없는 경우 처리
          disp.value = { list: [], maxPage: 0 };
        }

        // 최대 페이지 업데이트
        maxPage.value = disp.value.maxPage;
      }
    } else {
      // 중요 결재 저장
      const data = {
        auditId: audit.record_id
        // auditTitle: audit.data.to_audit,
      };

      const config = {
        table: {
          name: 'audit_favorite_' + makeSafe(user.user_id),
          access_group: 'private'
        }
      };

      const saveFavoriteAudit = await skapi.postRecord(data, config);

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
const getFavoriteAuditList = async (fetchOptions) => {
  try {
    const favoriteRes = await skapi.getRecords({
      table: {
        name: 'audit_favorite_' + makeSafe(user.user_id),
        access_group: 'private'
      },
      fetchOptions
    });

    // 전체 레코드 목록 저장
    favoriteAuditRecords.value = favoriteRes.list || [];

    // 즐겨찾기 ID 목록 추출
    favoriteAuditList.value = favoriteAuditRecords.value.map((record) => record.data.auditId);

    if (!favoriteAuditList.value.length) {
      // 즐겨찾기 항목이 없으면 빈 목록 반환
      return {
        list: [],
        endOfList: true
      };
    }

    if (auditList.value.length === 0) {
      await getAuditList({});
    }

    if (auditReferenceList.value.length === 0) {
      await getAuditReferenceList({});
    }

    const allAudits = [...auditList.value, ...auditReferenceList.value];
    const favoriteAudits = allAudits.filter((audit) =>
      favoriteAuditList.value.includes(audit.record_id)
    );

    favoriteAudits.sort((a, b) => {
      return (b.uploaded || 0) - (a.uploaded || 0);
    });

    return {
      list: favoriteAudits,
      endOfList: true // 이미 모든 데이터를 가져왔으므로 항상 true
    };
  } catch (err) {
    console.error('중요 결재 리스트 가져오기 실패:', err);
    favoriteAuditRecords.value = [];
    favoriteAuditList.value = [];
    return {
      list: [],
      endOfList: true
    };
  }
};

// 결재 문서 읽음 여부 확인
const isAuditRead = (audit) => {
  const auditNoti = realtimes.value.find((rt) => rt.audit_info?.audit_doc_id === audit.record_id);
  if (!auditNoti) return false;

  return Object.keys(readList.value).includes(auditNoti.noti_id);
};

// 해당 결재 상세 페이지로 이동
const showAuditDoc = (e, audit) => {
  const searchCurrentAuditNoti = realtimes.value.find(
    (rt) => rt.audit_info?.audit_doc_id === audit.record_id
  );

  if (
    searchCurrentAuditNoti &&
    !Object.keys(readList.value).includes(searchCurrentAuditNoti.noti_id)
  ) {
    readNoti(searchCurrentAuditNoti);
  }

  if (e.target.closest('.icon-favorite') || e.target.closest('.icon-read')) {
    return;
  }

  goToAuditDetail(e, audit.record_id, router);
};

// 초기 데이터 로드 및 페이저 초기화
const getPage = async (refresh = false) => {
  fetching.value = true;

  if (refresh) {
    endOfList.value = false;
  }

  try {
    // 중요 결재 목록 가져오기
    await getFavoriteAuditList();

    // 페이저 초기화
    if (refresh || !pager) {
      pager = await Pager.init({
        id: 'record_id',
        resultsPerPage: 10,
        sortBy: searchFor.value,
        order: ascending.value ? 'asc' : 'desc'
      });
    }

    // 현재 페이지에 따라 데이터 로드
    let fetchedData;
    const fetchOptions = { fetchMore: !refresh, limit: 10, ascending: false };

    if (isCurrentPage.value === 'audit-reference') {
      // 수신참조 페이지
      fetchedData = (await getAuditReferenceList(fetchOptions)) || [];
    } else if (isCurrentPage.value === 'audit-list') {
      // 결재 수신함 페이지
      fetchedData = await getAuditList(fetchOptions || []);
    } else if (isCurrentPage.value === 'audit-list-favorite') {
      // 먼저 기본 결재 데이터를 로드 (첫 로드 시 또는 refresh 시에만)
      if (refresh || auditList.value.length === 0 || auditReferenceList.value.length === 0) {
        // 병렬로 모든 결재 데이터 로드
        await Promise.all([getAuditList({}), getAuditReferenceList({})]);
      }

      // 즐겨찾기 목록 가져오기
      fetchedData = await getFavoriteAuditList(fetchOptions);
    }

    // endOfList 상태 저장
    endOfList.value = (fetchedData && fetchedData.endOfList) || false;

    // 페이저에 데이터 삽입
    if (Array.isArray(fetchedData.list) && fetchedData.list.length > 0) {
      await pager.insertItems(fetchedData.list);
    }

    // 페이지 데이터 가져오기
    disp.value = pager.getPage(currentPage.value);

    // 최대 페이지 설정
    maxPage.value = disp.value.maxPage;
  } catch (error) {
    console.error('데이터 초기화 실패:', error);
  } finally {
    fetching.value = false;
  }
};

// 페이지 변경 시
watch(currentPage, (n, o) => {
  if (n !== o && n > 0 && (n <= maxPage.value || (n > maxPage.value && !endOfList.value))) {
    getPage();
  } else {
    currentPage.value = o;
  }
});

watch(
  () => route.path,
  () => {
    currentPage.value = 1;
    getPage(true);
  }
);

onMounted(async () => {
  window.addEventListener('resize', updateScreenSize);
  await getPage(true);
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
