import { createApp } from 'vue';
import wysiwygTable from '@/components/wysiwygTable.vue';

export let currentTable = null;

// 테이블 생성
export const createTable = (cols, rows) => {
  let table = document.createElement('table');

  // Vue 컴포넌트 생성 및 마운트
  const app = createApp(wysiwygTable, {
    col: Number(cols) || 3,
    row: Number(rows) || 3
  });
  app.mount(table);
  console.log({ app, table });

  table.style.borderCollapse = 'collapse';
  table.style.margin = '1rem 0';
  table.style.width = '100%';

  // 테이블 스타일 설정
  table.style.tableLayout = 'fixed';
  table.style.overflow = 'hidden';
  table.style.wordBreak = 'break-word';
  table.style.whiteSpace = 'normal';

  // 테이블 셀 생성
  for (let r = 0; r < rows; r++) {
    let tr = document.createElement('tr');
    for (let c = 0; c < cols; c++) {
      let td = document.createElement('td');
      td.innerHTML = '&nbsp;';
      td.style.minWidth = '50px';
      td.style.minHeight = '30px';
      td.style.padding = '5px';
      td.style.border = '1px solid black';
      td.style.backgroundColor = 'white';
      td.style.margin = '0';
      tr.appendChild(td);
    }
    table.appendChild(tr);
  }

  table.getRowsCount = () => table.rows.length; // 테이블의 행 수
  table.getColsCount = () => (table.rows[0] ? table.rows[0].cells.length : 0); // 테이블의 열 수

  // 테이블 행 추가
  table.addRow = () => {
    console.log('addRow');
    let newRow = document.createElement('tr');
    let cols = table.getColsCount();
    for (let c = 0; c < cols; c++) {
      let td = document.createElement('td');
      td.innerHTML = '&nbsp;';
      td.style.minWidth = '50px';
      td.style.minHeight = '30px';
      td.style.padding = '5px';
      td.style.border = '1px solid black';
      td.style.backgroundColor = 'white';
      td.style.margin = '0';
      newRow.appendChild(td);
    }
    table.appendChild(newRow);
  };

  // 테이블 행 삭제
  table.removeRow = (rowIndex) => {
    if (rowIndex >= 0 && rowIndex < table.getRowsCount()) {
      table.deleteRow(rowIndex);
    }
  };

  // 테이블 열 추가
  table.addColumn = () => {
    let rows = table.getRowsCount();
    for (let r = 0; r < rows; r++) {
      let td = document.createElement('td');
      td.innerHTML = '&nbsp;';
      td.style.minWidth = '50px';
      td.style.minHeight = '30px';
      td.style.padding = '5px';
      td.style.border = '1px solid black';
      td.style.backgroundColor = 'white';
      td.style.margin = '0';
      table.rows[r].appendChild(td);
    }
  };

  // 테이블 열 삭제
  table.removeColumn = (colIndex) => {
    let rows = table.getRowsCount();
    for (let r = 0; r < rows; r++) {
      if (colIndex >= 0 && colIndex < table.rows[r].cells.length) {
        table.rows[r].deleteCell(colIndex);
      }
    }
  };

  // 셀 스타일 업데이트
  table.updateCellStyle = (rowIndex, colIndex, styleConfig) => {
    if (rowIndex >= 0 && rowIndex < table.getRowsCount()) {
      let row = table.rows[rowIndex];
      if (colIndex >= 0 && colIndex < row.cells.length) {
        let cell = row.cells[colIndex];
        if (styleConfig.backgroundColor) cell.style.backgroundColor = styleConfig.backgroundColor;
        if (styleConfig.borderColor || styleConfig.borderSize || styleConfig.borderStyle) {
          let borderSize = styleConfig.borderSize || '1px';
          let borderStyle = styleConfig.borderStyle || 'solid';
          let borderColor = styleConfig.borderColor || 'black';
          cell.style.border = `${borderSize} ${borderStyle} ${borderColor}`;
        }
        if (styleConfig.padding) cell.style.padding = styleConfig.padding;
        if (styleConfig.margin) cell.style.margin = styleConfig.margin;
      }
    }
  };

  currentTable = table; // 현재 테이블을 전역 변수에 저장

  return table;
};

// 위즈윅 테이블 삽입
export function insertTables(wysiwyg, col, row) {
  if (!wysiwyg) return;

  let tableElement;

  tableElement = createTable(col, row);

  wysiwyg.command({
    element: tableElement,
    contenteditable: true
  });
}
