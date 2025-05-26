<template lang="pug">
.wysiwyg(ref="wysiwygRef")
    .btns-wrap(ref="wysiwygTool" :class="{disalbed : isDetail, fixed : isFixed}")
        .btn-custom.input-size.line
            button(type="button" :disabled="fontSize <= minFontSize" @click.stop.prevent="handleFontSize('decrease')")
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-remove")
            .font-size {{ fontSize }}
            button(type="button" :disabled="fontSize >= maxFontSize" @click.stop.prevent="handleFontSize('increase')") 
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-add")
        button.btn-custom(:class="{active : commandTracker.bold}" type="button" @click.stop="handleCommand('bold')")
            .icon
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-bold")
        button.btn-custom(:class="{active : commandTracker.italic}" type="button" @click.stop="handleCommand('italic')")
            .icon
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-italic")
        button.btn-custom(:class="{active : commandTracker.underline}" type="button" @click.stop="handleCommand('underline')")
            .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-underline")
        button.btn-custom.line(:class="{active : commandTracker.strike}" type="button" @click.stop="handleCommand('strike')")
            .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-strike")
    
        .divider
            // 텍스트 색상 변경
            .btn-custom.input-color
                input#colorInput(
                    type="color"
                    :value="textColor"
                    @input="(e) => {handleColorInput(e, 'textColor')}"
                )
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-color-text")

            // 셀 배경색 변경
            .btn-custom.input-color.line
                input#bgColorInput(
                    type="color"
                    ref="bgColorInputRef"
                    :value="bgColor"
                    @mousedown="onColorInputMouseDown"
                    @input="(e) => {handleColorInput(e, 'bgColor')}"
                )
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-color-bg")

            button.btn-custom(type="button" @click.stop="handleCommand('divider')")
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-divider")
            button.btn-custom.line(type="button" @click.stop="handleCommand('quote')")
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-quote")

        .divider
            button.btn-custom(type="button" @click.stop="handleCommand('table')")
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-table")
            button.btn-custom(type="button" @click.stop="handleCommand('unorderedList')")
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-list-bullet")
            button.btn-custom.line(type="button" @click.stop="handleCommand('orderedList')")
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-list-number")
            button.btn-custom(type="button" @click.stop="handleCommand('alignLeft')")
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-align-left")
            button.btn-custom(type="button" @click.stop="handleCommand('alignCenter')")
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-align-center")
            button.btn-custom(type="button" @click.stop="handleCommand('alignRight')")
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
import { onMounted, onBeforeUnmount, nextTick, ref, computed, onUnmounted } from 'vue';
import { insertTableToWysiwyg, addResizer, bindCellEvents, resetTableCellData } from '@/components/wysiwygTable.js';
import { Wysiwyg4All } from 'wysiwyg4all';
import 'wysiwyg4all/css';
import wysiwygTable from '@/components/wysiwygTable.vue';

// 이벤트 emit 방식으로 에디터 내용을 실시간으로 부모 컴포넌트로 전달
const emit = defineEmits(['update:content', 'editor-ready']);
const props = defineProps(['savedContent', 'showBtn']);

let wysiwyg = null; // wysiwyg4all 인스턴스
let wysiwygRef = ref(null); // .wysiwyg
let wysiwygTool = ref(null); // .btns-wrap
let showTableDialog = ref(false);
let tableRows = ref(5);
let tableCols = ref(5);
let bgColorInputRef = ref(null);
let textColor = ref('#000000'); // 기본 텍스트 색상
let bgColor = ref('#ffffff'); // 기본 배경 색상
let fontSize = ref(12);
let minFontSize = 10;
let maxFontSize = 20;
let fontVariables = {
    h1: 20,
    h2: 18,
    h3: 16,
    h4: 14,
    h5: 12,
    h6: 10
}
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
    underline: false
});
let currentRange = null;

// showBtn이 true일 경우, Create 페이지 / false일 경우, Detail 페이지
const isDetail = computed(() => {
    return !props.showBtn;
});
let isFixed = ref(false);

// 테이블 생성 함수
const insertTable = () => {
    if (!wysiwyg) return;

    insertTableToWysiwyg(
        wysiwyg,
        tableRows.value,
        tableCols.value
    );

    showTableDialog.value = false;
};

function saveSelection() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        return { range };
    }
    return null;
}

function restoreSelection(saved) {
    if (!saved) return;
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(saved.range);
}

const handleFontSize = (action) => {
    if (!wysiwyg) return;

    if (action === 'increase') {
        if (fontSize.value >= maxFontSize) return;
        fontSize.value += 2;
    } else if (action === 'decrease') {
        if (fontSize.value <= minFontSize) return;
        fontSize.value -= 2;
    }

    const fontSizeValue = Object.keys(fontVariables).find(key => fontVariables[key] === fontSize.value);

    wysiwyg.restoreLastSelection();
    handleCommand(fontSizeValue);
}

// RGB → HEX 변환 함수
function rgbToHex(rgb) {
    const matches = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!matches) return '#000000';
    const r = parseInt(matches[1]);
    const g = parseInt(matches[2]);
    const b = parseInt(matches[3]);
    return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

const onColorInputMouseDown = (event) => {
    event.preventDefault(); // 기본 동작 방지

    const selectedCells = document.querySelectorAll('td.selected-cell, td.dragged-cell');
    const firstCell = selectedCells[0];

    if (!firstCell) return;

    const currentBgColor = window.getComputedStyle(firstCell).backgroundColor;
    bgColor.value = rgbToHex(currentBgColor);

    setTimeout(() => {
        bgColorInputRef.value.click(); // 강제로 팔레트 열기
    }, 50);
};

const handleColorInput = (e, type) => {
    const colorValue = e.target.value;
    const selectedCells = document.querySelectorAll('td.selected-cell, td.dragged-cell');

    if (selectedCells.length > 1) {
        // 테이블 셀에 색상 적용
        selectedCells.forEach((cell) => {
            if (type === 'textColor') {
                cell.style.color = colorValue;
            } else if (type === 'bgColor') {
                cell.style.backgroundColor = colorValue;
            }
        });
    } else {
        const selection = window.getSelection();

        if (selection.rangeCount > 0) {
            wysiwyg.restoreLastSelection();
            wysiwyg.command(colorValue);
        }
    }
};

const handleCommand = (command) => {
    if (!wysiwyg) return;
    // 색상 값이 직접 전달된 경우 (#색상값 형식)
    if (typeof command === 'string' && command.startsWith('#')) {
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
            console.log('wysiwyg callback', c);
            checkToolBar();

            if (c.range) {
                currentRange = c.range;
                // console.log('currentRange', currentRange);
                // c.range.insertNode(document.createTextNode('Hi'));
            }
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

                if (typeof (c.commandTracker.color) === 'string' && c.commandTracker.color.startsWith('#')) {
                    textColor.value = c.commandTracker.color;
                } else {
                    textColor.value = '#000000'; // 기본 색상
                }

                const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
                let selectedHeadings = headings.filter(h => commandTracker.value[h]);

                if (selectedHeadings.length === 0) {
                    fontSize.value = 12;
                } else if (selectedHeadings.length === 1) {
                    fontSize.value = fontVariables[selectedHeadings[0]];
                } else {
                    let sort = selectedHeadings.sort();
                    console.log('sort', sort);
                    fontSize.value = fontVariables[sort[0]];
                }
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

let allSelectPrevious = false;

// Ctrl+A 이벤트 처리
function handleEditorKeyDown(e) {
    let editorEl = document.getElementById('myeditor');

    if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        if (!editorEl) return;

        allSelectPrevious = true;

        // 기본 Ctrl+A 동작 유지
        // e.preventDefault()를 제거하여 기본 텍스트 선택 동작을 유지
        setTimeout(() => {
            // 테이블 내 모든 셀 선택
            const tables = editorEl.querySelectorAll('table');
            tables.forEach((table) => {
                table.classList.add('selected-all');
            });
        }, 0); // 기본 동작 이후 실행되도록 딜레이 추가
    } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        let startLine = currentRange.startLine;
        let endLine = currentRange.endLine;

        if (startLine?.classList.contains('wysiwyg-table-wrap') || endLine?.classList.contains('wysiwyg-table-wrap')) {
            // 테이블 선택 해제
            // clearTableSelection();
            console.log('테이블 선택 되어 있었음');
        }
    } else if (e.key === 'Delete' || e.key === 'Backspace') { // e.code vs e.key
        if (allSelectPrevious) {
            e.preventDefault(); // 기본 동작 방지

            editorEl.innerHTML = '<p></p>'; // 내용 초기화
            nextTick(() => {
                editorEl.focus();
            });
        }
    }
    else {
        allSelectPrevious = false;
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
};

const updateToolbarPosition = () => {
    const editorEl = document.getElementById('myeditor');
    if (editorEl) {
        const editorRect = editorEl.getBoundingClientRect();
        const newLeft = editorRect.left + window.scrollX;
        document.body.style.setProperty('--wysiwyg-tool-bar-left', `${newLeft}px`);
        document.body.style.setProperty('--wysiwyg-tool-bar-width', `${editorRect.width}px`);
    }
};

let checkToolBar = () => {
    const wysiwygToolEl = wysiwygTool.value;
    const editorEl = document.getElementById('myeditor');
    const headerEl = document.getElementById('header');

    if (!wysiwygToolEl || !editorEl || !headerEl) return;

    const navBarHeight = headerEl.offsetHeight;
    const toolRect = wysiwygToolEl.getBoundingClientRect();
    const editorRect = editorEl.getBoundingClientRect();

    if (toolRect.top <= navBarHeight && editorRect.top < navBarHeight) {
        isFixed.value = true;
    } else {
        isFixed.value = false;
    }
}

function copyTableContent(originalTable, newTable) {
    const originalRows = originalTable.rows;
    const newRows = newTable.rows;
    const removeCells = new Set();

    const tableState = {
        tableWrap: newTable.parentNode,
        table: newTable,
        tbody: newTable.querySelector('tbody'),
        mergeBtn: newTable.querySelector('.btn-merge'),
        unmergeBtn: newTable.querySelector('.btn-unmerge'),
        isResizing: false,
        isDragging: false,
        isSelection: false,
        isMouseDown: false,
        selectionStart: null,
        outlinePosition: {
            top: 0,
            left: 0,
            width: 0,
            height: 0
        }
    }

    function getMergedCellRemoveRange(startRow, startCol, endRow, endCol) {
        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                if (!(r === startRow && c === startCol)) {
                    removeCells.add(`${r},${c}`);
                }
            }
        }
    }

    // 병합 셀 범위 먼저 모두 수집
    for (let r = 0; r < originalRows.length && r < newRows.length; r++) {
        const originalCells = originalRows[r].cells;
        for (let c = 0; c < originalCells.length; c++) {
            const originalCell = originalCells[c];
            const originalCellRange = {
                startRow: r,
                startCol: c,
                endRow: r + originalCell.rowSpan - 1,
                endCol: c + originalCell.colSpan - 1
            };
            if (originalCellRange.startRow !== originalCellRange.endRow || originalCellRange.startCol !== originalCellRange.endCol) {
                getMergedCellRemoveRange(
                    originalCellRange.startRow,
                    originalCellRange.startCol,
                    originalCellRange.endRow,
                    originalCellRange.endCol
                );
            }
        }
    }

    // 셀 삭제는 역순으로(인덱스 꼬임 방지)
    for (let r = 0; r < newRows.length; r++) {
        const newCells = newRows[r].cells;
        for (let c = newCells.length - 1; c >= 0; c--) {
            if (removeCells.has(`${r},${c}`)) {
                newRows[r].deleteCell(c);
            }
        }
    }

    // 그 후 남은 셀에 대해 colSpan/rowSpan, 내용 복사
    for (let r = 0; r < originalRows.length && r < newRows.length; r++) {
        const originalCells = originalRows[r].cells;
        const newCells = newRows[r].cells;
        for (let c = 0; c < originalCells.length && c < newCells.length; c++) {
            const originalCell = originalCells[c];
            const newCell = newCells[c];

            if (originalCell.colSpan > 1) newCell.setAttribute('colspan', originalCell.colSpan);
            if (originalCell.rowSpan > 1) newCell.setAttribute('rowspan', originalCell.rowSpan);

            // originalCell.innerHTML.trim() 안에 br 태그 제거 -> 제거 안하면 붙여넣었을때 지워지지 않고 공간만 남음
            const brTags = originalCell.querySelectorAll('br');
            brTags.forEach((br) => {
                if (br.parentNode) {
                    br.parentNode.removeChild(br);
                }
            });

            newCell.innerHTML = originalCell.innerHTML.trim() || '&nbsp;';
            newCell.style = originalCell.style.cssText || '';
            newCell.style.width = originalCell.width + 'px' || 'auto';
            newCell.style.height = originalCell.height + 'px' || 'auto';

            addResizer(tableState, newCell);
        }
    }

    resetTableCellData(newTable);
}

const insertHtmlToWysiwyg = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const body = doc.body;

    const tables = body.querySelectorAll('table');

    if (tables.length) {
        console.log(tables.length, '테이블 개수');
        tables.forEach((originalTable) => {
            // 테이블 행(row) 수와 열(column) 수 계산
            const rows = originalTable.rows.length;
            let cols = 0;

            if (rows > 0) {
                cols = Array.from(originalTable.rows[0].cells).reduce((acc, cell) => {
                    return acc + (cell.colSpan || 1);
                }, 0);
            }

            let newTableWrap = insertTableToWysiwyg(wysiwyg, rows, cols);
            let newTable = newTableWrap.querySelector('table');

            if (newTable) {
                copyTableContent(originalTable, newTable); // 테이블 내용 복사
                originalTable.replaceWith(newTableWrap);
                newTableWrap.remove();
            }
        });
    }

    const editorEl = document.getElementById('myeditor');
    if (editorEl) {
        console.log(body.innerHTML);
        insertHtmlAtCursor(body.innerHTML);
        // // 커서 위치에 삽입하려면 execCommand 사용, 아니면 그냥 innerHTML로 대체
        // document.execCommand('insertHTML', false, body.innerHTML);
    }
}

function insertHtmlAtCursor(html) {
    let sel = window.getSelection();
    if (!sel.rangeCount) return;

    let range = sel.getRangeAt(0);
    range.deleteContents();

    // HTML을 파싱해서 fragment로 변환
    let temp = document.createElement('div');
    temp.innerHTML = html;
    let frag = document.createDocumentFragment();
    let node;
    while ((node = temp.firstChild)) {
        frag.appendChild(node);
    }

    range.insertNode(frag);

    // 커서를 마지막에 위치시키기
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
}

onMounted(() => {
    initWysiwyg();
    updateToolbarPosition();

    document.addEventListener('keydown', handleEditorKeyDown);
    document.addEventListener('keyup', handleEditorKeyUp);
    document.addEventListener('click', clearTableSelection);
    document.addEventListener('scroll', checkToolBar);
    window.addEventListener('resize', () => {
        updateToolbarPosition();
        checkToolBar();
    });

    let editorEl = document.getElementById('myeditor');
    editorEl.addEventListener('click', (e) => {
        allSelectPrevious = false;
    });
    editorEl.addEventListener('paste', (e) => {
        const clipboardData = e.clipboardData || window.Clipboard;
        const items = clipboardData.items;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            if (item.type === 'text/html') {
                e.preventDefault();

                item.getAsString((data) => {
                    console.log('data', data);
                    insertHtmlToWysiwyg(data);
                });
            }
        }
    });
});

onUnmounted(() => {
    document.removeEventListener('keydown', handleEditorKeyDown);
    document.removeEventListener('keyup', handleEditorKeyUp);
    document.removeEventListener('click', clearTableSelection);
    document.removeEventListener('scroll', checkToolBar);
    window.removeEventListener('resize', () => {
        updateToolbarPosition();
        checkToolBar();
    });
});

onBeforeUnmount(() => {
    wysiwyg = null;
});

defineExpose({
    exportData
});
</script>

<style lang="less">
.wysiwyg {
    position: relative;
    width: 100%;
    height: 100%;
    // min-height: 18rem;
    // max-height: calc(100vh - var(--header-height) - 32px);
}

._wysiwyg4all {
    padding: 1rem;
    padding-top: 3rem;
    height: 100%;
    min-height: 20rem !important;
    // min-height: calc(18rem - 2rem) !important;
    // height: calc(100% - 2rem) !important;
    overflow-x: auto;

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
    position: absolute;
    top: 0;
    left: 0;
    z-index: 99;
    width: 100%;
    padding: 4px 8px;
    border-bottom: 1px solid var(--gray-color-200);
    border-radius: 0.5rem 0.5rem 0 0;
    background-color: #fff;
    overflow: hidden;
    gap: 8px;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;

    &.disalbed {
        display: none;
    }

    &.fixed {
        position: fixed;
        top: var(--header-height);
        left: var(--wysiwyg-tool-bar-left);
        width: var(--wysiwyg-tool-bar-width);
    }

    .divider {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
    }
}

.btn-custom {
    position: relative;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 8px;

    &:hover,
    &:focus,
    &:active {
        background-color: var(--gray-color-200);
    }

    &.active {
        background-color: var(--gray-color-200);
    }

    &::after {
        content: '';
        position: absolute;
        top: 0;
        right: -10px;
        width: 1px;
        height: 100%;
        background-color: var(--gray-color-200);
        opacity: 0;
    }

    &.line {
        margin-right: 12px;

        &::after {
            opacity: 1;
        }
    }

    .icon {
        padding: 0;

        &.text {
            font-weight: 700;
            color: var(--gray-color-500);
        }
    }
}

.input-size {
    padding: 0;
    width: unset;
    height: unset;
    cursor: default;

    &:hover,
    &:focus,
    &:active {
        background-color: transparent;
    }

    button {
        padding: 4px 6px;
        border-radius: 8px;

        &:hover {
            background-color: var(--gray-color-200);
        }

        &:disabled {
            cursor: default;

            &:hover {
                background-color: transparent;
            }

            .icon {
                svg {
                    fill: var(--gray-color-300);
                }
            }
        }

        .icon {
            svg {
                width: 16px;
                height: 16px;
            }
        }
    }
}

.font-size {
    border: 1px solid var(--gray-color-300);
    background-color: var(--gray-color-50);
    border-radius: 8px;
    padding: 2px 8px;
    height: unset;
    text-align: center;
    font-size: 14px;
    margin: 0 4px;
}

/* 테이블 스타일링 */
.wysiwyg-table-wrap {
    max-width: var(--wysiwyg-table-max-width);
    position: relative;
    /* overflow-x: auto; */
    /* overflow-y: unset !important; */
    white-space: nowrap;
    padding-bottom: 30px;

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

@media (max-width: 1017px) {
    ._wysiwyg4all {
        padding-top: 5rem;
    }
}

@media (max-width: 522px) {
    ._wysiwyg4all {
        padding-top: 7rem;
    }
}
</style>
