<template lang="pug">
    .wysiwyg
        .btns-wrap(:class="isDetail ? 'disalbed' : ''")
            button.btn-custom(:class="{active : commandTracker.bold}" type="button" @click="handleCommand('bold')")
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-bold")
            button.btn-custom(:class="{active : commandTracker.italic}" type="button" @click="handleCommand('italic')")
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-italic")
            button.btn-custom(:class="{active : commandTracker.underline}" type="button" @click="handleCommand('underline')")
                .icon
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-underline")
            button.btn-custom(:class="{active : commandTracker.strike}" type="button" @click="handleCommand('strike')" style="border-right: 1px solid #e4e4e7;")
                .icon
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-strike")
            button.btn-custom(:class="{active : commandTracker.h1}" type="button" @click="handleCommand('h1')")
                .icon.text 20pt
            button.btn-custom(:class="{active : commandTracker.h2}" type="button" @click="handleCommand('h2')")
                .icon.text 18pt
            button.btn-custom(:class="{active : commandTracker.h3}" type="button" @click="handleCommand('h3')")
                .icon.text 16pt
            button.btn-custom(:class="{active : commandTracker.h4}" type="button" @click="handleCommand('h4')")
                .icon.text 14pt
            button.btn-custom(:class="{active : commandTracker.h5}" type="button" @click="handleCommand('h5')")
                .icon.text 12pt
            button.btn-custom(:class="{active : commandTracker.h6}" type="button" @click="handleCommand('h6')" style="border-right: 1px solid #e4e4e7;")
                .icon.text 10pt
            //- button.btn-custom(type="button" @click="handleCommand('small')" style="border-right: 1px solid #e4e4e7;") Small
        
            // 텍스트 색상 변경
            .btn-custom.input-color
                input#colorInput(
                    type="color"
                    ref="colorInputRef"
                    @mousedown="onColorInputMouseDown('textColor', $event)"
                    @mouseup="stopColorDrag"
                    @input="handleColorInput('textColor', $event.target.value)"
                )
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-color-text")
    
            // 셀 배경색 변경
            .btn-custom.input-color(style="border-right: 1px solid #e4e4e7;")
                input#bgColorInput(
                    type="color"
                    ref="bgColorInputRef"
                    @mousedown="onColorInputMouseDown('bgColor', $event)"
                    @mouseup="stopColorDrag"
                    @input="handleColorInput('bgColor', $event.target.value)"
                )
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
let colorInput = ref(null);
let bgColorInput = ref(null);
let commandTracker = ref({
    bold: false,
    color: false,
    h1: false,
    h2: false,
    h3: false,
    h4: false,
    h5: false,
    h6: false,
    italic: false,
    small: false,
    strike: false,
    underline: false,
});

// 테이블 행, 열 크기 설정
const showTableDialog = ref(false);
const tableRows = ref(5);
const tableCols = ref(5);

// showBtn이 true일 경우, Create 페이지 / false일 경우, Detail 페이지
const isDetail = computed(() => {
    return !props.showBtn;
});

// 테이블 생성 함수
const insertTable = () => {
    if (!wysiwyg) return;

    insertTableToWysiwyg(
        wysiwyg,
        tableRows.value,
        tableCols.value,
        // true, // Vue 컴포넌트 사용 (false로 설정하면 DOM 방식 사용)
        // props.showBtn // 행, 열 추가 버튼 사용
    );

    showTableDialog.value = false;

    nextTick(() => {
        const editorEl = document.getElementById('myeditor');
        const tables = editorEl.querySelectorAll('table');
        const table = tables[tables.length - 1]; // 마지막 테이블 선택

        if (table) {
            // 표 다음에 <p><br></p> 삽입
            const newParagraph = document.createElement('p');
            newParagraph.innerHTML = '<br>';

            editorEl.appendChild(newParagraph);

            // 커서를 새로 삽입한 줄로 이동
            const range = document.createRange();
            const sel = window.getSelection();

            range.setStart(newParagraph, 0);
            range.collapse(true);

            sel.removeAllRanges();
            sel.addRange(range);

            // 포커스 설정
            // wysiwyg.focus();
        }
    });
};

let colorDragInterval = null;

// 선택된 셀의 색상을 팔레트에 적용
const updateColorPickerToSelectedCells = () => {
    const selectedCells = document.querySelectorAll('td.selected-cell, td.dragged-cell');

    if (selectedCells.length === 0) return;

    const firstCell = selectedCells[0];

    // RGB → HEX 변환 함수
    function rgbToHex(rgb) {
        const matches = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
        if (!matches) return '#000000';
        const r = parseInt(matches[1]);
        const g = parseInt(matches[2]);
        const b = parseInt(matches[3]);
        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    }

    // 텍스트 색상
    if (colorInput.value) {
        const currentTextColor = window.getComputedStyle(firstCell).color;
        colorInput.value.value = rgbToHex(currentTextColor);
    }

    // 배경 색상
    if (bgColorInput.value) {
        const currentBgColor = window.getComputedStyle(firstCell).backgroundColor;
        bgColorInput.value.value = rgbToHex(currentBgColor);
    }
};

const stopColorDrag = () => {
    if (colorDragInterval) {
        clearInterval(colorDragInterval);
        colorDragInterval = null;
    }
};

const handleColorInput = (type, colorValue) => {
    const selectedCells = document.querySelectorAll('td.selected-cell, td.dragged-cell');

    if (selectedCells.length > 0) {
        selectedCells.forEach(cell => {
            if (type === 'textColor') {
                cell.style.color = colorValue;
            } else if (type === 'bgColor') {
                cell.style.backgroundColor = colorValue;
            }
            // 클래스 제거 생략 가능 → 드래그 중이라 계속 들어옴
        });
    } else {
        wysiwyg.restoreLastSelection();
        if (type === 'textColor') {
            wysiwyg.command('textColor', colorValue);
        } else if (type === 'bgColor') {
            wysiwyg.command('hiliteColor', colorValue);
        }
    }
};

const onColorInputMouseDown = (type, event) => {
    updateColorPickerToSelectedCells(type); // 선택된 셀 색상으로 초기값 설정
    setTimeout(() => {
        if (type === 'textColor' && colorInput.value) {
            colorInput.value.click(); // 강제로 팔레트 열기
        } else if (type === 'bgColor' && bgColorInput.value) {
            bgColorInput.value.click(); // 강제로 팔레트 열기
        }
    }, 50);
};

// 에디터 명령어 처리
const handleCommand = (command) => {
    if (!wysiwyg) return;

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
        showTableDialog.value = true;
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

// 에디터 내용 export
const exportData = async () => {
    if (wysiwyg) {
        await wysiwyg.export().then((r) => {
            let result = r;
            let html = result.html;

            console.log('에디터 내용:', html);
            emit('update:content', r);
        });
    }
};

// 에디터가 사라지면 다시 생성
const ensureEditorExists = () => {
    let editorEl = document.getElementById('myeditor');
    if (!editorEl) {
        // console.warn('#myeditor가 사라짐 -> 재생성 중');

        // 부모 요소 찾기
        const wysiwygContainer = document.querySelector('.wysiwyg'); // 실제 컨테이너 클래스 확인 필요
        if (!wysiwygContainer) return;

        // div 새로 생성
        const newEditor = document.createElement('div');
        newEditor.id = 'myeditor';
        newEditor.contentEditable = true;
        newEditor.style.width = '100%';
        newEditor.style.minHeight = '3rem';

        // 기본 내용 삽입
        newEditor.innerHTML = '<p><br></p>';

        // 기존 위치에 삽입
        wysiwygContainer.appendChild(newEditor);

        // wysiwyg 인스턴스 재설정
        initWysiwyg();
    }
};

// 에디터 초기화
const initWysiwyg = () => {
    const editorEl = document.getElementById('myeditor');
    if (!editorEl) return;

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
            desktop: 16,
            tablet: 16,
            phone: 14,
            h1: '26px',
            h2: '24px',
            h3: '22px',
            h4: '19px',
            h5: '16px',
            h6: '13px'
        },
        callback: (c) => {
            if (c.caratPosition) {
                // 뷰포트 내에 커서 위치 유지하기 위한 기존 코드 유지
                let viewPortHeight = Math.min(
                    document.documentElement.clientHeight || 0,
                    window.innerHeight || 0
                );
                let minusWhenOutOfView = viewPortHeight - c.caratPosition.top;
                if (minusWhenOutOfView < 0) window.scrollBy(0, -minusWhenOutOfView);
            }

            if (c.commandTracker) {
                commandTracker.value.bold = c.commandTracker.bold;
                commandTracker.value.color = c.commandTracker.color;
                commandTracker.value.h1 = c.commandTracker.h1;
                commandTracker.value.h2 = c.commandTracker.h2;
                commandTracker.value.h3 = c.commandTracker.h3;
                commandTracker.value.h4 = c.commandTracker.h4;
                commandTracker.value.h5 = c.commandTracker.h5;
                commandTracker.value.h6 = c.commandTracker.h6;
                commandTracker.value.italic = c.commandTracker.italic;
                commandTracker.value.small = c.commandTracker.small;
                commandTracker.value.strike = c.commandTracker.strike;
                commandTracker.value.underline = c.commandTracker.underline;
            }

            if (editorEl && editorEl.innerHTML.trim() === '') {
                editorEl.innerHTML = '<p><br></p>';
            }

            return c;
        }
    });

    // savedContent 로드
    if (props.savedContent) {
        // console.log({ savedContent: props.savedContent });
        nextTick(() => {
            editorEl.innerHTML = props.savedContent;
        });
        editorEl.setAttribute('disalbed', 'false');
    } else {
        nextTick(() => {
            editorEl.innerHTML = '<p><br></p>';
        });
    }

    emit('editor-ready', true);
};

// 부모 엘리먼트에서 특정 클래스를 가진 엘리먼트를 찾는 함수
function findUp(node, selector) {
    while (node && node !== document.body) {
        if (node.matches && node.matches(selector)) {
            return node;
        }
        node = node.parentNode;
    }
    return null;
}

// Ctrl+A 이벤트 처리
function handleEditorKeyDown(e) {
    if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        const editorEl = document.getElementById('myeditor');
        if (!editorEl) return;

        // 기본 Ctrl+A 동작 유지
        // e.preventDefault()를 제거하여 기본 텍스트 선택 동작을 유지
        setTimeout(() => {
            // 테이블 내 모든 셀 선택
            const tables = editorEl.querySelectorAll('table');
            tables.forEach((table) => {
                table.classList.add('selected-all');
            });
        }, 0); // 기본 동작 이후 실행되도록 딜레이 추가
    }
}

// 테이블 선택 해제 함수
function clearTableSelection() {
    const editorEl = document.getElementById('myeditor');
    if (!editorEl) return;

    const tables = editorEl.querySelectorAll('table');
    tables.forEach((table) => {
        table.classList.remove('selected-all');
    });
}

// 에디터에서 키업 이벤트 처리
let handleEditorKeyUp = (e) => {
    if (e.key === 'Escape') {
        // Escape 키로 선택 해제
        clearTableSelection();
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
        ensureEditorExists();

        // 현재 포커스된 노드 가져오기
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        let node = range.startContainer;

        // 포커스가 텍스트 노드 내부라면, 부모 엘리먼트로 올라감
        while (node && node.nodeType !== 1) {
            node = node.parentNode;
        }

        if (!node) return;

        if (node.id === 'removeCol') {
            const customBlock = findUp(node, '._custom_');
            e.preventDefault(); // 기본 동작 방지
            customBlock.remove(); // 덩어리 전체 삭제
            return;
        }
    }
};

onMounted(() => {
    initWysiwyg();

    let retryCount = 0;
    const maxRetries = 5;

    const intervalId = setInterval(() => {
        if (ensureEditorExists()) {
            clearInterval(intervalId);
        } else {
            retryCount++;
            if (retryCount >= maxRetries) {
                clearInterval(intervalId);
            }
        }
    }, 1000);

    document.addEventListener('keydown', handleEditorKeyDown);
    document.addEventListener('keyup', handleEditorKeyUp);
});

onBeforeUnmount(() => {
    wysiwyg = null;

    document.addEventListener('keydown', handleEditorKeyDown);
    document.removeEventListener('keyup', handleEditorKeyUp);
});

defineExpose({
    exportData
});
</script>

<style lang="less">
._wysiwyg4all {
    padding: 1.5rem 1rem 1rem 1rem;
    min-height: 18rem !important;
    overflow: hidden !important;

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

    &.disalbed {
        display: none;
    }
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

    &.active {
        border-bottom: 1px solid var(--gray-color-200);
        background-color: var(--gray-color-200);
    }

    .icon {
        padding: 0;

        &.text {
            font-weight: 700;
            color: var(--gray-color-500);
        }
    }
}

/* 테이블 스타일링 */
.wysiwyg-table-wrap {
    max-width: var(--wysiwyg-table-max-width);
    // min-height: 100%;
    // height: 100%;
    position: relative;
    overflow-x: auto;
    overflow-y: unset !important;
    white-space: nowrap;

    &::-webkit-scrollbar {
        display: none;
    }

    .wysiwyg-table-col-btns {
        position: absolute;
        top: 0;
        right: -27px;
        opacity: 1;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 6px;
        opacity: 0;
        user-select: none;

        &.show {
            opacity: 1;
        }

        button {
            flex-grow: 1;
            background-color: #eee;
            border-radius: 8px;
            font-size: 16px;
            user-select: none;
            padding: 6px;
        }
    }

    .wysiwyg-table-row-btns {
        position: absolute;
        left: 0;
        bottom: -27px;
        opacity: 1;
        width: 100%;
        display: flex;
        gap: 6px;
        opacity: 0;
        user-select: none;

        &.show {
            opacity: 1;
        }

        button {
            flex-grow: 1;
            background-color: #eee;
            border-radius: 8px;
            font-size: 16px;
            user-select: none;
        }
    }

    .btn-merge,
    .btn-unmerge {
        position: absolute;
        top: var(--merge-btn-top);
        left: var(--merge-btn-left);
        background-color: #487ff2;
        color: white;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer !important;
        font-size: 14px;
        z-index: 9999;
        /* pointer-events: none; */
        user-select: none !important;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        display: none;

        &.active {
            display: block;
            /* pointer-events: auto; */
        }

        &::selection {
            background: transparent;
        }

        &:focus,
        &:active,
        &:hover {
            user-select: none !important;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
        }
    }
}

.wysiwyg-table {
    position: relative;
    min-width: max-content;
    table-layout: fixed;
    border-collapse: collapse;
    white-space: nowrap;
    margin: 27px 0;

    &.dragging {
        &::selection {
            background: transparent;
        }
    }

    &.selected-all {
        &::selection {
            background: transparent;
        }

        td {
            &::after {
                display: block;
            }
        }
    }

    &::selection {
        background: highlight;
    }

    td {
        position: relative;
        height: auto;
        border: 1px solid var(--gray-color-400);
        min-width: 50px;
        min-height: 30px;
        width: 100px;
        background-color: white;
        overflow: hidden;
        word-break: break-word;
        white-space: normal;

        /* &:focus,
        &:focus-visible {
            outline: -webkit-focus-ring-color auto 1px !important;
        } */

        &.selected-cell {
            /* background-color: #d0ebff !important;
            outline: 2px dashed #333; */
            /* outline: -webkit-focus-ring-color auto 1px; */
        }

        &.dragged-cell {

            /* background-color: #d0ebff !important; */
            &::after {
                display: block;
            }
        }

        &::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: #0091ff11;
            pointer-events: none;
            display: none;
        }
    }

    th {
        min-width: 50px;
        min-height: 30px;
        border: 1px solid #ccc;
        text-align: left;
        vertical-align: top;
        padding: 4px 6px;
        position: relative;
        overflow: auto;
        white-space: normal;
        word-wrap: break-word;
        box-sizing: border-box;
        font-size: 14px;
        line-height: 1.2em;
    }

    .resizer {
        position: absolute;
        top: 0;
        right: -5px;
        width: 10px;
        height: 100%;
        background-color: transparent;
        z-index: 10;

        &.active {
            cursor: col-resize;
            background-color: #777 !important;
        }
    }

    .resizer-bottom {
        position: absolute;
        bottom: -5px;
        left: 0;
        height: 10px;
        width: 100%;
        background-color: transparent;
        z-index: 10;

        &.active {
            cursor: row-resize;
            background-color: #777 !important;
        }
    }
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