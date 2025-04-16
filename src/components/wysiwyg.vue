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
	
		// 텍스트 색상 변경
		.btn-custom.input-color
			input#colorInput(type="color" @change="handleCommand('textColor:' + $event.target.value)" @blur="wysiwyg.restoreLastSelection()")
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-color-text")

		// 셀 배경색 변경
		.btn-custom.input-color(style="border-right: 1px solid #e4e4e7;")
			input#bgColorInput(type="color" @change="handleCommand('bgColor:' + $event.target.value)" @blur="wysiwyg.restoreLastSelection()")
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-color-bg")

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
import { insertTableToWysiwyg } from '@/components/wysiwygTable.js';
import { Wysiwyg4All } from 'wysiwyg4all';
import 'wysiwyg4all/css';
import wysiwygTable from '@/components/wysiwygTable.vue';

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

  insertTableToWysiwyg(
    wysiwyg,
    tableCols.value,
    tableRows.value,
    // true, // Vue 컴포넌트 사용 (false로 설정하면 DOM 방식 사용)
    props.showBtn // 행, 열 추가 버튼 사용
  );

  showTableDialog.value = false;
};

const handleCommand = (command) => {
  if (!wysiwyg) return;

  // 색상 명령 처리 (textColor:값 또는 bgColor:값 형식)
  if (
    typeof command === 'string' &&
    (command.startsWith('textColor:') || command.startsWith('bgColor:'))
  ) {
    console.log('AA 색상 명령:', command);
    const parts = command.split(':');
    const colorType = parts[0]; // textColor 또는 bgColor
    const colorValue = parts[1]; // 색상 값

    console.log('colorType : ', colorType);

    const selection = window.getSelection();
    console.log('selection : ', selection);

    // 선택 범위가 비어있지 않은지 확인
    if (selection.rangeCount > 0) {
      console.log('== AA ==');

      const range = selection.getRangeAt(0);
      console.log('range : ', range);

      // 테이블 내 셀이 선택되었는지 확인
      let isCellSelection = false;
      const selectedCells = [];

      console.log('isCellSelection : ', isCellSelection);

      // 테이블 내 모든 셀 순회
      const allTables = document.querySelectorAll('#myeditor table');
      allTables.forEach((table) => {
        const cells = table.querySelectorAll('td');
        cells.forEach((cell) => {
          if (selection.containsNode(cell, true)) {
            selectedCells.push(cell);

            // 셀 전체가 선택된 경우
            if (isEntireCellSelected(cell, range)) {
              isCellSelection = true;
            }
          }
        });
      });

      // 셀 전체가 선택된 경우 (셀 배경색이나 셀 텍스트 색상 전체 변경)
      if (isCellSelection) {
        console.log('AA');
        selectedCells.forEach((cell) => {
          if (colorType === 'bgColor') {
            cell.style.backgroundColor = colorValue;
          } else {
            cell.style.color = colorValue;
          }
        });
      } else if (!range.collapsed) {
        console.log('BB');
        console.log('range.collapsed : ', range.collapsed);

        // 텍스트 일부만 선택된 경우 - span으로 감싸서 처리
        try {
          const span = document.createElement('span');

          if (colorType === 'bgColor') {
            span.style.backgroundColor = colorValue;
          } else {
            span.style.color = colorValue;
          }

          // // p 태그 전체가 선택됐는지 확인
          // const parentEl = range.startContainer.parentElement;

          // // 선택된 노드가 p 태그고 전체가 선택된 경우
          // if (parentEl.tagName === 'P') {
          //   if (colorType === 'bgColor') {
          //     parentEl.style.backgroundColor = colorValue;
          //   } else {
          //     parentEl.style.color = colorValue;
          //   }
          // } else {
          //   // 일부 선택 - span으로 감싸기
          //   range.surroundContents(span);
          // }

          range.surroundContents(span);
        } catch (e) {
          // 범위가 여러 요소에 걸쳐 있는 경우, 기본 명령 사용
          if (colorType === 'bgColor') {
            wysiwyg.command('hiliteColor', colorValue);
          } else {
            wysiwyg.command('textColor', colorValue);
          }
        }
      } else {
        // 선택된 텍스트가 없으면 기본 명령 실행
        if (colorType === 'bgColor') {
          console.log('BB');
          wysiwyg.command('hiliteColor', colorValue);
        } else {
          console.log('CC');
          wysiwyg.command('textColor', colorValue);
        }
      }
    } else {
      console.log('DD');
      // 선택 범위가 없으면 기본 명령 실행
      if (colorType === 'bgColor') {
        wysiwyg.command('hiliteColor', colorValue);
      } else {
        wysiwyg.command('textColor', colorValue);
      }
    }
  }
  // 색상 값이 직접 전달된 경우 (#색상값 형식)
  else if (typeof command === 'string' && command.startsWith('#')) {
    console.log('BB 색상 값:', command);
    const colorValue = command;
    const selection = window.getSelection();

    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);

      if (!range.collapsed) {
        // 선택된 텍스트에만 색상 적용
        const span = document.createElement('span');
        span.style.color = colorValue;

        try {
          range.surroundContents(span);
        } catch (e) {
          wysiwyg.command('textColor', colorValue);
        }
      } else {
        wysiwyg.command('textColor', colorValue);
      }
    } else {
      wysiwyg.command('textColor', colorValue);
    }
  }
  // 테이블 명령 처리
  else if (command === 'table') {
    showTableCreator();
  }
  // 정렬 명령 처리
  else if (command === 'alignLeft' || command === 'alignCenter' || command === 'alignRight') {
    const selection = window.getSelection();
    const selectedCells = [];

    const allTables = document.querySelectorAll('#myeditor table');
    allTables.forEach((table) => {
      const cells = table.querySelectorAll('td');
      cells.forEach((cell) => {
        if (selection.containsNode(cell, true)) {
          selectedCells.push(cell);
        }
      });
    });

    if (selectedCells.length > 0) {
      selectedCells.forEach((cell) => {
        cell.style.textAlign = '';
        switch (command) {
          case 'alignLeft':
            cell.style.textAlign = 'left';
            break;
          case 'alignCenter':
            cell.style.textAlign = 'center';
            break;
          case 'alignRight':
            cell.style.textAlign = 'right';
            break;
        }
      });
    } else {
      wysiwyg.command(command);
    }
  }
  // 기타 명령 처리
  else {
    wysiwyg.command(command);
  }
};

// 셀 전체가 선택되었는지 확인하는 헬퍼 함수
function isEntireCellSelected(cell, range) {
  // 간단한 확인: 셀이 범위의 시작과 끝에 모두 포함되는지
  return (
    range.startContainer === cell ||
    range.startContainer.parentNode === cell ||
    (range.startOffset === 0 &&
      (range.endContainer === cell.lastChild ||
        range.endOffset ===
          (range.endContainer.nodeType === Node.TEXT_NODE
            ? range.endContainer.length
            : range.endContainer.childNodes.length)))
  );
}

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
    fontSize: {
      desktop: 18,
      tablet: 16, // (max-width: 899px)
      phone: 14 // (max-width: 599px)
    },
    callback: (c) => {
      if (c.commandTracker) {
        // 에디터 내용이 변경될 때마다 부모 컴포넌트에 내용 전달
        wysiwyg.export().then((r) => {
          // 내용이 비어있을 때 빈 p 태그 생성 추가
          const html = r.html && r.html.trim() !== '' ? r.html : '<p><br></p>';
          emit('update:content', r.html);
        });
      }

      // if (c.caratPosition) {
      //   console.log('커서 위치 : ', c.caratPosition);

      //   // Tracks carat position
      //   // Make carat to be always within the viewport
      //   let viewPortHeight = Math.min(
      //     document.documentElement.clientHeight || 0,
      //     window.innerHeight || 0
      //   );
      //   console.log('뷰포트 높이 : ', viewPortHeight);

      //   let minusWhenOutOfView = viewPortHeight - c.caratPosition.top;
      //   console.log('뷰포트에서 벗어난 거리 : ', minusWhenOutOfView, 'px');

      //   if (minusWhenOutOfView < 0) window.scrollBy(0, -minusWhenOutOfView);
      // }

      if (c.caratPosition) {
        // 캐럿 위치를 사용하여 현재 셀 찾기
        const currentNode = document.caretPositionFromPoint
          ? document.caretPositionFromPoint(c.caratPosition.left, c.caratPosition.top).offsetNode
          : document.elementFromPoint(c.caratPosition.left, c.caratPosition.top);

        // 현재 노드로부터 가장 가까운 TD 요소 찾기
        let tdElement = currentNode;
        while (tdElement && tdElement.nodeName !== 'TD' && tdElement.id !== 'myeditor') {
          tdElement = tdElement.parentNode;
        }

        // TD 요소인 경우, 현재 작업 셀로 표시
        if (tdElement && tdElement.nodeName === 'TD') {
          // 이전에 선택된 셀의 표시 제거
          const allTds = document.querySelectorAll('.wysiwyg-table td');
          allTds.forEach((cell) => {
            if (cell !== tdElement) {
              cell.classList.remove('current-cell');
            }
          });

          // 현재 셀 표시
          tdElement.classList.add('current-cell');

          // 현재 활성화된 셀의 참조 저장 (전역 변수나 컴포넌트 데이터로 추가)
          // 이 참조는 handleCommand에서 사용할 수 있음
          window.currentActiveCell = tdElement;
        }

        // 뷰포트 내에 커서 위치 유지하기 위한 기존 코드 유지
        let viewPortHeight = Math.min(
          document.documentElement.clientHeight || 0,
          window.innerHeight || 0
        );
        let minusWhenOutOfView = viewPortHeight - c.caratPosition.top;
        if (minusWhenOutOfView < 0) window.scrollBy(0, -minusWhenOutOfView);
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
  align-items: center;
  position: relative;

  &.btn-custom {
    display: flex;
  }

  input {
    padding: 0;
    border: none;
    border-bottom: 1px solid #e4e4e7;
    border-right: 1px solid #e4e4e7;
    position: absolute;
    left: 0;
    opacity: 0;
    border-radius: 0;
    width: 100%;
    height: 100%;
  }

  .icon {
    svg {
      width: 20px;
      height: 20px;
    }
  }
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

/* 테이블 스타일링 */
.wysiwyg-table-wrap {
  display: block;
  position: relative;
  overflow: visible;
  margin: 0.5rem 0 1.5rem !important;
}

.wysiwyg-table {
  position: relative;
  border-collapse: collapse;
  width: calc(100% - 10px);
  table-layout: fixed;
  margin: 0 auto;

  tr,
  th,
  td {
    height: auto;
  }

  td {
    border: 1px solid #000;
    min-width: 50px;
    min-height: 30px;
    background-color: white;
    overflow: hidden;
    word-break: break-word;
    white-space: normal;
  }
}

/* 리사이저 스타일 */
.table-resizer {
  position: absolute;
  z-index: 100;
  background-color: transparent;
}

.col-resizer {
  top: 0;
  width: 8px;
  height: 100%;
  cursor: col-resize;
  margin-left: -4px;
}

.col-resizer::after {
  content: '';
  position: absolute;
  top: 0;
  left: 3px;
  width: 2px;
  height: 100%;
  // background-color: #bbb;
  opacity: 0;
  transition: opacity 0.2s;
}

.col-resizer:hover::after,
.col-resizer.active::after {
  opacity: 1;
  // background-color: #4a90e2;
}

.row-resizer {
  left: 0;
  height: 8px;
  width: 100%;
  cursor: row-resize;
  margin-top: -4px;
}

.row-resizer::after {
  content: '';
  position: absolute;
  left: 0;
  top: 3px;
  height: 2px;
  width: 100%;
  // background-color: #bbb;
  opacity: 0;
  transition: opacity 0.2s;
}

.row-resizer:hover::after,
.row-resizer.active::after {
  opacity: 1;
  // background-color: #4a90e2;
}

/* 리사이징 중 선택 방지 */
.resizing-table {
  user-select: none;
}

/* 조작 버튼 스타일 */
.btn-control-wrap {
  position: absolute;
  display: flex;

  &.control-row {
    bottom: -24px;
    left: 5px;
  }

  &.control-col {
    flex-direction: column;
    top: 0;
    right: -19px;
  }

  .btn-add,
  .btn-remove {
    width: 24px;
    height: 24px;
    background-color: var(--gray-color-200);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-weight: bold;
    border: none;
  }
}
</style>
