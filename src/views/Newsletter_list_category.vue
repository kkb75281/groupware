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
                  button.btn.outline(type="button" @click="router.push('/newsletter-add')" :disabled="loading") 글작성
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
                              //- router-link.go-news-list(:to="{ name: 'newsletter', query: { category: category.index.value} }")
                              router-link.go-news-list(:to="{ name: 'newsletter', query: { category: category.record_id} }")
                                  span {{ category.data.news_category }}
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, computed, onMounted } from 'vue';
import { skapi } from '@/main.ts';
// import { newsletterList, getNewsletterList } from '@/notifications.ts';

import Loading from '@/components/loading.vue';

const router = useRouter();
const route = useRoute();

const loading = ref(false);
const newsCatList = ref([]); // 게시글 카테고리명 리스트
let currentPage = ref(1);
let selectedList = ref({});
let searchValue = ref('');
let isAllSelected = computed(() => {
  let keys = Object.keys(newsCatList.value);
  return keys.length > 0 && keys.every((key) => Object.keys(selectedList.value).includes(key));
});

let toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedList.value = {};
  } else {
    for (let key in newsCatList.value) {
      selectedList.value[key] = newsCatList.value[key].data.news_category;
    }
  }
};

let toggleSelect = (id, name) => {
  if (selectedList.value[id]) {
    delete selectedList.value[id];
  } else {
    selectedList.value[id] = name;
  }
};

// 게시글 카테고리명 리스트 가져오기
const getNewsCat = async () => {
  const res = await skapi.getRecords({
    table: {
      name: 'news_category_list',
      access_group: 1
    }
  });
  // console.log('카테고리 리스트 : ', res);

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

const deleteNewsCat = async () => {
  if (!Object.keys(selectedList.value).length) {
    alert('삭제할 카테고리를 선택해주세요.');
    return;
  }

  loading.value = true;

  let recordIds = Object.keys(selectedList.value);
  let categoryNames = Object.values(selectedList.value);

  let isSuccess = [];
  let isFail = [];

  // 카테고리 삭제
  await Promise.all(
    recordIds.map((el) => {
      return skapi
        .deleteRecords({ record_id: el })
        .then((res) => {
          isSuccess.push(el);
          delete newsCatList.value[el];
        })
        .catch((err) => {
          isFail.push(el);
          alert('카테고리 삭제에 실패하였습니다. 관리자에게 문의해주세요.');
          throw err;
        });
    })
  );

  newsCatList.value = { ...newsCatList.value }; // 새 참조로 업데이트

  if (isSuccess.length > 0) {
    alert(`${isSuccess.length}개의 카테고리가 삭제되었습니다.`);
  }

  if (isFail.length > 0) {
    alert(`${isFail.length}개의 카테고리 삭제에 실패했습니다.`);
  }

  selectedList.value = {};
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
  // getNewsletterList();
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
