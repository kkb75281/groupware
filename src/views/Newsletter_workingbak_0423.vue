<template lang="pug">
//- .title
//- 	h1 공지사항 dd

//- hr

.inner
  .table-wrap
    .tb-head-wrap(v-if="user.access_group > 98")
      form#searchForm(@submit.prevent="searchNewsletter")
        .input-wrap.what
          select(v-model="searchFor" :disabled="loading || !newsletterList")
            option(value="subject") 제목
        .input-wrap.search(v-if="searchFor == 'subject'")
          input(v-model="searchValue.subject" type="text" placeholder="검색어를 입력하세요" :disabled="loading || !newsletterList")
          button.btn-search
        .input-wrap.date(v-else-if="searchFor == 'timestamp'")
          input(v-model="searchValue.timestamp.start" type="date" :disabled="loading || !newsletterList")
          span ~
          input(v-model="searchValue.timestamp.end" type="date" :disabled="loading || !newsletterList")
      .tb-toolbar
        .btn-wrap
          button.btn.outline.refresh-icon(:disabled="loading" @click="searchNewsletter(true)")
            svg(:class="{'rotate' : loading}")
              use(xlink:href="@/assets/icon/material-icon.svg#icon-refresh")
          button.btn.outline.md(v-if="user.access_group >= 98" type="button" @click="sendAdminNewsletter") 등록
    .tb-overflow
      table.table#newsletter_list
        colgroup
          col(style="width:5%")
          col(style="width: 50%")
          col(style="width: 10%")
        thead
          tr
            th NO
            th.left 제목
            th 작성일
        tbody
          template(v-if="loading")
            tr.nohover.loading
              td(colspan="10")
                Loading#loading
          template(v-else-if="!newsletterList || newsletterList.length === 0")
            tr.nohover
              td(colspan="4") 등록된 공지사항이 없습니다.
          template(v-else)
            tr.hover(v-for="(news, index) in newsletterList" :key="news.message_id" @click="router.push('/newsletter-detail/' + news.message_id)")
              td {{ newsletterList.length - index }}
              td.left {{ news.subject }}
              td {{ convertTimestampToDateMillis(news.timestamp) }}
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { newsletterList, getNewsletterList } from '@/notifications.ts';
import { convertTimestampToDateMillis } from '@/utils/time.ts';
import { openGmailAppOrWeb } from '@/utils/mail.ts';
import { skapi } from '@/main.ts';
import { user } from '@/user.ts';

import Loading from '@/components/loading.vue';

// 게시판 공지
// 이메일 발송의 기존 방식 -> 게시판 형태의 공지 방식으로 변경
// 직원 모두 작성 가능
// 공지사항은 레코드에 저장
// 마스터, 관리자만 목록에서 삭제 가능 (assess_group >= 98)
// 목록에서 클릭 시, 상세 페이지로 이동
// 공지사항 수정 가능
// 새로운 공지사항 등록 시, 알림 발송 (미정: 확인 후 결정)

const router = useRouter();
const route = useRoute();

const loading = ref(false);
const searchFor = ref('subject');
const searchValue = ref({
  subject: '',
  timestamp: {
    start: '',
    end: ''
  }
});

const searchNewsletter = async (refresh = false) => {
  loading.value = true;

  if (searchValue.value.subject === '' || refresh) {
    await getNewsletterList(true);
    loading.value = false;
    return;
  }

  let params = {
    searchFor: searchFor.value,
    value: '',
    group: 'public',
    condition: '>='
  };

  if (searchFor.value === 'subject') {
    params.value = searchValue.value.subject;
  } else {
    params.value = searchValue.value.timestamp.start;
  }

  let res = await skapi.getNewsletters(params);

  if (res && res.list.length > 0) {
    newsletterList.value = res.list;
  } else {
    newsletterList.value = [];
  }

  loading.value = false;
};

const sendAdminNewsletter = async () => {
  console.log('새로운 공지사항 등록');
  router.push('/newsletter-add');
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
  await getNewsletterList();
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
</style>
