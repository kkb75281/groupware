<template lang="pug">
//- .title
//- 	h1 결재 양식 상세

//- hr

.form-wrap
	.title
		h2 {{ docFormCont?.data?.docform_title || docFormCont?.data?.form_title }}

	.table-wrap
		.tb-overflow
			table.table#tb-docFormDetail
				colgroup
					col(style="width: 13%")
					col
					//- col(style="width: 15%")
					//- col(style="width: 20%")

				tbody
					//- 작성일자 기안사 :: s
					//- tr.pc(v-show="isDesktop")
					//- 	th 작성 일자
					//- 	td
					//- 		.input-wrap
					//- 			input#inp_date(type="text" name="inp_date" readonly)
					//- 	th 기안자
					//- 	td
					//- 		span.drafter
					//- //- 모바일 경우 레이아웃
					//- tr.mo(v-show="!isDesktop" style="border-top: 1px solid var(--gray-color-300);")
					//- 	th 작성 일자
					//- 	td(colspan="3")
					//- 		.input-wrap
					//- 			input#inp_date(type="text" name="inp_date" readonly)
					//- tr.mo(v-show="!isDesktop")
					//- 	th 기안자
					//- 	td(colspan="3" style="text-align: left")
					//- 		span.drafter
					//- 작성일자 기안사 :: e

					tr(v-if="selectedAuditors.approvers.length === 0 && selectedAuditors.agreers.length === 0 && selectedAuditors.receivers.length === 0" style="height: 119px;")
						th.essential 결재 라인
						td.left(colspan="3")
							span.empty(style="cursor: default;") 선택된 결재자가 없습니다.

					tr.approval(v-if="selectedAuditors.approvers.length > 0")
						th 결재
						td.left(colspan="3" style="padding: 0; height: 119px;")
							ul.approver-wrap
								li.approver-list(v-for="(approver, index) in selectedAuditors.approvers" :key="approver.data.user_id")
									span.num {{ approver.order }}
									span.approver {{ approver.index.value }}

					tr.approval(v-if="selectedAuditors.agreers.length > 0")
						th 합의
						td.left(colspan="3" style="padding: 0; height: 119px;")
							ul.approver-wrap
								li.approver-list(v-for="(agreer, index) in selectedAuditors.agreers" :key="agreer.data.user_id")
									span.num {{ agreer.order }}
									span.approver {{ agreer.index.value }}

					tr.reference(v-if="selectedAuditors.receivers.length > 0")
						th 수신 참조
						td.left(colspan="3")
							ul.reference-wrap
								li.reference-list(v-for="(receiver, index) in selectedAuditors.receivers" :key="receiver.data.user_id")
									span.referencer {{ receiver.index.value }}

					tr
						th.essential 제목
							//- .add-btn
								.icon
									svg
										use(xlink:href="@/assets/icon/material-icon.svg#icon-add")
						td.left(colspan="3")

					tr
						th.essential 결재 내용
						td.left(colspan="3" style="height: 10rem;")
							._wysiwyg4all(v-html="disableContentEditable(docFormCont?.data?.form_content)" style="padding: 0;")

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
		button.btn.bg-gray.btn-cancel(type="button" @click="router.push('/admin/list-form')") 목록
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, computed, onMounted } from 'vue';
import { skapi } from '@/main.ts';
import Loading from '@/components/loading.vue';
import Wysiwyg from '@/components/wysiwyg.vue';

const router = useRouter();
const route = useRoute();

const loading = ref(false);
const isDesktop = ref(window.innerWidth > 768); // 반응형
const docFormCont = ref({}); // 결재 양식 내용
const formRecordId = ref(''); // 결재 양식 record_id
const uploadedFile = ref([]); // 첨부 파일 목록
const addRows = ref([]);
const rejectSetting = ref(false); // 반려 설정 관련 체크박스

// 결재자 정보 저장
const selectedAuditors = ref({
  approvers: [], // 결재
  agreers: [], // 합의
  receivers: [] // 수신참조
});

// 결재자 데이터 변환 함수
const convertAuditorFormatWithOrder = (auditors) => {
  return auditors.map((auditor) => ({
    data: { user_id: auditor.user_id },
    index: {
      value: auditor.name,
      name: `${auditor.division}.${auditor.position}`
    },
    order: auditor.order || 0
  }));
};

// 에디터 편집 불가 처리
function disableContentEditable(htmlString) {
  // 임시 div 생성
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlString;

  // 모든 contenteditable="true" 태그 찾아 false로 변경
  tempDiv.querySelectorAll('[contenteditable="true"]').forEach((el) => {
    el.setAttribute('contenteditable', 'false');
  });

  tempDiv.querySelectorAll('.btn-control-wrap').forEach((el) => {
    el.style.display = 'none';
  });

  tempDiv.querySelectorAll('.table-resizer').forEach((el) => {
    el.style.display = 'none';
  });

  // 변경된 HTML 문자열 반환
  return tempDiv.innerHTML;
}

// 결재 양식 상세 조회
const getDocFormDetail = async () => {
  loading.value = true;

  try {
    const formDetail = await skapi.getRecords({
      record_id: formRecordId.value
    });
    console.log('=== getDocFormDetail === formDetail : ', formDetail);

    docFormCont.value = formDetail.list[0];

    // 체크박스 상태 가져오기
    if (docFormCont.value.data.reject_setting !== undefined) {
      rejectSetting.value =
        docFormCont.value.data.reject_setting === 'true' ||
        docFormCont.value.data.reject_setting === true;
    } else {
      rejectSetting.value = false; // 기본값 false
    }

    // 결재자 정보 가져오기
    if (docFormCont.value.data && docFormCont.value.data.auditors) {
      try {
        const auditors = JSON.parse(docFormCont.value.data.auditors);

        // 각 결재 타입별로 변환
        selectedAuditors.value = {
          approvers: convertAuditorFormatWithOrder(auditors.approvers || []),
          agreers: convertAuditorFormatWithOrder(auditors.agreers || []),
          receivers: convertAuditorFormatWithOrder(auditors.receivers || [])
        };

        // 결재자 순서대로 정렬
        selectedAuditors.value.approvers.sort((a, b) => (a.order || 0) - (b.order || 0));
        selectedAuditors.value.agreers.sort((a, b) => (a.order || 0) - (b.order || 0));

        console.log('selectedAuditors.value : ', selectedAuditors.value);
      } catch (error) {
        console.error('결재자 정보 파싱 오류:', error);
        selectedAuditors.value = {
          approvers: [],
          agreers: [],
          receivers: []
        };
      }
    } else {
      selectedAuditors.value = {
        approvers: [],
        agreers: [],
        receivers: []
      };
    }

    // 첨부 파일 목록 가져오기
    if (Object.keys(docFormCont.value.bin)?.length && docFormCont.value.bin?.form_data?.length) {
      const fileList = [];
      const form_data = docFormCont.value.bin.form_data;

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
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  formRecordId.value = route.query.record_id;
  getDocFormDetail();
});
</script>

<style scoped lang="less">
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
        cursor: default;

        .icon {
          padding: 0;

          svg {
            width: 18px;
            height: 18px;
            fill: var(--primary-color-400);
          }
        }

        &:hover {
          background-color: #fff;
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
    height: 100%;
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

#inp_date {
  &:active,
  &:focus,
  &:hover {
    border: 1px solid var(--gray-color-200);
    cursor: default;
  }
}

.empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  font-size: 0.875rem;
  line-height: 1.3;
  color: var(--gray-color-400);
}

.button-wrap {
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .approver-wrap {
    grid-template-columns: repeat(5, 1fr);
  }
}
</style>
