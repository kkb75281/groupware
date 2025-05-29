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
          button.btn.outline.md(type="button" @click="writeNews") 글작성
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
              td.left
                .title-wrap
                  p.title {{ news.data?.news_title }}
                  span.edit(v-if="news.data?.isEdit") 수정됨
              td {{ convertTimestampToDateMillis(news.uploaded) }}
              td {{ news.writer }}

//- .pagination
    button.btn-prev.icon(type="button" @click="currentPage--;" :class="{'nonClickable': fetching || currentPage <= 1 }")
        svg
            use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-back-ios")
        | Prev

    button.btn-next.icon(type="button" @click="currentPage++;" :class="{'nonClickable': fetching || endOfList && currentPage >= maxPage }") Next
        svg
            use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { newsletterList, getNewsletterList } from '@/notifications.ts';
import { convertTimestampToDateMillis } from '@/utils/time.ts';
import { skapi } from '@/main.ts';
import Pager from '@/components/pager';

import Loading from '@/components/loading.vue';

const router = useRouter();
const route = useRoute();

const loading = ref(false);
const cateId = ref(route.query.category);

const searchFor = ref('subject', 'writer'); // 검색 조건
const searchValue = ref({
    subject: '',
    writer: ''
});

let pager = null;
const fetching = ref(false); // 데이터를 가져오는 중인지 여부
const maxPage = ref(0); // 최대 페이지 수
const currentPage = ref(1); // 현재 페이지
const endOfList = ref(false); // 리스트의 끝에 도달했는지 여부
const ascending = ref(false); // 오름차순 정렬 여부

// 게시글 검색
const searchNewsletter = async () => {
    loading.value = true;

    try {
        await getNewsletterList(cateId.value);

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
                item.data?.news_title
                    ?.toLowerCase()
                    .includes(searchValue.value.subject.toLowerCase())
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

    if (searchValue.value) {
        searchValue.value = {
            subject: '',
            writer: ''
        };
    }

    await getNewsletterList(cateId.value);
    loading.value = false;
};

// 게시글 작성
const writeNews = () => {
    router.push({
        path: '/newsletter-add',
        query: {
            mode: 'category',
            category: cateId.value
        }
    });
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

// 페이지네이션
const getPage = async (refresh = false) => {
    if (refresh) {
        endOfList.value = false;
        currentPage.value = 1;
    }

    if (refresh) {
        pager = await Pager.init({
            id: 'record_id',
            resultsPerPage: 3,
            sortBy: 'uploaded',
            order: ascending.value ? 'asc' : 'desc'
        });
    }

    if ((!refresh && maxPage.value >= currentPage.value) || endOfList.value) {
        tempSaveList.value = pager.getPage(currentPage.value).list;
        return;
    } else if (!endOfList.value || refresh) {
        fetching.value = true;

        try {
            // fetch from server
            let fetchOptions = Object.assign(
                { fetchMore: !refresh },
                { limit: 3, ascending: false }
            );
            let fetchedData = await getTempSaveMyDoc(fetchOptions);

            // save endOfList status
            endOfList.value = fetchedData.endOfList;

            // insert data in pager
            if (fetchedData.list.length > 0) {
                await pager.insertItems(fetchedData.list);
            }

            // get page from pager
            let disp = pager.getPage(currentPage.value);

            // set maxpage
            maxPage.value = disp.maxPage;

            // render data
            tempSaveList.value = disp.list;
        } catch (error) {
            console.error('Error getting page:', error);
            tempSaveList.value = [];
        } finally {
            fetching.value = false;
        }
    }
};

// 페이지 변경 시 데이터 가져오기
watch(currentPage, (n, o) => {
    if (n !== o && n > 0 && (n <= maxPage.value || (n > maxPage.value && !endOfList.value))) {
        getPage();
    } else {
        currentPage.value = o; // 페이지가 유효하지 않으면 이전 페이지로 되돌리기
    }
});

onMounted(async () => {
    newsletterList.value = [];
    // await getPage(true);
    await getNewsletterList(cateId.value).catch((err) => {
        if (
            err.code === 'INVALID_REQUEST' ||
            err.message.includes(
                `User's private access for reference: \"${cateId.value}\" does not exist.`
            ) ||
            err.message === 'User has no private access.'
        ) {
            newsletterList.value = [];
            alert('해당 게시글에 대한 권한이 없습니다.');
            router.push('/newsletter-category/');
        }
    });
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

.title-wrap {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .title {
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
    }

    .edit {
        font-size: 0.625rem;
        background-color: var(--gray-color-200);
        border-radius: 6px;
        padding: 1px 4px;
        display: inline-block;
        position: relative;
        top: 1px;
    }
}

@media (max-width: 768px) {
    .inner {
        padding: 1rem;
    }
}
</style>
