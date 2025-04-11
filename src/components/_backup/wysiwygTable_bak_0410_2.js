import { createApp, h } from 'vue';
import WysiwygTable from './wysiwygTable.vue';

// 현재 활성화된 테이블 컴포넌트 인스턴스를 추적
let activeTableInstances = [];

/**
 * Vue 컴포넌트를 HTML 요소로 변환하는 함수
 * @param {Number} rows - 초기 행 수
 * @param {Number} cols - 초기 열 수
 * @param {Boolean} showControls - 컨트롤 버튼 표시 여부
 * @returns {HTMLElement} - Vue 컴포넌트가 마운트된 HTML 요소
 */
export function createTableComponent(rows = 3, cols = 3, showControls = true) {
  // 테이블을 담을 컨테이너 생성
  const container = document.createElement('div');
  container.className = 'wysiwyg-table-container';

  // Vue 앱 생성 및 마운트
  const app = createApp({
    render() {
      return h(WysiwygTable, {
        initialRows: rows,
        initialCols: cols,
        showControls: showControls,
        onTableReady: this.handleTableReady,
        onTableChanged: this.handleTableChanged
      });
    },
    methods: {
      handleTableReady(tableInfo) {
        // 테이블이 준비되었을 때 처리
        console.log('테이블 준비됨:', tableInfo);
      },
      handleTableChanged(tableInfo) {
        // 테이블이 변경되었을 때 처리
        console.log('테이블 변경됨:', tableInfo);
      }
    }
  });

  // 테이블 컴포넌트 마운트
  const instance = app.mount(container);

  // 컴포넌트 인스턴스 저장
  activeTableInstances.push({
    element: container,
    instance,
    app
  });

  return container;
}

/**
 * WYSIWYG 에디터에 테이블 삽입
 * @param {Object} wysiwyg - WYSIWYG 에디터 인스턴스
 * @param {Number} cols - 열 수
 * @param {Number} rows - 행 수
 * @param {Boolean} showControls - 컨트롤 버튼 표시 여부
 */
export function insertTableToWysiwyg(wysiwyg, cols, rows, showControls = true) {
  if (!wysiwyg) return;

  // Vue 컴포넌트로 테이블 생성
  const tableElement = createTableComponent(rows, cols, showControls);

  // WYSIWYG 에디터에 삽입
  wysiwyg.command({
    element: tableElement,
    contenteditable: true,
    focus: true
  });

  console.log('테이블 삽입됨:', cols, rows);
}

/**
 * WYSIWYG 에디터에 HTML 테이블 삽입 (대체 방법)
 * Vue 컴포넌트 방식이 동작하지 않을 경우를 대비한 대체 방법
 */
export function insertHtmlTableToWysiwyg(wysiwyg, cols, rows) {
  if (!wysiwyg) return;

  // HTML 테이블 생성
  const tableWrap = document.createElement('div');
  tableWrap.className = 'wysiwyg-table-wrap';
  tableWrap.style.margin = '0.5rem 0 1.5rem';
  tableWrap.style.width = '100%';
  tableWrap.style.display = 'block';
  tableWrap.style.position = 'relative';

  const table = document.createElement('table');
  table.className = 'wysiwyg-table';
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.tableLayout = 'fixed';

  const tbody = document.createElement('tbody');

  // 테이블 셀 생성
  for (let r = 0; r < rows; r++) {
    const tr = document.createElement('tr');
    tr.style.height = '30px';

    for (let c = 0; c < cols; c++) {
      const td = document.createElement('td');
      td.contentEditable = 'true';
      td.innerHTML = '&nbsp;';
      td.style.border = '1px solid #000';
      td.style.padding = '5px';
      td.style.minWidth = '50px';
      td.style.minHeight = '30px';
      td.style.overflow = 'hidden';
      td.style.wordBreak = 'break-word';
      td.style.whiteSpace = 'normal';

      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  tableWrap.appendChild(table);

  // WYSIWYG 에디터에 삽입
  wysiwyg.command({
    element: tableWrap,
    contenteditable: true,
    focus: true
  });

  console.log('HTML 테이블 삽입됨:', cols, rows);
}

/**
 * 모든 활성 테이블 인스턴스 정리
 * 페이지 언마운트 시 호출해야 함
 */
export function cleanupTableInstances() {
  activeTableInstances.forEach(({ app }) => {
    app.unmount();
  });
  activeTableInstances = [];
}

// WYSIWYG 에디터에 사용할 테이블 로더
export function loadWysiwygTable(row, col, showBtn = false) {
  return createTableComponent(row, col, showBtn);
}
