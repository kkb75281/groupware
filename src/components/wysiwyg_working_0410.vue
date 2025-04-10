<template lang="pug">
.wysiwyg
	.btns-wrap(:class="isDetail ? 'disalbed' : ''")
		button.btn-custom(type="button" @click="handleCommand('bold')")
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-bold")
		button.btn-custom(type="button" @click="handleCommand('italic')")
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-italic")
		button.btn-custom(type="button" @click="handleCommand('underline')")
			.icon
					svg
						use(xlink:href="@/assets/icon/material-icon.svg#icon-underline")
		button.btn-custom(type="button" @click="handleCommand('strike')" style="border-right: 1px solid #e4e4e7;")
			.icon
					svg
						use(xlink:href="@/assets/icon/material-icon.svg#icon-strike")
		button.btn-custom(type="button" @click="handleCommand('h1')")
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-h1")
		button.btn-custom(type="button" @click="handleCommand('h2')")
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-h2")
		button.btn-custom(type="button" @click="handleCommand('h3')")
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-h3")
		button.btn-custom(type="button" @click="handleCommand('h4')")
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-h4")
		button.btn-custom(type="button" @click="handleCommand('h5')")
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-h5")
		button.btn-custom(type="button" @click="handleCommand('h6')" style="border-right: 1px solid #e4e4e7;")
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-h6")
		//- button.btn-custom(type="button" @click="handleCommand('small')" style="border-right: 1px solid #e4e4e7;") Small
	
		// 색상 변경
		.input-color
			input#colorInput.btn-custom(type="color" @change="handleCommand($event.target.value)" @blur="wysiwyg.restoreLastSelection()" style="padding: 0; border: none; border-bottom: 1px solid #e4e4e7; border-right: 1px solid #e4e4e7; position: relative; border-radius: 0;")
		//- button.btn-custom(type="button" @click="handleCommand('color')" style="border-right: 1px solid #e4e4e7;") Color
		button.btn-custom(type="button" @click="handleCommand('divider')")
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-divider")
		button.btn-custom(type="button" @click="handleCommand('quote')" style="border-right: 1px solid #e4e4e7;")
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-quote")
		button.btn-custom(type="button" @click="handleCommand('table')")
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-table")
		button.btn-custom(type="button" @click="handleCommand('unorderedList')")
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-list-bullet")
		button.btn-custom(type="button" @click="handleCommand('orderedList')" style="border-right: 1px solid #e4e4e7;")
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-list-number")
		button.btn-custom(type="button" @click="handleCommand('alignLeft')")
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-align-left")
		button.btn-custom(type="button" @click="handleCommand('alignCenter')")
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-align-center")
		button.btn-custom(type="button" @click="handleCommand('alignRight')")
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-align-right")
		//- button.btn-custom(type="button" @click="handleCommand('image')")
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-image")
		//- button.btn-custom(type="button" @click="exportData") Export

	// 테이블 생성 모달
	.modal-tb-set(v-if="showTableDialog")
		.modal-overlay(@click="showTableDialog = false")
		.modal-cont
			h3 테이블 생성
			.input-group
				label(for="table-rows") 행
				input#table-rows(type="number" v-model.number="tableRows" min="1" max="10")
			.input-group
				label(for="table-cols") 열
				input#table-cols(type="number" v-model.number="tableCols" min="1" max="10")
			.button-group
				button.btn-cancel(type="button" @click="showTableDialog = false") 취소
				button.btn-confirm(type="button" @click="insertTable") 생성
	
	#myeditor(style="width: 100%; min-height: 3rem;")
</template>

<script setup>
import { onMounted, onBeforeUnmount, nextTick, ref, computed } from 'vue';
import { Wysiwyg4All } from 'wysiwyg4all';
import 'wysiwyg4all/css';
import wysiwygTable from '@/components/wysiwygTable.vue';
import { currentTable, createTable, loadWysiwygTable } from '@/components/wysiwygTable';
import { createApp } from 'vue';

// 이벤트 emit 방식으로 에디터 내용을 실시간으로 부모 컴포넌트로 전달
const emit = defineEmits(['update:content', 'editor-ready']);
const props = defineProps(['savedContent', 'showBtn']);

let wysiwyg = null;

// 테이블 행, 열 크기 설정
const showTableDialog = ref(false);
const tableRows = ref(3);
const tableCols = ref(3);

// showBtn이 true일 경우, Create 페이지 / false일 경우, Detail 페이지
const isDetail = computed(() => {
  return !props.showBtn;
});

// 테이블 열, 행 설정 모달
const showTableCreator = () => {
  showTableDialog.value = true;
};

// 테이블 생성 함수
const insertTable = () => {
  if (!wysiwyg) return;

  wysiwyg.command({
    element: loadWysiwygTable({
      rows: tableRows.value,
      cols: tableCols.value
    }),
    contenteditable: true
  });

  showTableDialog.value = false;
};

const handleCommand = (command) => {
  if (!wysiwyg) return;

  if (command === 'table') {
    showTableCreator(); // 테이블 생성 모달 open
  } else {
    wysiwyg.command(command);
  }
};

onMounted(() => {
  wysiwyg = new Wysiwyg4All({
    elementId: 'myeditor',
    placeholder: '결재 내용',
    spellcheck: false,
    highlightColor: '#4a90e2',
    hashtag: false,
    urllink: true,
    disabled: true,
    logMutation: false,
    callback: (c) => {
      if (c.commandTracker) {
        // 에디터 내용이 변경될 때마다 부모 컴포넌트에 내용 전달
        wysiwyg.export().then((r) => {
          // 내용이 비어있을 때 빈 p 태그 생성 추가
          const html = r.html && r.html.trim() !== '' ? r.html : '<p><br></p>';
          emit('update:content', r.html);
        });
      }

      if (c.range) {
        // console.log('범위 확인 : ', c.range);
      }

      return c;
    }
  });

  // savedContent가 있는 경우 에디터에 내용 로드
  if (props.savedContent) {
    const editorElement = document.getElementById('myeditor');

    if (!editorElement) {
      console.error('Editor element not found!');
      return;
    }

    if (props.savedContent) {
      nextTick(() => {
        editorElement.innerHTML = props.savedContent;
      });
    } else {
      // 내용이 없는 경우 기본 빈 p 태그 추가
      const editorElement = document.getElementById('myeditor');
      if (editorElement) {
        nextTick(() => {
          editorElement.innerHTML = '<p><br></p>';
        });
      }
    }

    // disabled 속성 처리
    editorElement.setAttribute('disalbed', 'false');

    // if (!props.showBtn) {
    //   const editorElement = document.getElementById('myeditor');
    //   if (editorElement) {
    //     editorElement.setAttribute('disabled', 'false');
    //   }
    // }
  }

  emit('editor-ready', true);
});

onBeforeUnmount(() => {
  wysiwyg = null;
});

defineExpose({
  getContent: () => wysiwyg.export() || ''
});
</script>

<style lang="less">
._wysiwyg4all {
  padding: 1.5rem 1rem 1rem 1rem;
  // min-height: calc(14em + 50px) !important;
  min-height: 18rem !important;

  &::before {
    color: var(--gray-color-300) !important;
  }

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

.modal-tb-set {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;

  .modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
  }

  .modal-cont {
    position: relative;
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    width: 300px;
    z-index: 1001;

    h3 {
      margin-top: 0;
      margin-bottom: 1rem;
      font-size: 1.25rem;
      font-weight: bold;
    }

    .input-group {
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;

      label {
        width: 40px;
        margin-right: 10px;
      }

      input {
        flex: 1;
        padding: 6px 12px;
        border: 1px solid var(--gray-color-200);
        border-radius: 6px;
      }
    }

    .button-group {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 1.25rem;

      button {
        padding: 8px 16px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;

        &.btn-cancel {
          background-color: var(--gray-color-200);
          color: var(--gray-color-700);
        }

        &.btn-confirm {
          background-color: var(--primary-color, #3b82f6);
          color: white;
        }
      }
    }
  }
}

.input-color {
  display: inline-block;
  position: relative;
}

.btns-wrap {
  justify-content: flex-start !important;
  gap: 0 !important;
  display: flex;
  flex-wrap: wrap;

  &:after {
    content: '';
    flex: 1 1 auto;
    border-bottom: 1px solid var(--gray-color-200);
  }
}

.btns-wrap.disalbed {
  display: none;
}

.btn-custom {
  display: inline-block;
  border-bottom: 1px solid var(--gray-color-200);
  padding: 0 8px;
  height: 2rem;

  &:hover,
  &:focus,
  &:active {
    border-bottom: 1px solid var(--gray-color-200);
    background-color: var(--gray-color-200);
  }

  .icon {
    padding: 0;
  }
}
</style>
