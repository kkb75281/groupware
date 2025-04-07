import { createApp } from 'vue';
import wysiwygTable from '@/components/wysiwygTable.vue';

// 테이블 컴포넌트 생성 함수
export function createTableComponent(col, row) {
  try {
    // 테이블 컨테이너 생성
    const container = document.createElement('div');
    container.className = 'wysiwyg-table-container';

    // 테이블 컨트롤 버튼 생성
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'table-controls';
    controlsDiv.style.marginBottom = '0.5rem';
    controlsDiv.style.display = 'flex';
    controlsDiv.style.gap = '0.5rem';

    // 행 추가 버튼
    const addRowBtn = document.createElement('button');
    addRowBtn.className = 'control-btn';
    addRowBtn.textContent = '행 추가';
    addRowBtn.type = 'button';
    addRowBtn.style.padding = '0.25rem 0.5rem';
    addRowBtn.style.backgroundColor = '#f0f0f0';
    addRowBtn.style.border = '1px solid #ccc';
    addRowBtn.style.borderRadius = '3px';
    addRowBtn.style.cursor = 'pointer';
    addRowBtn.style.fontSize = '0.8rem';

    // 행 삭제 버튼
    const removeRowBtn = document.createElement('button');
    removeRowBtn.className = 'control-btn';
    removeRowBtn.textContent = '행 삭제';
    removeRowBtn.type = 'button';
    removeRowBtn.style.padding = '0.25rem 0.5rem';
    removeRowBtn.style.backgroundColor = '#f0f0f0';
    removeRowBtn.style.border = '1px solid #ccc';
    removeRowBtn.style.borderRadius = '3px';
    removeRowBtn.style.cursor = 'pointer';
    removeRowBtn.style.fontSize = '0.8rem';

    // 열 추가 버튼
    const addColBtn = document.createElement('button');
    addColBtn.className = 'control-btn';
    addColBtn.textContent = '열 추가';
    addColBtn.type = 'button';
    addColBtn.style.padding = '0.25rem 0.5rem';
    addColBtn.style.backgroundColor = '#f0f0f0';
    addColBtn.style.border = '1px solid #ccc';
    addColBtn.style.borderRadius = '3px';
    addColBtn.style.cursor = 'pointer';
    addColBtn.style.fontSize = '0.8rem';

    // 열 삭제 버튼
    const removeColBtn = document.createElement('button');
    removeColBtn.className = 'control-btn';
    removeColBtn.textContent = '열 삭제';
    removeColBtn.type = 'button';
    removeColBtn.style.padding = '0.25rem 0.5rem';
    removeColBtn.style.backgroundColor = '#f0f0f0';
    removeColBtn.style.border = '1px solid #ccc';
    removeColBtn.style.borderRadius = '3px';
    removeColBtn.style.cursor = 'pointer';
    removeColBtn.style.fontSize = '0.8rem';

    // 컨트롤 버튼 추가
    controlsDiv.appendChild(addRowBtn);
    controlsDiv.appendChild(removeRowBtn);
    controlsDiv.appendChild(addColBtn);
    controlsDiv.appendChild(removeColBtn);

    // 컨테이너에 컨트롤 추가
    container.appendChild(controlsDiv);

    // 테이블 생성
    const table = createTable(col, row);

    // 버튼 이벤트 연결
    addRowBtn.addEventListener('click', () => {
      table.addRow();
    });

    removeRowBtn.addEventListener('click', () => {
      const lastRowIndex = table.getRowsCount() - 1;
      if (lastRowIndex > 0) {
        table.removeRow(lastRowIndex);
      }
    });

    addColBtn.addEventListener('click', () => {
      table.addColumn();
    });

    removeColBtn.addEventListener('click', () => {
      const lastColIndex = table.getColsCount() - 1;
      if (lastColIndex > 0) {
        table.removeColumn(lastColIndex);
      }
    });

    // 컨테이너에 테이블 추가
    container.appendChild(table);

    return container;
  } catch (error) {
    console.error('테이블 컴포넌트 생성 중 오류:', error);
    return createFallbackTable(col, row);
  }
}

// 테이블 생성 함수
export function createTable(cols, rows) {
  let table = document.createElement('table');
  table.className = 'wysiwyg-table';

  // 테이블 스타일 설정
  table.style.borderCollapse = 'collapse';
  table.style.margin = '0';
  table.style.width = '100%';
  table.style.tableLayout = 'fixed';

  // 테이블 셀 생성
  for (let r = 0; r < rows; r++) {
    let tr = document.createElement('tr');
    tr.style.height = '30px';

    for (let c = 0; c < cols; c++) {
      let td = document.createElement('td');
      td.innerHTML = '&nbsp;';
      td.contentEditable = 'true';
      td.style.minWidth = '50px';
      td.style.minHeight = '30px';
      td.style.padding = '5px';
      td.style.border = '1px solid black';
      td.style.backgroundColor = 'white';
      td.style.margin = '0';
      td.style.overflow = 'hidden';
      td.style.wordBreak = 'break-word';
      td.style.whiteSpace = 'normal';

      // 포커스 스타일 추가
      td.addEventListener('focus', () => {
        td.style.outline = '2px solid #4a90e2';
      });

      td.addEventListener('blur', () => {
        td.style.outline = 'none';
      });

      tr.appendChild(td);
    }

    table.appendChild(tr);
  }

  // 테이블 유틸리티 함수
  table.getRowsCount = () => table.rows.length;
  table.getColsCount = () => (table.rows[0] ? table.rows[0].cells.length : 0);

  // 테이블 행 추가
  table.addRow = () => {
    let newRow = document.createElement('tr');
    newRow.style.height = '30px';

    let cols = table.getColsCount();
    for (let c = 0; c < cols; c++) {
      let td = document.createElement('td');
      td.innerHTML = '&nbsp;';
      td.contentEditable = 'true';
      td.style.minWidth = '50px';
      td.style.minHeight = '30px';
      td.style.padding = '5px';
      td.style.border = '1px solid black';
      td.style.backgroundColor = 'white';
      td.style.margin = '0';
      td.style.overflow = 'hidden';
      td.style.wordBreak = 'break-word';
      td.style.whiteSpace = 'normal';

      // 포커스 스타일 추가
      td.addEventListener('focus', () => {
        td.style.outline = '2px solid #4a90e2';
      });

      td.addEventListener('blur', () => {
        td.style.outline = 'none';
      });

      newRow.appendChild(td);
    }

    table.appendChild(newRow);
    console.log('행 추가됨', table.getRowsCount());
  };

  // 테이블 행 삭제
  table.removeRow = (rowIndex) => {
    if (rowIndex >= 0 && rowIndex < table.getRowsCount()) {
      table.deleteRow(rowIndex);
      console.log('행 삭제됨', table.getRowsCount());
    }
  };

  // 테이블 열 추가
  table.addColumn = () => {
    let rows = table.getRowsCount();
    for (let r = 0; r < rows; r++) {
      let td = document.createElement('td');
      td.innerHTML = '&nbsp;';
      td.contentEditable = 'true';
      td.style.minWidth = '50px';
      td.style.minHeight = '30px';
      td.style.padding = '5px';
      td.style.border = '1px solid black';
      td.style.backgroundColor = 'white';
      td.style.margin = '0';
      td.style.overflow = 'hidden';
      td.style.wordBreak = 'break-word';
      td.style.whiteSpace = 'normal';

      // 포커스 스타일 추가
      td.addEventListener('focus', () => {
        td.style.outline = '2px solid #4a90e2';
      });

      td.addEventListener('blur', () => {
        td.style.outline = 'none';
      });

      table.rows[r].appendChild(td);
    }

    console.log('열 추가됨', table.getColsCount());
  };

  // 테이블 열 삭제
  table.removeColumn = (colIndex) => {
    let rows = table.getRowsCount();
    for (let r = 0; r < rows; r++) {
      if (colIndex >= 0 && colIndex < table.rows[r].cells.length) {
        table.rows[r].deleteCell(colIndex);
      }
    }

    console.log('열 삭제됨', table.getColsCount());
  };

  return table;
}

// 대체 테이블 생성 함수 (오류 발생 시)
export function createFallbackTable(col, row) {
  return createTable(col, row);
}

// 위즈윅 테이블 삽입
export function insertTableToWysiwyg(wysiwyg, col, row, useVueComponent = false) {
  if (!wysiwyg) return;

  let tableElement = createTableComponent(col, row);

  wysiwyg.command({
    element: tableElement,
    contenteditable: true
  });

  console.log('테이블 삽입됨:', col, row);
}
