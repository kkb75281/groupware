<template lang="pug">
//- h1 게시판 카테고리 목록

//- hr

.inner
  .table-wrap
      .tb-head-wrap
          form#searchForm(@submit.prevent="searchNewsCat")
              //- .input-wrap.search
                  input(type="text" v-model="searchValue" placeholder="카테고리명을 입력하세요.")

          .tb-toolbar
              .btn-wrap
                  button.btn.outline.refresh-icon(:disabled="loading" @click="refresh")
                      svg(:class="{'rotate' : loading}")
                          use(xlink:href="@/assets/icon/material-icon.svg#icon-refresh")
                  button.btn.outline(v-if="user.access_group > 98" type="button" @click="router.push('/newsletter-add')" :disabled="loading") 글작성
      .tb-overflow
          table.table#tb-newsCat
              colgroup
                  col(style="width: 3rem")
                  col
              thead
                  tr
                      th(scope="col") NO
                      th.left(scope="col") 카테고리명

              tbody
                  template(v-if="loading")
                      tr.loading(style="border-bottom: none;")
                          td(colspan="5" style="padding: 0; height: initial;")
                              Loading#loading
                  template(v-else-if="Object.keys(newsCatList).length === 0")
                      tr
                          td(colspan="5") 데이터가 없습니다.
                  template(v-else)
                      tr(v-for="(category, key, index) in newsCatList" :key="category.record_id")
                          td.list-num {{ index + 1 }}
                          td.left 
                              router-link.go-news-list(:to="{ name: 'newsletter', query: { category: category.record_id} }")
                                  span {{ category.data.news_category }}
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, computed, onMounted } from 'vue';
import { skapi } from '@/main.ts';
import { user } from '@/user.ts';

import Loading from '@/components/loading.vue';

const router = useRouter();
const route = useRoute();

const loading = ref(false);
let searchValue = ref(''); // 검색어
const newsCatList = ref([]); // 카테고리 리스트

// 카테고리 리스트 가져오기
const getNewsCat = async () => {
  const res = await skapi.getRecords({
    table: {
      name: 'news_category',
      access_group: 1
    }
  });

  if (res && res.list) {
    newsCatList.value = res.list.reduce((acc, cur) => {
      acc[cur.record_id] = cur;
      return acc;
    }, {});
  } else {
    newsCatList.value = {};
  }
};

const refresh = async () => {
  loading.value = true;

  await getNewsCat();

  if (searchValue.value) {
    searchValue.value = '';
  }

  loading.value = false;
};

// 카테고리명 검색
const searchNewsCat = async () => {
  loading.value = true;

  return;

  const res = await skapi.getRecords({
    table: {
      name: 'divisions',
      access_group: 99
    },
    index: {
      name: 'divisionName',
      // value: searchValue.value,
      value: searchValue.value.replace(/\//g, '_'),
      condition: '>='
    }
  });

  if (res.list.length > 0) {
    divisions.value = res.list.reduce((acc, cur) => {
      acc[cur.record_id] = cur;
      return acc;
    }, {});
  } else {
    divisions.value = {};
  }

  if (!searchValue.value) {
    getDivisionData(true);
  }

  loading.value = false;
};

onMounted(() => {
  getNewsCat();
});
</script>

<style scoped lang="less">
.inner {
  max-width: 1600px;
  margin: 0 auto;
  padding: 2rem;
}

#tb-newsCat > a > * {
  vertical-align: middle;
}

.division-logo {
  width: 2rem;
  height: 2rem;
  object-fit: contain;
}

.go-news-list {
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

@media (max-width: 768px) {
  .inner {
    padding: 1rem;
  }
}
</style>
