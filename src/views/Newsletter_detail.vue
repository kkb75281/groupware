<template lang="pug">
//- .title
  h1 게시글 상세

//- hr

.inner
  .form-wrap
    form#_detail_news_form(@submit.prevent="editNews")
      #printArea
        .table-wrap
          .tb-overflow
            table.table#tb-detail-newsForm
              colgroup
                col(style="width: 13%")
                col
                col(style="width: 15%")
                col(style="width: 20%")

              tbody
                //- 작성일자 기안사 :: s
                tr.pc(v-show="isDesktop")
                  th 작성 일자
                  td {{ formatTimestampToDate(newsCont?.uploaded) }}
                  th 작성자
                  td
                    span.writer {{ newsCont?.writer }}

                //- 모바일 경우 레이아웃
                tr.mo(v-show="!isDesktop" style="border-top: 1px solid var(--gray-color-300);")
                  th 작성 일자
                  td(colspan="3") {{ formatTimestampToDate(newsCont?.uploaded) }}
                tr.mo(v-show="!isDesktop")
                  th 기안자
                  td(colspan="3" style="text-align: left")
                    span.writer {{ newsCont?.writer }}
                //- 작성일자 기안사 :: e

                tr
                  th 제목
                  td.left(colspan="3") 
                    .title-wrap
                      p.title {{ newsCont?.data?.news_title }}
                      span.edit(v-if="newsCont?.data?.isEdit") 수정됨

                tr.selected-dvs
                  th 공개 범위
                  //- td.left(colspan="3") {{ newsCont?.data?.selDvs }}
                  td.left(colspan="3")
                    ul.dvs-wrap
                      li.dvs-list(v-if="newsCont?.data?.selDvs" v-for="(item, index) in Object.values(newsCont?.data?.selDvs.split(','))" :key="index")
                        span.dvs-name {{ item.split('.')[1] }}
                      
                      li.dvs-list(v-else)
                        span.dvs-name 전체

                tr
                  th 내용
                  td.left(colspan="3" style="height: 10rem;")
                    ._wysiwyg4all(v-html="disableContentEditable(newsCont?.data?.to_news_content)")
                    

                tr
                  th 첨부 파일
                  td.left(colspan="3")
                    .input-wrap.upload-file
                      .file-wrap(style="margin: 0")
                        ul.file-list(style="margin: 0")
                          template(v-if="uploadedFile.length > 0")
                            li.file-item(v-for="(file, index) in uploadedFile" :key="index")
                              a.file-name(:href="file.url" download target="_blank") {{ file.filename }}
                          template(v-if="uploadedFile.length === 0")
                            li(style="color:var(--gray-color-300);") 등록된 파일이 없습니다.

      .button-wrap  
        template(v-if="newsCont?.writer === user.name")
          button.btn.md.outline.warning.btn-delete(type="button" @click="deleteNews") 삭제
          button.btn.md.outline.btn-edit(type="button" @click="editNews") 수정
        button.btn.md.bg-gray(type="button" @click="router.push({ path: '/newsletter', query: { category: route.query.category } })") 목록

</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted } from 'vue';
import { skapi } from '@/main.ts';
import { user } from '@/user.ts';
import { newsletterList, getNewsletterList } from '@/notifications.ts';

const router = useRouter();
const route = useRoute();

const isDesktop = ref(window.innerWidth > 768); // 반응형
const cateId = ref(route.query.category); // 카테고리 ID
const newsId = ref(route.params.record_id); // 게시글 record_id
const newsCont = ref([]); // 게시글 내용 저장 변수
const uploadedFile = ref([]); // 첨부파일
const editModeData = ref({}); // 수정 모드 데이터

// 작성일 날짜
function formatTimestampToDate(timestamp) {
  const date = new Date(timestamp); // timestamp를 Date 객체로 변환
  const year = date.getFullYear(); // 연도 가져오기
  const month = String(date.getMonth() + 1).padStart(2, '0'); // 월 가져오기 (0부터 시작하므로 +1)
  const day = String(date.getDate()).padStart(2, '0'); // 일 가져오기

  return `${year}-${month}-${day}`; // 형식화된 문자열 반환
}

// 내용 가져오기
function disableContentEditable(htmlString) {
  // 임시 div 생성
  const tempDiv = document.createElement('div');

  // HTML 문자열 삽입
  tempDiv.innerHTML = htmlString;

  // 모든 contenteditable="true" 태그 찾아 false로 변경
  tempDiv.querySelectorAll('[contenteditable="true"]').forEach((el) => {
    el.setAttribute('contenteditable', 'false');
  });

  // 변경된 HTML 문자열 반환
  return tempDiv.innerHTML;
}

// 게시글 수정
const editNews = () => {
  console.log('게시글 수정');
  editModeData.value = newsCont.value;

  router.push({
    path: '/newsletter-add',
    query: {
      mode: 'edit',
      news: newsId.value,
      category: cateId.value
    }
  });
};

// 게시글 삭제
const deleteNews = async () => {
  const res = await skapi.deleteRecords({
    record_id: newsId.value
  });

  if (res) {
    alert('삭제되었습니다.');
    router.back();
  } else {
    alert('삭제에 실패했습니다.');
  }
};

onMounted(async () => {
  const res = await getNewsletterList(cateId.value);

  if (res) {
    newsCont.value = res.find((el) => el.record_id === newsId.value);

    // 첨부파일 리스트
    if (Object.keys(newsCont.value.bin).length && newsCont.value.bin.form_data.length) {
      let fileList = [];
      let form_data = newsCont.value.bin.form_data;

      function getFileUserId(str) {
        if (!str) return '';
        return str.split('/')[3];
      }

      const result = form_data.map((el) => ({
        ...el,
        user_id: getFileUserId(el.path)
      }));

      fileList.push(...result);

      uploadedFile.value = fileList;
    } else {
      uploadedFile.value = [];
    }
  } else {
    newsCont.value = [];
  }
});
</script>

<style scoped lang="less">
.inner {
  max-width: 1600px;
  margin: 0 auto;
  padding: 2rem;
}

.title {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 1rem;

  span {
    color: var(--gray-color-400);
    line-height: 1.4;
  }
}

.wrap {
  padding: 3rem 2.4rem;
}

.form-wrap {
  position: relative;
  max-width: 900px;

  .title {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: baseline;
    gap: 4px;
    flex-wrap: wrap;
    margin-bottom: 2rem;

    h2 {
      font-size: 2rem;
      line-height: 1.2;
    }

    .icon {
      padding: 0;
      cursor: pointer;
    }
  }
}

.table {
  tr {
    td {
      padding: 0.75rem;
    }
  }

  tbody {
    th {
      position: relative;

      .add-btn {
        position: absolute;
        left: 50%;
        bottom: -12px;
        background-color: #fff;
        border: 1px solid var(--primary-color-300);
        border-radius: 50%;
        transform: translateX(-50%);
        z-index: 10;
        cursor: pointer;

        .icon {
          padding: 0;

          svg {
            width: 18px;
            height: 18px;
            fill: var(--primary-color-400);
          }
        }

        &:hover {
          background-color: var(--primary-color-50);
        }
      }
    }
    tr {
      &:hover {
        background-color: transparent;
      }

      &:first-of-type {
        border-top: 1px solid var(--gray-color-300);
      }
    }
  }
}

.dvs-wrap {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  text-align: center;

  .dvs-list {
    display: flex;
    justify-content: center;
    background-color: var(--gray-color-50);
    border: 1px solid var(--gray-color-300);
    border-radius: 8px;
  }

  .dvs-name {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    padding: 0.25rem;
    gap: 2px;

    .icon {
      padding: 0;

      &:hover {
        cursor: pointer;
      }
    }
  }
}

.empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  font-size: 0.875rem;
  line-height: 1.2;
  color: var(--gray-color-400);
  // cursor: pointer;
}

.button-wrap {
  margin-top: 3rem;
}

.btn {
  margin-top: 0;
}

._wysiwyg4all {
  padding: 0;
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .title {
    margin-bottom: 0;
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

<style lang="less">
._wysiwyg4all {
  ul {
    list-style: disc !important;
    padding: initial !important;
    padding-inline-start: 40px !important;
  }

  ol {
    list-style: decimal !important;
    padding: initial !important;
    padding-inline-start: 40px !important;
  }

  li {
    list-style: inherit !important;
    padding: initial !important;
  }
}
</style>
