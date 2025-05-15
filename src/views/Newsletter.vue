<template lang="pug">
//- .title
//- 	h1 각 카테고리별 게시글 목록

//- hr

.inner
  .table-wrap
    .tb-head-wrap
      form#searchForm(@submit.prevent="searchNewsletter")
        .input-wrap.what
          select(v-model="searchFor" :disabled="loading || !newsletterList")
            option(value="subject") 제목
            option(value="writer") 작성자
        .input-wrap.search(v-if="searchFor == 'subject'")
          input(v-model="searchValue.subject" type="text" placeholder="검색어를 입력하세요" :disabled="loading || !newsletterList")
          button.btn-search
        .input-wrap.search(v-else-if="searchFor == 'writer'")
          input(v-model="searchValue.writer" type="text" placeholder="검색어를 입력하세요" :disabled="loading || !newsletterList")
          button.btn-search
      .tb-toolbar
        .btn-wrap
          button.btn.bg-gray.md(type="button" @click="router.push('/newsletter-category/')") 이전
          button.btn.outline.refresh-icon(:disabled="loading" @click="refresh")
            svg(:class="{'rotate' : loading}")
              use(xlink:href="@/assets/icon/material-icon.svg#icon-refresh")
          button.btn.outline.md(type="button" @click="router.push('/newsletter-add')") 글작성
    .tb-overflow
      table.table#tb-newsList
        colgroup
          col(style="width:5%")
          col(style="width: 50%")
          col(style="width: 10%")
          col(style="width: 10%")
        thead
          tr
            th NO
            th.left 제목
            th 작성일
            th 작성자
        tbody
          template(v-if="loading")
            tr.nohover.loading
              td(colspan="10")
                Loading#loading
          template(v-else-if="!newsletterList || newsletterList.length === 0")
            tr.nohover
              td(colspan="4") 등록된 공지사항이 없습니다.
          template(v-else)
            tr.hover(v-for="(news, index) in newsletterList" :key="news.record_id" @click="router.push({ path: '/newsletter-detail/' + news.record_id, query: { category: route.query.category } })")
              td {{ newsletterList.length - index }}
              td.left {{ news.data?.news_title }}
              td {{ convertTimestampToDateMillis(news.uploaded) }}
              td {{ news.writer }}

//- button.btn.outline(type="button" @click="testDelete") delete
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { newsletterList, getNewsletterList } from '@/notifications.ts';
import { convertTimestampToDateMillis } from '@/utils/time.ts';
import { skapi } from '@/main.ts';

import Loading from '@/components/loading.vue';

// const testDelete = () => {
//   skapi
//     .deleteRecords({
//       record_id: 'UkU0JXEeC9YEfDF6'
//     })
//     .then((res) => {
//       console.log('삭제완');
//     });
// };

// 게시판 공지
// 이메일 발송의 기존 방식 -> 게시판 형태의 공지 방식으로 변경
// 직원 모두 작성 가능
// 공지사항은 레코드에 저장
// 작성 시 공개범위, 알림발송 설정 가능하게
// --> 공개범위는 부서별로 선택 가능하게
// --> 알림발송은 허용/비허용 설정 가능하게 (공개범위에 해당하는 사람들에게만 알림발송)
// 목록에서 클릭 시, 상세 페이지로 이동
// 등록한 공지사항 삭제, 수정 가능
// 처음 작성시: 알람 허용이면 공개 범위에 해당하는 사람에게만 알람 보내기
// 올리고 수정시: 공개범위에 추가된 부서가 있으면 추가 부서 사람들에게만 알람 보내기
// 댓글 알람: 작성자에게만 알람 보내기, 만약 작성자가 본인글에 댓글 작성시에는 알람 안가는게 맞음
// 대댓글: 댓글 작성자 + 게시물 작성자 알람

const router = useRouter();
const route = useRoute();

const loading = ref(false);
const cateId = ref(route.query.category);

const searchFor = ref('subject', 'writer'); // 검색 조건
const searchValue = ref({
  subject: '',
  writer: ''
});

let dummyId = ''; // 카테고리별 더미 레코드 ID

// 카테고리별 더미 레코드 가져오기
const getNewsCatRecord = async () => {
  if (!cateId.value) {
    return;
  }

  try {
    const res = await skapi.getRecords({
      table: {
        name: `newsCatRecord_${cateId.value}`,
        access_group: 'private'
      }
    });

    dummyId = res.list[0].record_id;
    return dummyId;
  } catch (err) {
    if (err.message === 'No access.') {
      dummyId = '';
      alert('해당 게시글에 대한 권한이 없습니다.');
      router.push('/newsletter-category/');
    }
  }
};

// 게시글 검색
const searchNewsletter = async () => {
  loading.value = true;

  try {
    if (!dummyId) {
      await getNewsCatRecord();
    }

    await getNewsletterList(dummyId, true);

    if (
      (searchFor.value === 'subject' && !searchValue.value.subject) ||
      (searchFor.value === 'writer' && !searchValue.value.writer)
    ) {
      loading.value = false;
      return;
    }

    let filteredList = [...newsletterList.value];

    if (searchFor.value === 'subject' && searchValue.value.subject) {
      filteredList = filteredList.filter((item) =>
        item.data?.news_title?.toLowerCase().includes(searchValue.value.subject.toLowerCase())
      );
    } else if (searchFor.value === 'writer' && searchValue.value.writer) {
      filteredList = filteredList.filter((item) =>
        item.writer?.toLowerCase().includes(searchValue.value.writer.toLowerCase())
      );
    }

    newsletterList.value = filteredList;
  } catch (error) {
    console.error('Search error:', error);
  } finally {
    loading.value = false;
  }
};

// 새로고침
const refresh = async () => {
  loading.value = true;

  await getNewsCatRecord();

  if (searchValue.value) {
    searchValue.value = {
      subject: '',
      writer: ''
    };
  }

  await getNewsletterList(dummyId, true);
  loading.value = false;
};

watch(searchFor, (nv, ov) => {
  if (nv && nv !== ov) {
    searchValue.value = {
      subject: '',
      timestamp: {
        start: '',
        end: ''
      }
    };

    if (nv === 'timestamp') {
      searchValue.value.timestamp.start = new Date().toISOString().substring(0, 10);
      searchValue.value.timestamp.end = new Date().toISOString().substring(0, 10);
    }
  }
});

onMounted(async () => {
  loading.value = true;
  await getNewsCatRecord();
  await getNewsletterList(dummyId, true);
  loading.value = false;
});
</script>

<style lang="less" scoped>
.inner {
  max-width: 1600px;
  margin: 0 auto;
  padding: 2rem;
}

.table-wrap {
  #searchForm {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .what {
      flex: 1;
      min-width: 100px;
    }

    .date {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
    }
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

@media (max-width: 768px) {
  .inner {
    padding: 1rem;
  }
}
</style>
