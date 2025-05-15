// 테이블을 wysiwyg에 삽입
export function insertTableToWysiwyg(wysiwyg, rows, cols) {
  if (!wysiwyg) return;
  if (isNaN(rows) || isNaN(cols) || rows <= 0 || cols <= 0) {
    alert('올바른 숫자를 입력하세요.');
    return;
  }

  const tableElement = createTable(rows, cols);

  wysiwyg.command({
    element: tableElement,
    contenteditable: true,
    focus: true
  });
}

// 테이블 생성
export function createTable(rows, cols) {
  let tableState = {
    tableWrap: null,
    table: null,
    tbody: null,
    mergeBtn: null,
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
  };

  const wysrap = document.querySelector('.wysiwyg-wrap');
  const wysrapWidth = wysrap.offsetWidth;

  // 전체 테이블 컨테이너 생성
  const tableWrap = document.createElement('div');

  tableWrap.className = 'wysiwyg-table-wrap';
  tableWrap.style.setProperty('--wysiwyg-table-max-width', `calc(${wysrapWidth}px - 2rem + 30px)`);

  // 테이블 요소 생성
  const table = document.createElement('table');
  table.className = 'wysiwyg-table';

  const tbody = document.createElement('tbody');

  const style = document.createElement('style');
  style.textContent = `
    body {
        --merge-btn-top: 0px;
        --merge-btn-left: 0px;
    }
  `;

  for (let r = 0; r < rows; r++) {
    const row = document.createElement('tr');

    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('td');
      cell.contentEditable = 'true';
      cell.innerHTML = '&nbsp;';
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.setAttribute('tabindex', '0');

      addResizer(tableState, cell);
      bindCellEvents(tableState, cell);

      row.appendChild(cell);
    }

    tbody.appendChild(row);
  }

  table.appendChild(tbody);
  tableWrap.appendChild(table);

  tableState.tableWrap = tableWrap;
  tableState.table = table;
  tableState.tbody = tbody;

  document.addEventListener('mouseup', () => {
    if (tableState.isDragging) {
      tableState.isDragging = false;
      tableSelection(tableState);

      const selected = tableState.table.querySelectorAll('td.dragged-cell');
      if (selected.length >= 2) {
        tableState.mergeBtn.classList.add('active'); // 조건에 따라 활성화
      }
    } else {
      tableState.mergeBtn.classList.remove('active'); // 단일 클릭 시 무조건 비활성화
    }
    tableState.isMouseDown = false;
  });

  document.addEventListener('click', (e) => {
    if (tableState.table && !tableState.table.contains(e.target)) {
      tableState.isSelection = false;
      clearSelection(tableState.table);
      tableSelection(tableState);
    }
  });

  initButtons(tableState);

  return tableWrap;
}

// 셀에 이벤트 바인딩
export function bindCellEvents(tableState, cell) {
  cell.addEventListener('click', (e) => {
    if (!tableState.isMouseDown) return;

    setTimeout(() => {
      tableState.mergeBtn.classList.remove('active'); // 클릭 시 버튼 숨김
      clearSelection(tableState.table);
      cell.classList.add('selected-cell');
      tableState.isSelection = true;
      tableState.isDragging = false;
      cell.focus();
      tableSelection(tableState);
    }, 0);
  });

  cell.addEventListener('mousedown', (e) => {
    // if (e.target.classList.contains('resizer') || e.target.classList.contains('resizer-bottom')) {
    //   return;
    // }
    // if (e.button !== 0) return;

    tableState.isMouseDown = true;
    tableState.isDragging = true;
    tableState.selectionStart = cell;
    tableState.mergeBtn.classList.remove('active');
    clearSelection(tableState.table);
    highlightDrag(tableState, cell);
  });

  cell.addEventListener('mouseover', () => {
    if (tableState.isDragging) {
      highlightDrag(tableState, cell);
    }
  });
}

// 테이블 마지막 행 삭제
function removeLastRow(tableState) {
  const lastRow = tableState.table.lastElementChild;
  if (lastRow && lastRow.tagName === 'TR') {
    lastRow.remove();
  }
  refreshAllResizers(tableState);
}

// 테이블 리사이저 갱신
function refreshAllResizers(tableState) {
  const cells = tableState.table.querySelectorAll('td');
  cells.forEach((cell) => {
    addResizer(tableState, cell); // 리사이저 다시 붙이기
  });
}

// 리사이저 추가
export function addResizer(tableState, cell) {
  const existingResizer = cell.querySelector('.resizer');
  const existingResizerBottom = cell.querySelector('.resizer-bottom');

  if (existingResizer) existingResizer.remove();
  if (existingResizerBottom) existingResizerBottom.remove();

  const resizer = document.createElement('div');
  resizer.className = 'resizer';
  resizer.setAttribute('contenteditable', 'false');

  // 리사이징 시작
  resizer.onmousedown = (e) => {
    e.stopPropagation();
    tableState.isResizing = true;

    // 다른 리사이저 active 제거
    document.querySelectorAll('.resizer').forEach((r) => r.classList.remove('active'));

    // 현재 리사이저에만 active 적용
    resizer.classList.add('active');

    resizeColumn(e, tableState, cell);
  };

  // 마우스 진입 시 active 추가 (리사이징 중이 아닐 때만)
  resizer.onmouseenter = (e) => {
    if (!tableState.isResizing || !tableState.isDragging) {
      e.currentTarget.classList.add('active');
    }
  };

  // 마우스 벗어날 때 active 제거
  resizer.onmouseleave = (e) => {
    e.currentTarget.classList.remove('active');
  };

  cell.appendChild(resizer);

  // 하단 리사이저도 동일하게 처리 가능
  const resizerBottom = document.createElement('div');
  resizerBottom.className = 'resizer-bottom';
  resizerBottom.setAttribute('contenteditable', 'false');

  resizerBottom.onmousedown = (e) => {
    e.stopPropagation();
    tableState.isResizing = true;
    document.querySelectorAll('.resizer-bottom').forEach((r) => r.classList.remove('active'));
    resizerBottom.classList.add('active');
    resizeRow(e, tableState, cell);
  };

  resizerBottom.onmouseenter = (e) => {
    if (!tableState.isResizing || !tableState.isDragging) {
      e.currentTarget.classList.add('active');
    }
  };

  resizerBottom.onmouseleave = (e) => {
    e.currentTarget.classList.remove('active');
  };

  cell.appendChild(resizerBottom);
}

// 행 너비 조절
function resizeColumn(e, tableState, cell) {
  e.stopPropagation();

  const colIndex = parseInt(cell.dataset.col);
  const nextCell = tableState.table.rows[0].cells[colIndex + 1];
  const resizer = e.currentTarget;

  const startX = e.clientX;
  const startCellWidth = cell.offsetWidth;

  function onMouseMove(e) {
    const diffX = e.clientX - startX;

    if (!tableState.isDragging || !tableState.isResizing) {
      resizer.classList.add('active');
    }

    // 모든 행의 해당 열 셀 크기 변경
    for (let i = 0; i < tableState.table.rows.length; i++) {
      const currentCell = tableState.table.rows[i].cells[colIndex];
      const currentNextCell = tableState.table.rows[i].cells[colIndex + 1];

      currentCell.style.width = `${startCellWidth + diffX}px`;
    }

    cell.style.width = `${startCellWidth + diffX}px`;
  }

  function onMouseUp() {
    tableState.isResizing = false;
    resizer.classList.remove('active');

    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);

    setTimeout(() => updateButtonPositions(tableState), 0);
  }

  document.addEventListener('mousemove', onMouseMove); // 드래그하는 동안 크기 변경
  document.addEventListener('mouseup', onMouseUp); // 리사이징 종료
}

// 행 높이 조절
function resizeRow(e, tableState, cell) {
  e.preventDefault();
  e.stopPropagation();
  const rowIndex = parseInt(cell.dataset.row);
  const resizer = e.currentTarget;

  let startY = e.pageY;
  let startHeight = cell.offsetHeight;

  function onMouseMove(e) {
    const diffY = e.pageY - startY;
    const newHeight = Math.max(20, startHeight + diffY);

    const row = tableState.table.rows[rowIndex];
    for (let i = 0; i < row.cells.length; i++) {
      row.cells[i].style.height = `${newHeight}px`;
    }
  }

  function onMouseUp() {
    tableState.isResizing = false;
    resizer.classList.remove('active');
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    setTimeout(() => updateButtonPositions(tableState), 0);
  }

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

// 드래그 시 선택된 셀 강조
function highlightDrag(tableState, end) {
  if (!tableState.isDragging) return;

  const targetTable = tableState.table;
  const [startRow, startCol] = getCellCoords(tableState.selectionStart);
  const [endRow, endCol] = getCellCoords(end);

  // 드래그 시작점과 끝점이 속한 셀의 실제 범위 가져오기
  const startRange = getCellRange(tableState.selectionStart);
  const endRange = getCellRange(end);

  // 초기 드래그 영역 설정 (병합된 셀까지 반영)
  let minRow = Math.min(startRange.startRow, endRange.startRow);
  let maxRow = Math.max(startRange.endRow, endRange.endRow);
  let minCol = Math.min(startRange.startCol, endRange.startCol);
  let maxCol = Math.max(startRange.endCol, endRange.endCol);

  const cellsInArea = new Set();

  // 전체 사각형 영역 검사
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      const cell = targetTable.querySelector(`td[data-row='${r}'][data-col='${c}']`);
      if (cell) {
        cellsInArea.add(cell);
      } else {
        // 셀이 없는 곳은 주변 셀 중 병합된 셀이 포함되었는지 확인
        const surroundingCell = findMergedCellContaining(targetTable, r, c);
        if (surroundingCell) {
          cellsInArea.add(surroundingCell);
        }
      }
    }
  }

  // 병합된 셀까지 확장
  const expandedCells = expandToMergedCells(tableState.table, Array.from(cellsInArea));

  // 최종 선택 범위 재계산
  let newMinRow = Infinity,
    newMaxRow = -Infinity;
  let newMinCol = Infinity,
    newMaxCol = -Infinity;

  expandedCells.forEach((cell) => {
    const { startRow, startCol, endRow, endCol } = getCellRange(cell);
    newMinRow = Math.min(newMinRow, startRow);
    newMaxRow = Math.max(newMaxRow, endRow);
    newMinCol = Math.min(newMinCol, startCol);
    newMaxCol = Math.max(newMaxCol, endCol);
  });

  minRow = newMinRow;
  maxRow = newMaxRow;
  minCol = newMinCol;
  maxCol = newMaxCol;

  const finalCells = [];
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      const cell = targetTable.querySelector(`td[data-row='${r}'][data-col='${c}']`);
      if (cell) finalCells.push(cell);
    }
  }

  // UI 업데이트 및 선택 처리
  clearSelection(tableState.table);

  if (finalCells.length > 0) {
    const firstCell = finalCells[0];
    const rect = firstCell.getBoundingClientRect();
    const wrapRect = tableState.tableWrap.getBoundingClientRect();
    tableState.outlinePosition.top = rect.top - wrapRect.top + tableState.tableWrap.scrollTop;
    tableState.outlinePosition.left = rect.left - wrapRect.left + tableState.tableWrap.scrollLeft;

    document.body.style.setProperty('--merge-btn-top', `${tableState.outlinePosition.top - 28}px`);
    document.body.style.setProperty('--merge-btn-left', `${tableState.outlinePosition.left}px`);
  }

  if (tableState.selectionStart === end) {
    end.classList.add('selected-cell');
  } else {
    tableState.selectionStart.classList.add('selected-cell');
    finalCells.forEach((cell) => {
      cell.classList.add('dragged-cell');
    });
  }

  tableSelection(tableState);
}

// 특정 좌표 (r, c)를 포함하는 병합된 셀을 찾아 반환
function findMergedCellContaining(table, r, c) {
  const allCells = table.querySelectorAll('td');

  for (const cell of allCells) {
    const { startRow, startCol, endRow, endCol } = getCellRange(cell);
    if (r >= startRow && r <= endRow && c >= startCol && c <= endCol) {
      return cell;
    }
  }

  return null;
}

// 병합된 셀까지 포함하여 전체 범위 확장
function expandToMergedCells(table, cells) {
  const allCells = new Set([...cells]);

  for (const cell of cells) {
    const { startRow, startCol, endRow, endCol } = getCellRange(cell);
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const target = table.querySelector(`td[data-row='${r}'][data-col='${c}']`);
        if (target) allCells.add(target);
      }
    }
  }

  return Array.from(allCells);
}

// 선택된 셀 저장용 (나중에 병합 등에 사용 가능)
export function clearSelection(table) {
  table.querySelectorAll('td').forEach((cell) => {
    cell.classList.remove('selected-cell', 'dragged-cell');
  });

  const mergeBtn = table.querySelector('.btn-merge');
  if (mergeBtn) mergeBtn.classList.remove('active');
}

// 드래그 시에만 selection 막기
export function tableSelection(tableState) {
  if (tableState.isSelection) {
    tableState.table.classList.remove('dragging');
  } else {
    tableState.table.classList.add('dragging');
  }
}

// 셀 좌표 가져오기
function getCellCoords(cell) {
  return [parseInt(cell.dataset.row), parseInt(cell.dataset.col)];
}

// 셀 범위 가져오기
function getCellRange(cell) {
  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);
  const rowSpan = cell.rowSpan || 1;
  const colSpan = cell.colSpan || 1;

  return {
    startRow: row,
    startCol: col,
    endRow: row + rowSpan - 1,
    endCol: col + colSpan - 1
  };
}

// 테이블 열,행 추가/삭제 버튼 추가
export function initButtons(tableState) {
  const existingMergeBtn = tableState.tableWrap.querySelector('button.btn-merge');
  const existingRowBtns = tableState.table.querySelector('.wysiwyg-table-row-btns');
  const existingColBtns = tableState.table.querySelector('.wysiwyg-table-col-btns');

  if (existingMergeBtn) existingMergeBtn.remove();
  if (existingRowBtns) existingMergeBtn.remove();
  if (existingColBtns) existingMergeBtn.remove();

  // 행/열 병합 버튼
  const mergeBtn = document.createElement('button');
  mergeBtn.className = 'btn-merge';
  mergeBtn.type = 'button';
  mergeBtn.textContent = 'Merge';
  mergeBtn.addEventListener('click', (e) => {
    const selected = document.querySelectorAll('td.selected-cell, td.dragged-cell');
    if (selected.length < 2) return alert('최소 2개 이상의 셀을 선택하세요.');

    // 병합할 전체 범위 계산
    let minRow = Infinity;
    let maxRow = -Infinity;
    let minCol = Infinity;
    let maxCol = -Infinity;

    // 각 셀의 실제 범위를 고려해 전체 범위 확장
    selected.forEach((cell) => {
      const { startRow, startCol, endRow, endCol } = getCellRange(cell);
      minRow = Math.min(minRow, startRow);
      maxRow = Math.max(maxRow, endRow);
      minCol = Math.min(minCol, startCol);
      maxCol = Math.max(maxCol, endCol);
    });

    // 병합할 셀들의 width 수집 (첫 번째 행 기준)
    let totalWidth = 0;
    for (let c = minCol; c <= maxCol; c++) {
      const firstRowCell = tableState.table.querySelector(
        `td[data-row='${minRow}'][data-col='${c}']`
      );
      if (firstRowCell) {
        const cellWidth = parseInt(firstRowCell.style.width, 10); // 기본값 100
        totalWidth += cellWidth;
      }
    }

    // 기존 셀 삭제 (기준 셀 제외)
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const cell = tableState.table.querySelector(`td[data-row='${r}'][data-col='${c}']`);
        if (cell && !(r === minRow && c === minCol)) {
          cell.remove();
        }
      }
    }

    // 기준 셀 설정
    const master = tableState.table.querySelector(`td[data-row='${minRow}'][data-col='${minCol}']`);
    if (!master) return;

    master.setAttribute('rowSpan', maxRow - minRow + 1);
    master.setAttribute('colSpan', maxCol - minCol + 1);
    master.classList.remove('selected-cell', 'dragged-cell');
    master.style.width = `${totalWidth}px`;

    refreshAllResizers(tableState); // 리사이저 갱신
  });

  tableState.tableWrap.appendChild(mergeBtn);
  tableState.mergeBtn = mergeBtn;

  const rowBtns = document.createElement('div');
  rowBtns.className = 'wysiwyg-table-row-btns';

  // 행 추가 버튼
  const addRowBtn = document.createElement('button');
  addRowBtn.id = 'addRow';
  addRowBtn.innerText = '+';
  addRowBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const rows = tableState.table.rows.length;
    const cols = tableState.table.rows[0]?.cells.length || 0;
    const newRow = document.createElement('tr');
    for (let c = 0; c < cols; c++) {
      const newCell = document.createElement('td');
      newCell.dataset.row = rows;
      newCell.dataset.col = c;
      newCell.setAttribute('contenteditable', 'true');
      newCell.innerHTML = '&nbsp;';
      addResizer(tableState, newCell);
      bindCellEvents(tableState, newCell);
      newRow.appendChild(newCell);
    }
    tableState.tbody.appendChild(newRow);
    refreshAllResizers(tableState);

    setTimeout(() => updateButtonPositions(tableState), 0); // ✅ 딜레이 주어 DOM 갱신 대기
  });

  // 행 삭제 버튼
  const removeRowBtn = document.createElement('button');
  removeRowBtn.id = 'removeRow';
  removeRowBtn.innerText = '-';
  removeRowBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const rows = tableState.table.rows.length;
    if (rows <= 1) return alert('최소 한 개의 행은 남아야 합니다.');
    const lastRow = tableState.tbody.lastElementChild;
    if (lastRow && lastRow.tagName === 'TR') {
      lastRow.remove();
    }
    refreshAllResizers(tableState);

    setTimeout(() => updateButtonPositions(tableState), 0); // ✅ 딜레이 주어 DOM 갱신 대기
  });

  rowBtns.appendChild(addRowBtn);
  rowBtns.appendChild(removeRowBtn);
  tableState.table.appendChild(rowBtns);

  const colBtns = document.createElement('div');
  colBtns.className = 'wysiwyg-table-col-btns';

  // 열 추가 버튼
  const addColBtn = document.createElement('button');
  addColBtn.id = 'addCol';
  addColBtn.innerText = '+';
  addColBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const rows = tableState.table.rows.length;
    const existingCols = tableState.table.rows[0]?.cells.length || 0;
    for (let r = 0; r < rows; r++) {
      const newCell = document.createElement('td');
      newCell.dataset.row = r;
      newCell.dataset.col = existingCols;
      newCell.setAttribute('contenteditable', 'true');
      newCell.innerHTML = '&nbsp;';
      addResizer(tableState, newCell);
      bindCellEvents(tableState, newCell);
      tableState.tbody.rows[r].appendChild(newCell);
    }
    refreshAllResizers(tableState);

    setTimeout(() => updateButtonPositions(tableState), 0); // ✅ 딜레이 주어 DOM 갱신 대기

    setTimeout(() => {
      const scrollContainer = tableState.tableWrap; // .wysiwyg-table-wrap
      if (scrollContainer) {
        scrollContainer.scrollLeft = scrollContainer.scrollWidth;
      }
    }, 0);
  });

  // 열 삭제 버튼
  const removeColBtn = document.createElement('button');
  removeColBtn.id = 'removeCol';
  removeColBtn.innerText = '-';
  removeColBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const cols = tableState.table.rows[0]?.cells.length || 0;
    if (cols <= 1) return alert('최소 한 개의 열은 남아야 합니다.');
    const cells = document.querySelectorAll(`td[data-col='${cols - 1}']`);
    cells.forEach((cell) => cell.remove());
    refreshAllResizers(tableState);

    setTimeout(() => {
      updateButtonPositions(tableState);

      const scrollContainer = tableState.tableWrap; // .wysiwyg-table-wrap

      if (scrollContainer) {
        const newScrollLeft = Math.min(
          scrollContainer.scrollLeft,
          scrollContainer.scrollWidth - scrollContainer.clientWidth
        );
        scrollContainer.scrollLeft = newScrollLeft;
      }
    }, 0);
  });

  colBtns.appendChild(addColBtn);
  colBtns.appendChild(removeColBtn);
  tableState.table.appendChild(colBtns);

  // 테이블에 마우스 오버/아웃 이벤트 추가
  function showButtons() {
    rowBtns.classList.add('show');
    colBtns.classList.add('show');
  }

  function hideButtons() {
    rowBtns.classList.remove('show');
    colBtns.classList.remove('show');
  }

  // 테이블 전체 영역 감시
  tableState.tableWrap.addEventListener('mouseenter', showButtons);
  tableState.tableWrap.addEventListener('mouseleave', hideButtons);

  setTimeout(() => updateButtonPositions(tableState), 0); // 초기화 시에도 적용
}

function updateButtonPositions(tableState) {
  const table = tableState.table;

  requestAnimationFrame(() => {
    const tableWidth = table.offsetWidth;
    const tableHeight = table.offsetHeight;

    const rowBtns = table.querySelector('.wysiwyg-table-row-btns');
    const colBtns = table.querySelector('.wysiwyg-table-col-btns');

    if (rowBtns) {
      rowBtns.style.setProperty('width', `${tableWidth}px`, 'important');
    }

    if (colBtns) {
      colBtns.style.setProperty('height', `${tableHeight}px`, 'important');
    }
  });
}
