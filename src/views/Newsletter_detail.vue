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
                    span.writer dd

                //- 모바일 경우 레이아웃
                tr.mo(v-show="!isDesktop" style="border-top: 1px solid var(--gray-color-300);")
                  th 작성 일자
                  td(colspan="3") {{ formatTimestampToDate(newsCont?.uploaded) }}
                tr.mo(v-show="!isDesktop")
                  th 기안자
                  td(colspan="3" style="text-align: left")
                    span.writer dd
                //- 작성일자 기안사 :: e

      //-           tr
      //-             th 제목
      //-             td.left(colspan="3") {{ newsCont?.data?.to_audit }}

      //-           tr.selected-dvs(v-if="selectedAuditors.receivers.length > 0")
      //-             th 공개 범위
      //-             td.left(colspan="3") {{ selectedAuditors.receivers.map(receiver => receiver.name).join(', ') }}

      //-           tr
      //-             th 결재 내용
      //-             td.left(colspan="3")
      //-               ._wysiwyg4all(v-html="disableContentEditable(newsCont?.data?.to_audit_content)")
                    

      //-           tr
      //-             th 첨부 파일
      //-             td.left(colspan="3")
      //-               .input-wrap.upload-file
      //-                 .file-wrap(style="margin: 0")
      //-                   ul.file-list(style="margin: 0")
      //-                     template(v-if="uploadedFile.length > 0")
      //-                       li.file-item(v-for="(file, index) in uploadedFile" :key="index")
      //-                         a.file-name(:href="file.url" download target="_blank") {{ file.filename }}
      //-                     template(v-if="uploadedFile.length === 0")
      //-                       li(style="color:var(--gray-color-300);") 등록된 파일이 없습니다.

      //-   h4.sub-title 의견

      //-   hr

      //-   ul.reply-list(v-if="auditorList.filter(auditor => auditor.comment && auditor.comment.trim() !== '').length > 0")
      //-     li.reply-item(v-for="(auditor, index) in auditorList.filter(auditor => auditor.comment && auditor.comment.trim() !== '')")
      //-       .auditor
      //-         .info
      //-           .name {{ auditor.user_info?.name }}
      //-           .approved(:class="{ 'reject': auditor.approved === 'reject' }")
      //-             template(v-if="auditor.approved === 'approve'") 승인자
      //-             template(v-else) 반려자
      //-         .date(v-if="auditor?.date") {{ formatTimestampToDate(auditor?.date) }}
      //-       .comment {{ auditor.comment || '-' }}
      //-   .empty(v-else) 결재 의견이 없습니다.


      //- .button-wrap
      //-   button.btn.outline.bg-gray.btn-print(type="button" @click="previewAudit")
      //-     .icon(style="padding: 0")
      //-       svg
      //-         use(xlink:href="@/assets/icon/material-icon.svg#icon-print")
      //-   button.btn.outline.warning.btn-cancel(type="button" v-if="senderUser.user_id === user.user_id && isCancelPossible" @click="canceledAudit" :disabled="isCanceled") 회수
      //-   button.btn.outline.btn-re-request(type="button" v-if="senderUser.user_id === user.user_id" @click="reRequestAudit") 재요청
      //-   button.btn.bg-gray.btn-cancel(type="button" @click="goToPrev") 이전
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted } from 'vue';
import { skapi } from '@/main.ts';
import { newsletterList, getNewsletterList } from '@/notifications.ts';

const router = useRouter();
const route = useRoute();

const isDesktop = ref(window.innerWidth > 768); // 반응형
const newsCont = ref([]); // 게시글 내용 저장 변수
const cate = ref(route.query.record_id); // 게시글 record_id
console.log('cate : ', cate.value);

function formatTimestampToDate(timestamp) {
  const date = new Date(timestamp); // timestamp를 Date 객체로 변환
  const year = date.getFullYear(); // 연도 가져오기
  const month = String(date.getMonth() + 1).padStart(2, '0'); // 월 가져오기 (0부터 시작하므로 +1)
  const day = String(date.getDate()).padStart(2, '0'); // 일 가져오기

  return `${year}-${month}-${day}`; // 형식화된 문자열 반환
}

onMounted(async () => {
  console.log('게시글 상세보기');
  const res = await getNewsletterList(cate.value);
  // newsCont.value = newsletterList.value.find(item => item.record_id === cate.value);
  newsCont.value = res;
  console.log('newsCont.value : ', newsCont.value);
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

.approver-wrap {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  text-align: center;
  height: 100%;

  .approver-list {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: 100px;
    min-height: 8rem;
    border-right: 1px solid var(--gray-color-300);
    border-bottom: 1px solid var(--gray-color-300);
    margin-bottom: -1px;
    position: relative;

    &.noexist {
      background-color: var(--gray-color-50);

      span {
        color: var(--gray-color-300);
      }
    }
  }

  .num {
    border-bottom: 1px solid var(--gray-color-200);
    padding: 0.25rem;
  }

  .sign {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    border-bottom: 1px solid var(--gray-color-200);
  }

  .approver {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0.25rem;
  }
}

.reference-wrap {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  text-align: center;

  .reference-list {
    display: flex;
    justify-content: center;
    background-color: var(--gray-color-50);
    border: 1px solid var(--gray-color-300);
    border-radius: 8px;
  }

  .referencer {
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

// 추가의견 영역
.sub-title {
  margin-top: 4rem;
}

.reply-list {
  // margin-bottom: 3rem;
  // margin-top: 3rem;

  .reply-item {
    // border: 1px dashed var(--gray-color-300);
    // border-radius: 8px;
    // padding: 0.5rem;
    // display: flex;
    // align-items: center;
    gap: 0.5rem;
    // margin-bottom: 0.5rem;
    margin-bottom: 1.5rem;

    &:last-of-type {
      margin-bottom: 0;
    }
  }

  .icon {
    padding: 0;
  }

  .reply-cont-wrap {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .auditor {
    display: flex;
    flex-wrap: wrap;
    gap: 0.7rem;
    align-items: center;
    margin-bottom: 0.5rem;
    padding-left: 0.2rem;

    .info {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .name {
      // display: inline-block;
      font-size: 0.9rem;
    }
    .approved {
      // display: inline-block;
      // margin-right: 4px;
      font-size: 12px;
      border: 1px solid var(--primary-color-300);
      padding: 3px 4px;
      border-radius: 8px;
      color: var(--primary-color-400);

      &.reject {
        color: var(--warning-color-400);
        border-color: var(--warning-color-400);
      }
    }
    .date {
      font-size: 0.8rem;
      color: var(--gray-color-400);
    }
  }

  .comment {
    background-color: var(--gray-color-50);
    padding: 0.8rem 1rem;
    border-radius: 20px;
    font-size: 0.9rem;

    &.reject {
      color: var(--warning-color-400);
    }
  }

  .approver {
    font-size: 0.9rem;

    // &::after {
    // 	content: ' : ';
    // 	display: inline-block;
    // 	margin-left: 0.5rem;
    // }
  }

  .reply-cont {
    font-size: 0.9rem;
    color: var(--gray-color-500);
    line-height: 1.2;

    &.reject {
      color: var(--warning-color-400);
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

.modal-stamp {
  .modal-body {
    p {
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
    }
  }
}

.modal-approve {
  .tab-menu {
    display: flex;
    align-items: center;
    justify-content: center;

    ul {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--gray-color-50);
      max-width: 300px;
      border-radius: 30px;

      li {
        cursor: pointer;
        font-size: 0.9rem;
        color: var(--gray-color-400);
        transition: all 0.3s;
        padding: 0.5rem 1rem;
        border-radius: 30px;

        &.active {
          color: #fff;
          background-color: var(--primary-color-400);
        }
        &.disabled {
          opacity: 0.5;
          cursor: default;
          pointer-events: none;
        }
      }
    }
  }
}

.stamp-wrap {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  // grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  // grid-template-columns: repeat(4, minmax(220px, 1fr));
  gap: 1rem;

  .stamp-grid {
    position: relative;
    width: 100%;

    &::after {
      content: '';
      display: block;
      padding-bottom: 100%;
    }

    &.loading {
      border: 0;
    }

    // .checkbox {
    // 	position: absolute;
    // 	top: 4px;
    // 	left: 4px;
    // 	z-index: 10;
    // }

    .stamp {
      position: absolute;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--gray-color-100);
      border-radius: 0.5rem;
      cursor: pointer;

      &.selected {
        border-color: var(--primary-color-400-dark);
        border-width: medium;
        background-color: var(--primary-color-25);
      }

      // .checkbox {
      //     position: absolute;
      //     top: 0.5rem;
      //     left: 0.5rem;
      // }

      .add-icon {
        position: absolute;
        width: 30px;
        height: 30px;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        fill: var(--primary-color-400);
        // transition: all 0.3s;
        // fill: var(--gray-color-300);
      }

      .delete-icon {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        width: 25px;
        height: 25px;
        fill: var(--gray-color-300);
        transition: all 0.3s;
        cursor: pointer;

        &:hover {
          fill: var(--warning-color-400);
        }
      }

      &.upload-btn {
        cursor: pointer;

        #stamp-img {
          background-color: unset;
          // transition: all 0.3s;
          border-color: var(--primary-color-300);

          &::before {
            content: '';
            background-color: unset;
          }
        }
        .name {
          // transition: all 0.3s;
          // color: var(--gray-color-300);
          color: var(--primary-color-400);
        }

        &.disabled {
          cursor: default;
          pointer-events: none;

          #stamp-img {
            border-color: var(--gray-color-300);
          }
          .add-icon {
            fill: var(--gray-color-300);
          }
          .name {
            color: var(--gray-color-300);
          }
        }

        // &:hover {
        //     #stamp-img {
        //         border-color: var(--primary-color-300);
        //     }
        //     .add-icon {
        //         fill: var(--primary-color-400);
        //     }
        //     .name {
        //         color:var(--primary-color-400);
        //     }
        // }
      }

      &.upload-preview {
        background-color: var(--primary-color-25);

        #stamp-img {
          background-color: var(--primary-color-25);
          border-color: var(--gray-color-200);
          opacity: 0.3;

          &::before {
            content: '미리보기';
            background-color: var(--primary-color-25);
          }
        }
        .name {
          opacity: 0.3;
        }
      }
    }

    .upload-options {
      position: absolute;
      top: 50%;
      left: 50%;
      // transform: translateX(-50% + 50px) translateY(-50% + 25px);
      transform: translateX(11%) translateY(-16%);
      // right: -113px;
      // bottom: -40px;
      z-index: 9;
      background-color: var(--gray-color-100);
      border: 1px solid var(--gray-color-300);
      padding: 5px;
      border-radius: 4px;

      li {
        font-size: 0.8rem;
        text-align: left;
        cursor: pointer;
        padding: 8px 12px;
        border-radius: 4px;

        &:first-child {
          margin-bottom: 4px;
        }
        &:hover {
          background-color: var(--primary-color-400);
          color: #fff;

          &.disabled {
            background-color: unset;
            color: unset;
          }
        }
        &.disabled {
          opacity: 0.25;
          cursor: default;
          pointer-events: none;
        }
      }
    }
  }
}

.previewStamp {
  display: inline-block;
  text-align: center;
  border: 1px solid var(--gray-color-100);
  border-radius: 0.5rem;
  padding: 4px;
  cursor: pointer;

  &.selected {
    border-color: var(--primary-color-400-dark);
    border-width: medium;
    background-color: var(--primary-color-25);
    border-style: solid;
  }
}

#stamp-img,
.previewStamp img {
  width: 100px;
  height: 100px;
  border-radius: 30%;
  display: block;
  object-fit: contain;
  position: relative;
  // background-color: #fff;
  border: 2px dashed var(--gray-color-100);
  // margin-bottom: 0.5rem;

  &::before {
    content: '도장 등록';
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: #888;
    background-color: #fff;
    font-size: 14px;
    text-align: center;
    position: absolute;
    top: 0;
    left: 0;
  }
}

.rejected {
  color: var(--warning-color-400);
}

.waitting {
  color: var(--gray-color-500);
}

._wysiwyg4all {
  padding: 0;
}

.reject-setting {
  margin-bottom: 0.5rem;
  text-align: right;
  font-size: 0.9rem;
  color: var(--warning-color-500);
}

@media print {
  #main,
  .wrap {
    padding: 0 !important;
  }

  .wrap {
    + .title {
      display: none !important;
    }
  }

  hr {
    display: none !important;
  }

  .form-wrap {
    position: absolute;
    top: 5%;
    left: 0;
    width: 100%;
  }

  #tb-detail-newsForm {
    font-size: 0.75rem;
  }

  .sub-title {
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--gray-color-300);
  }

  .reply-list {
    .auditor {
      margin-bottom: 0.75rem;
    }

    .comment {
      border: 1px solid var(--gray-color-300);
      font-size: 0.75rem;
      padding: 0.75rem 1rem;
    }
  }

  .input-wrap.upload-file .file-item,
  .selected-wrap.upload-file .file-item {
    border-color: var(--gray-color-400);
  }

  .approver-wrap {
    grid-template-columns: repeat(6, 1fr) !important;

    .approver-list {
      min-height: 5rem;

      .auditor {
        .name {
          font-size: 0.75rem;
        }

        .approved {
          font-size: 0.625rem;
        }

        .date {
          font-size: 0.75rem;
        }
      }
    }

    .sign {
      height: 3.5rem;

      img {
        width: 3rem;
        height: 3rem;
      }
    }
  }

  .table {
    tbody {
      th {
        border-right: 1px solid var(--gray-color-300);
        border-left: 1px solid var(--gray-color-300);
      }

      td {
        height: 2rem;
        padding: 0.5rem;
      }
    }

    tr {
      td {
        border-right: 1px solid var(--gray-color-300);
      }
    }
  }
}

@media (max-width: 768px) {
  .approver-wrap {
    grid-template-columns: repeat(5, 1fr);
  }

  .stamp-wrap {
    .stamp-grid {
      .upload-options {
        transform: translateX(10%) translateY(-12%);

        li {
          font-size: 1rem;
          padding: 10px 14px;
        }
      }
    }
  }

  .reject-setting {
    text-align: left;
  }
}

@media (max-width: 682px) {
  .input-wrap {
    &.upload-file {
      .btn-upload-file {
        input,
        label,
        button {
          flex-grow: 1;
        }
      }
      .btn-upload-file + .file-list {
        .file-item {
          width: 100%;
        }
      }

      .file-item {
        width: 100%;
      }
    }
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
