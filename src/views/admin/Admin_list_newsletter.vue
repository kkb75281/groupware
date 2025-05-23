<template lang="pug">
//- h1 게시판 관리

//- hr

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
                button.btn.outline.warning(:disabled="!Object.keys(selectedList).length || loading" @click="deleteNewsCat") 삭제
                button.btn.outline(:disabled="loading" @click="router.push('/admin/add-newsCat')") 등록
    .tb-overflow
        table.table#tb-newsCat
            colgroup
                col(style="width: 3rem")
                col(style="width: 3rem")
                col
            thead
                tr
                    th(scope="col")
                        label.checkbox
                            input(type="checkbox" name="checkbox" :checked="isAllSelected" @change="toggleSelectAll")
                            span.label-checkbox
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
                        td 
                            label.checkbox
                                input(type="checkbox" name="checkbox" :checked="Object.keys(selectedList).includes(category.record_id)" @click="toggleSelect(category.record_id, category.data.news_category)")
                                span.label-checkbox
                        td.list-num {{ index + 1 }}
                        td.left 
                            router-link.go-detail(:to="{ name: 'edit-newsCat', query: { record_id: category.record_id } }")
                                span {{ category.data.news_category }}
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, computed, onMounted } from 'vue';
import { skapi } from '@/main.ts';

import Loading from '@/components/loading.vue';

const router = useRouter();
const route = useRoute();

const loading = ref(false);
const newsCatList = ref([]); // 카테고리 리스트

// 테이블 체크박스 관련 변수
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

// 카테고리 리스트 가져오기
const getNewsCat = async () => {
  const res = await skapi.getRecords({
    table: {
      name: 'news_category',
      access_group: 1
    }
  });

  newsCatList.value = res.list.reduce((acc, cur) => {
    acc[cur.record_id] = cur;
    return acc;
  }, {});
};

const refresh = async () => {
  loading.value = true;

  getNewsCat();

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
});
</script>

<style scoped lang="less">
#tb-newsCat > a > * {
  vertical-align: middle;
}

.division-logo {
  width: 2rem;
  height: 2rem;
  object-fit: contain;
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
</style>
