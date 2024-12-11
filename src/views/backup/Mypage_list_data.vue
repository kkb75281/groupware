<template lang="pug">
.wrap
  h1.title 자료실

  hr

  .table-wrap
      .tb-head-wrap
          .input-wrap.search
              input(type="text" placeholder="검색어를 입력하세요")
              button.btn-search

          .tb-toolbar
              .btn-wrap
                  button.btn.outline.warning.btn-remove 삭제

      .tb-overflow
          template(v-if="loading")
              Loading#loading
          table.table#employee_list
              colgroup
                  col(style="width: 3rem;")
                  col(style="width: 3rem;")
                  col
                  col(style="width: 10%;")
              thead
                  tr
                      th(scope="col")
                          label.checkbox
                              input(type="checkbox" name="checkbox")
                              span.label-checkbox
                      th(scope="col") NO
                      th.left(scope="col") 파일명
                      th(scope="col") 상세보기
              tbody
                  tr
                      td
                          label.checkbox
                              input(type="checkbox" name="checkbox")
                              span.label-checkbox
                      td.list-num 1
                      td.left 파일명
                      td
                          .btn-wrap
                                button.btn.bg-gray.sm 상세보기

      //- .pagination
          button.btn-prev.icon(type="button") 
              svg
                  use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-back-ios")
              | Prev
          button.btn-next.icon(type="button" @click="currentPage++;" :class="{'nonClickable': endOfList && currentPage >= maxPage }") Next
              svg
                  use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")

  br
  br
  br
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, computed, watch, onMounted } from 'vue';
import { skapi } from '@/main';
import { user } from '@/user';

import Loading from '@/components/loading.vue';

let router = useRouter();
let route = useRoute();

let loading = ref(false);
let currentPage = ref(1);

</script>

<style scoped lang="less">

</style>