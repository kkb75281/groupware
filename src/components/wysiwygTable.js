export function createTable(cols, rows, isCreate = false) {
  // 전체 테이블 컨테이너 생성
  const tableWrap = document.createElement('div');
  tableWrap.className = 'wysiwyg-table-wrap';

  // 테이블 요소 생성
  const table = document.createElement('table');
  table.className = 'wysiwyg-table';
  table.setAttribute('data-resizable', 'true');

  const tbody = document.createElement('tbody');

  // 현재 선택된 행과 열을 추적하기 위한 데이터 속성
  table.setAttribute('data-selected-rows', '-1');
  table.setAttribute('data-selected-cols', '-1');

  // 행과 열 생성
  for (let r = 0; r < rows; r++) {
    const tr = document.createElement('tr');
    table.setAttribute('data-row-index', r); // 현재 행 설정

    for (let c = 0; c < cols; c++) {
      const td = document.createElement('td');
      td.contentEditable = isCreate ? 'true' : 'false';
      td.innerHTML = '&nbsp;';
      td.setAttribute('disabled', !isCreate);
      td.setAttribute('data-col-index', c); // 현재 열 설정

      // 셀 클릭 이벤트 추가 - 선택된 행과 열 정보 갱신
      td.addEventListener('click', (e) => {
        if (!isCreate) return;

        const rowIndex = tr.getAttribute('data-row-index');
        const colIndex = td.getAttribute('data-col-index');

        table.setAttribute('data-selected-row', rowIndex);
        table.setAttribute('data-selected-col', colIndex);

        // 모든 셀의 선택 상태 해제
        const allCells = table.querySelectorAll('td');
        allCells.forEach((cell) => {
          cell.classList.remove('selected-cell');
        });

        // 현재 셀에 선택 표시
        td.classList.add('selected-cell');

        // 행 컨트롤을 현재 행 옆으로 이동
        updateRowControlPosition(table, parseInt(rowIndex));

        // 열 컨트롤을 현재 열 옆으로 이동
        updateColControlPosition(table, parseInt(colIndex));
      });

      // 포커스 스타일 추가
      td.addEventListener('focus', () => {
        td.style.outline = '2px solid #4a90e2';
      });

      td.addEventListener('blur', () => {
        td.style.outline = 'none';
      });

      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  tableWrap.appendChild(table);

  // 행 컨트롤 버튼 그룹 생성
  const rowControlWrap = document.createElement('div');
  rowControlWrap.contentEditable = 'false';
  rowControlWrap.tabIndex = '-1';
  rowControlWrap.className = 'btn-control-wrap control-row';

  // 행 추가 버튼
  const addRowBtn = document.createElement('button');
  addRowBtn.className = 'btn-add';
  addRowBtn.type = 'button';
  addRowBtn.textContent = '+';

  // 행 추가 이벤트 (선택된 행 다음에 추가)
  addRowBtn.addEventListener('click', () => {
    const selectedRowIndex = parseInt(table.getAttribute('data-selected-row')); // 선택된 행 인덱스
    const tr = document.createElement('tr');
    const currentRowIndex = selectedRowIndex >= 0 ? selectedRowIndex + 1 : tbody.childNodes.length; // 새 행 인덱스

    tr.setAttribute('data-row-index', currentRowIndex);

    // 현재 테이블의 열 수 가져오기
    const currentCols = tbody.firstChild ? tbody.firstChild.childNodes.length : cols;

    for (let c = 0; c < currentCols; c++) {
      const td = document.createElement('td');
      td.contentEditable = 'true';
      td.innerHTML = '&nbsp;';
      td.setAttribute('data-col-index', c);

      // 셀 클릭 이벤트 추가
      td.addEventListener('click', (e) => {
        if (!isCreate) return;

        const rowIndex = tr.getAttribute('data-row-index');
        const colIndex = td.getAttribute('data-col-index');

        table.setAttribute('data-selected-row', rowIndex);
        table.setAttribute('data-selected-col', colIndex);

        // 모든 셀의 선택 상태 해제
        const allCells = table.querySelectorAll('td');
        allCells.forEach((cell) => {
          cell.classList.remove('selected-cell');
        });

        // 현재 셀에 선택 표시
        td.classList.add('selected-cell');

        // 행 컨트롤을 현재 행 옆으로 이동
        updateRowControlPosition(table, parseInt(rowIndex));

        // 열 컨트롤을 현재 열 옆으로 이동
        updateColControlPosition(table, parseInt(colIndex));
      });

      // 첫 번째 행의 같은 위치 셀이 있다면 너비 적용
      if (tbody.firstChild && tbody.firstChild.childNodes[c]) {
        const firstRowCell = tbody.firstChild.childNodes[c];
        if (firstRowCell.style.width) {
          td.style.width = firstRowCell.style.width;
        }
      }

      td.addEventListener('focus', () => {
        td.style.outline = '2px solid #4a90e2';
      });

      td.addEventListener('blur', () => {
        td.style.outline = 'none';
      });

      tr.appendChild(td);
    }

    // 선택된 행 다음에 새 행 삽입
    if (selectedRowIndex >= 0 && selectedRowIndex < tbody.childNodes.length) {
      tbody.insertBefore(tr, tbody.childNodes[selectedRowIndex].nextSibling);

      // 행 인덱스 재설정
      updateRowIndexes(tbody);
    } else {
      tbody.appendChild(tr);
    }

    // 새 행 추가 후 리사이징 핸들 재설정
    if (isCreate) {
      refreshTableResizers(table);
    }

    // 행 컨트롤 위치 업데이트
    updateRowControlPosition(
      table,
      selectedRowIndex >= 0 ? selectedRowIndex + 1 : tbody.childNodes.length - 1
    );
  });

  // 행 삭제 버튼
  const removeRowBtn = document.createElement('button');
  removeRowBtn.className = 'btn-remove';
  removeRowBtn.type = 'button';
  removeRowBtn.textContent = '-';

  // 행 삭제 이벤트 (선택된 행 삭제)
  removeRowBtn.addEventListener('click', () => {
    if (tbody.childNodes.length <= 1) return; // 최소 1행은 유지

    const selectedRowIndex = parseInt(table.getAttribute('data-selected-row'));

    // 선택된 열이 있으면 해당 열 삭제, 없으면 마지막 열 삭제
    if (selectedColIndex >= 0 && selectedColIndex < rows[0].cells.length) {
      for (let i = 0; i < rows.length; i++) {
        rows[i].removeChild(rows[i].cells[selectedColIndex]);
      }

      // 남은 열 중 마지막 열 또는 가장 가까운 열 선택
      let newSelectedCol = Math.min(selectedColIndex, rows[0].cells.length - 1);
      table.setAttribute('data-selected-col', newSelectedCol);
    } else {
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].cells.length > 1) {
          rows[i].removeChild(rows[i].cells[rows[i].cells.length - 1]);
        }
      }
    }

    // 열 인덱스 재설정
    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].cells;
      for (let j = 0; j < cells.length; j++) {
        cells[j].setAttribute('data-col-index', j);
      }
    }

    // 열 삭제 후 리사이저 업데이트
    addTableResizers(table, tableWrap);

    // 컨트롤 위치 업데이트
    const newSelectedCol = parseInt(table.getAttribute('data-selected-col'));
    updateColControlPosition(table, newSelectedCol);
  });

  // 열 컨트롤 버튼 그룹 생성
  const colControlWrap = document.createElement('div');
  colControlWrap.contentEditable = 'false';
  colControlWrap.tabIndex = '-1';
  colControlWrap.className = 'btn-control-wrap control-col';

  // 열 추가 버튼
  const addColBtn = document.createElement('button');
  addColBtn.className = 'btn-add';
  addColBtn.type = 'button';
  addColBtn.textContent = '+';

  // 열 추가 이벤트 (선택된 열 다음에 추가)
  addColBtn.addEventListener('click', (e) => {
    e.preventDefault();

    const selectedColIndex = parseInt(table.getAttribute('data-selected-col'));
    const rows = tbody.childNodes;
    const targetColIndex =
      selectedColIndex >= 0 ? selectedColIndex + 1 : rows[0]?.childNodes.length || 0;

    for (let i = 0; i < rows.length; i++) {
      const td = document.createElement('td');
      td.contentEditable = 'true';
      td.innerHTML = '&nbsp;';

      // 셀 클릭 이벤트 추가
      td.addEventListener('click', (e) => {
        if (!isCreate) return;

        const rowIndex = rows[i].getAttribute('data-row-index');
        const colIndex = td.getAttribute('data-col-index');

        table.setAttribute('data-selected-row', rowIndex);
        table.setAttribute('data-selected-col', colIndex);

        // 모든 셀의 선택 상태 해제
        const allCells = table.querySelectorAll('td');
        allCells.forEach((cell) => {
          cell.classList.remove('selected-cell');
        });

        // 현재 셀에 선택 표시
        td.classList.add('selected-cell');

        // 행 컨트롤을 현재 행 옆으로 이동
        updateRowControlPosition(table, parseInt(rowIndex));

        // 열 컨트롤을 현재 열 옆으로 이동
        updateColControlPosition(table, parseInt(colIndex));
      });

      td.addEventListener('focus', () => {
        td.style.outline = '2px solid #4a90e2';
      });

      td.addEventListener('blur', () => {
        td.style.outline = 'none';
      });

      // 선택된 열 다음에 새 열 삽입
      if (selectedColIndex >= 0 && selectedColIndex < rows[i].childNodes.length) {
        rows[i].insertBefore(td, rows[i].childNodes[selectedColIndex].nextSibling);
      } else {
        rows[i].appendChild(td);
      }
    }

    // 열 인덱스 재설정
    updateColumnIndexes(tbody);

    // 새 열 추가 후 리사이징 핸들 재설정
    if (isCreate) {
      refreshTableResizers(table);
    }

    // 열 컨트롤 위치 업데이트
    updateColControlPosition(
      table,
      selectedColIndex >= 0 ? selectedColIndex + 1 : rows[0]?.childNodes.length - 1
    );
  });

  // 열 삭제 버튼
  const removeColBtn = document.createElement('button');
  removeColBtn.className = 'btn-remove';
  removeColBtn.type = 'button';
  removeColBtn.textContent = '-';

  // 열 삭제 이벤트
  removeColBtn.addEventListener('click', (e) => {
    e.preventDefault();

    const rows = tbody.childNodes;
    if (rows[0]?.childNodes.length <= 1) return; // 최소 1열은 유지

    const selectedColIndex = parseInt(table.getAttribute('data-selected-col'));

    // 선택된 열이 있으면 해당 열 삭제, 없으면 마지막 열 삭제
    if (selectedColIndex >= 0 && selectedColIndex < rows[0].childNodes.length) {
      for (let i = 0; i < rows.length; i++) {
        rows[i].removeChild(rows[i].childNodes[selectedColIndex]);
      }

      // 남은 열 중 마지막 열 또는 가장 가까운 열 선택
      let newSelectedCol = Math.min(selectedColIndex, rows[0].childNodes.length - 1);
      table.setAttribute('data-selected-col', newSelectedCol);
    } else {
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].childNodes.length > 1) {
          rows[i].removeChild(rows[i].lastChild);
        }
      }
    }

    // 열 인덱스 재설정
    updateColumnIndexes(tbody);

    // 열 삭제 후 리사이징 핸들 재설정
    if (isCreate) {
      refreshTableResizers(table);
    }

    // 열 컨트롤 위치 업데이트
    const newSelectedCol = parseInt(table.getAttribute('data-selected-col'));
    updateColControlPosition(table, newSelectedCol);
  });

  if (isCreate) {
    rowControlWrap.appendChild(addRowBtn);
    rowControlWrap.appendChild(removeRowBtn);

    colControlWrap.appendChild(addColBtn);
    colControlWrap.appendChild(removeColBtn);
  }

  // 모든 컨트롤 추가
  tableWrap.appendChild(rowControlWrap);
  tableWrap.appendChild(colControlWrap);

  // 리사이징 기능 활성화 (편집 모드에서만)
  if (isCreate) {
    // 테이블 구조 완전히 렌더링 후 리사이저 추가
    setTimeout(() => {
      initializeTableResizers(table);
    }, 0);

    // 테이블 내용 변경 감지를 위한 MutationObserver 설정
    const tableObserver = new MutationObserver((mutations) => {
      let needsRefresh = false;

      mutations.forEach((mutation) => {
        if (
          mutation.type === 'childList' ||
          (mutation.type === 'attributes' &&
            (mutation.attributeName === 'style' || mutation.attributeName === 'class'))
        ) {
          needsRefresh = true;
        }
      });

      if (needsRefresh) {
        refreshTableResizers(table);
      }
    });

    tableObserver.observe(table, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    // Observer 레퍼런스 저장
    table._resizeObserver = tableObserver;
  }

  // 선택된 셀, 행, 열에 대한 스타일 추가
  const style = document.createElement('style');
  style.textContent = `
    .wysiwyg-table td.selected-cell {
      background-color: rgba(74, 144, 226, 0.1);
      position: relative;
    }
    
    .wysiwyg-table .selected-row {
      background-color: rgba(74, 144, 226, 0.05);
    }
    
    .wysiwyg-table .selected-col {
      background-color: rgba(74, 144, 226, 0.05);
    }
    
    /* 행 컨트롤 스타일 개선 */
    .btn-control-wrap.control-row {
      position: absolute;
      left: -30px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      z-index: 100;
      transition: top 0.2s ease;
    }
    
    /* 열 컨트롤 스타일 개선 */
    .btn-control-wrap.control-col {
      position: absolute;
      top: -30px;
      display: flex;
      flex-direction: row;
      gap: 4px;
      z-index: 100;
      transition: left 0.2s ease;
    }
    
    /* 컨트롤 버튼 스타일 개선 */
    .btn-add, .btn-remove {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: white;
      border: 1px solid #e4e4e7;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      line-height: 1;
      transition: all 0.2s ease;
    }
    
    .btn-add:hover, .btn-remove:hover {
      background-color: #f5f5f5;
    }
  `;
  document.head.appendChild(style);

  return tableWrap;
}

// 행 인덱스 업데이트 함수
function updateRowIndexes(tbody) {
  const rows = tbody.childNodes;
  for (let i = 0; i < rows.length; i++) {
    rows[i].setAttribute('data-row-index', i);

    // 각 셀의 행 인덱스 참조 업데이트
    const cells = rows[i].childNodes;
    for (let j = 0; j < cells.length; j++) {
      cells[j].setAttribute('data-row-index', i);
    }
  }
}

// 열 인덱스 업데이트 함수
function updateColumnIndexes(tbody) {
  const rows = tbody.childNodes;
  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].childNodes;
    for (let j = 0; j < cells.length; j++) {
      cells[j].setAttribute('data-col-index', j);
    }
  }
}

// 행 컨트롤 위치 업데이트 함수
function updateRowControlPosition(table, rowIndex) {
  const tableWrap = table.closest('.wysiwyg-table-wrap');
  if (!tableWrap) return;

  const rowControl = tableWrap.querySelector('.control-row');
  if (!rowControl) return;

  if (rowIndex >= 0 && rowIndex < table.rows.length) {
    const row = table.rows[rowIndex];

    // 행 컨트롤 위치 조정 - 선택된 행의 높이 중앙에 배치
    const top = row.offsetTop + row.offsetHeight / 2 - rowControl.offsetHeight / 2;
    rowControl.style.top = `${top}px`;
    rowControl.style.left = '5px'; // 왼쪽에 배치

    // 선택된 행 강조 표시
    const allRows = table.rows;
    for (let i = 0; i < allRows.length; i++) {
      if (i === rowIndex) {
        allRows[i].classList.add('selected-row');
      } else {
        allRows[i].classList.remove('selected-row');
      }
    }
  }
}

// 열 컨트롤 위치 업데이트 함수
function updateColControlPosition(table, colIndex) {
  const tableWrap = table.closest('.wysiwyg-table-wrap');
  if (!tableWrap) return;

  const colControl = tableWrap.querySelector('.control-col');
  if (!colControl) return;

  if (colIndex >= 0 && table.rows.length > 0 && colIndex < table.rows[0].cells.length) {
    const cell = table.rows[0].cells[colIndex];

    // 열 컨트롤 위치 조정 - 선택된 열의 가로 중앙에 배치
    const left = cell.offsetLeft + cell.offsetWidth / 2 - colControl.offsetWidth / 2;
    colControl.style.left = `${left}px`;
    colControl.style.top = '-24px'; // 위에 배치

    // 선택된 열 강조 표시
    for (let i = 0; i < table.rows.length; i++) {
      const row = table.rows[i];
      for (let j = 0; j < row.cells.length; j++) {
        if (j === colIndex) {
          row.cells[j].classList.add('selected-col');
        } else {
          row.cells[j].classList.remove('selected-col');
        }
      }
    }
  }
}

// 활성화된 테이블 초기 선택 상태 설정
function setInitialTableSelection(table) {
  if (!table) return;

  // 첫 번째 셀 선택
  if (table.rows.length > 0 && table.rows[0].cells.length > 0) {
    const firstCell = table.rows[0].cells[0];
    table.setAttribute('data-selected-row', 0);
    table.setAttribute('data-selected-col', 0);

    // 모든 셀의 선택 상태 초기화
    const allCells = table.querySelectorAll('td');
    allCells.forEach((cell) => {
      cell.classList.remove('selected-cell');
    });

    // 선택 표시 추가
    firstCell.classList.add('selected-cell');

    // 컨트롤 위치 업데이트
    updateRowControlPosition(table, 0);
    updateColControlPosition(table, 0);

    // 행, 열 인덱스 초기화
    updateRowIndexes(table.querySelector('tbody') || table);
    updateColumnIndexes(table.querySelector('tbody') || table);

    // 컨트롤 요소 위치 조정
    const tableWrap = table.closest('.wysiwyg-table-wrap');
    if (tableWrap) {
      const rowControl = tableWrap.querySelector('.control-row');
      const colControl = tableWrap.querySelector('.control-col');

      if (rowControl) {
        rowControl.style.left = '-30px';
        rowControl.style.top = `${firstCell.offsetTop + firstCell.offsetHeight / 2 - rowControl.offsetHeight / 2}px`;
      }

      if (colControl) {
        colControl.style.top = '-30px';
        colControl.style.left = `${firstCell.offsetLeft + firstCell.offsetWidth / 2 - colControl.offsetWidth / 2}px`;
      }
    }
  }
}

// 테이블 리사이저 초기화
function initializeTableResizers(table) {
  if (!table || !table.parentNode) return;

  // 테이블 컨테이너
  const tableWrap = table.parentNode;

  // 기존 리사이저 제거
  removeTableResizers(tableWrap);

  // 열 리사이저 추가
  addColumnResizers(table);

  // 행 리사이저 추가
  addRowResizers(table);
}

// 리사이저 요소 제거
function removeTableResizers(tableWrap) {
  const resizers = tableWrap.querySelectorAll('.table-resizer');
  resizers.forEach((resizer) => resizer.remove());
}

// 테이블 리사이저 새로고침
function refreshTableResizers(table) {
  setTimeout(() => {
    initializeTableResizers(table);
  }, 10);
}

// 열 리사이저 추가
function addColumnResizers(table) {
  const tableWrap = table.parentNode;
  const tableBounds = table.getBoundingClientRect();
  const tableLeft = tableBounds.left;

  // 각 열의 경계에 리사이저 추가
  if (table.rows.length === 0) return;

  const firstRow = table.rows[0];
  const cellCount = firstRow.cells.length;

  for (let i = 0; i < cellCount - 1; i++) {
    const cell = firstRow.cells[i];
    const cellBounds = cell.getBoundingClientRect();

    const resizer = document.createElement('div');
    resizer.className = 'table-resizer col-resizer';
    resizer.setAttribute('data-col-index', i);

    // 위치 계산 및 설정
    const left = cell.offsetLeft + cell.offsetWidth + 4;

    resizer.style.left = `${left}px`;
    resizer.style.height = `${table.offsetHeight}px`;

    // 드래그 이벤트 설정
    setupColumnResizerEvents(resizer, table, i);

    tableWrap.appendChild(resizer);
  }
}

// 행 리사이저 추가
function addRowResizers(table) {
  const tableWrap = table.parentNode;
  const rowCount = table.rows.length;

  // 모든 행에 리사이저 추가 (마지막 행 포함)
  for (let i = 0; i < rowCount; i++) {
    const row = table.rows[i];

    const resizer = document.createElement('div');
    resizer.className = 'table-resizer row-resizer';
    resizer.setAttribute('data-row-index', i);

    // 위치 계산 및 설정
    const top = row.offsetTop + row.offsetHeight + 2;
    const left = row.offsetLeft + 4;

    resizer.style.top = `${top}px`;
    resizer.style.left = `${left}px`;
    resizer.style.width = `${table.offsetWidth}px`;

    // 드래그 이벤트 설정
    setupRowResizerEvents(resizer, table, i);

    tableWrap.appendChild(resizer);
  }
}

// 열 리사이저 이벤트 설정
function setupColumnResizerEvents(resizer, table, colIndex) {
  // 리사이징 시작 (마우스 위치 기억)
  resizer.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const tableWrap = table.parentNode;
    tableWrap.classList.add('resizing-table');

    const cell = table.rows[0].cells[colIndex];
    const nextCell = table.rows[0].cells[colIndex + 1];

    const startX = e.clientX;
    const startWidthCell = cell.offsetWidth;
    const startWidthNextCell = nextCell.offsetWidth;

    resizer.classList.add('active');

    function onMouseMove(e) {
      const diffX = e.clientX - startX;

      // 최소 너비 제한
      if (startWidthCell + diffX < 30 || startWidthNextCell - diffX < 30) return;

      // 모든 행의 해당 열 셀 크기 변경
      for (let i = 0; i < table.rows.length; i++) {
        const currentCell = table.rows[i].cells[colIndex];
        const currentNextCell = table.rows[i].cells[colIndex + 1];

        currentCell.style.width = `${startWidthCell + diffX}px`;
        currentNextCell.style.width = `${startWidthNextCell - diffX}px`;
      }

      // 리사이저 위치 업데이트
      const newLeft = cell.offsetLeft + cell.offsetWidth - 4;
      resizer.style.left = `${newLeft}px`;
    }

    function onMouseUp() {
      resizer.classList.remove('active');
      tableWrap.classList.remove('resizing-table');

      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      // 업데이트된 위치로 모든 리사이저 재설정
      refreshTableResizers(table);
    }

    document.addEventListener('mousemove', onMouseMove); // 드래그하는 동안 크기 변경
    document.addEventListener('mouseup', onMouseUp); // 리사이징 종료
  });
}

// 행 리사이저 이벤트 설정
function setupRowResizerEvents(resizer, table, rowIndex) {
  resizer.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const tableWrap = table.parentNode;
    tableWrap.classList.add('resizing-table');

    const row = table.rows[rowIndex];
    const startY = e.clientY;
    const startHeightRow = row.offsetHeight;
    const startTableHeight = table.offsetHeight;

    // 마지막 행이 아닌 경우에만 다음 행 참조
    const isLastRow = rowIndex === table.rows.length - 1;
    let nextRow, startHeightNextRow;

    if (!isLastRow) {
      nextRow = table.rows[rowIndex + 1];
      startHeightNextRow = nextRow.offsetHeight;
    }

    resizer.classList.add('active');

    function onMouseMove(e) {
      const diffY = e.clientY - startY;

      // 최소 높이 제한
      if (startHeightRow + diffY < 20) return;
      if (!isLastRow && startHeightNextRow - diffY < 20) return;

      const rowCells = row.cells;

      if (isLastRow) {
        // 마지막 행인 경우 - 테이블 전체 높이 조정
        for (let i = 0; i < rowCells.length; i++) {
          rowCells[i].style.height = `${startHeightRow + diffY}px`;
        }

        // 테이블 전체 높이 조정
        table.style.height = `${startTableHeight + diffY}px`;

        // 열 리사이저 높이 업데이트
        const colResizers = tableWrap.querySelectorAll('.col-resizer');
        colResizers.forEach((colResizer) => {
          colResizer.style.height = `${table.offsetHeight}px`;
        });
      } else {
        // 일반 행인 경우 - 현재 행과 다음 행 사이의 경계 조정
        for (let i = 0; i < rowCells.length; i++) {
          rowCells[i].style.height = `${startHeightRow + diffY}px`;
        }

        const nextRowCells = nextRow.cells;
        for (let i = 0; i < nextRowCells.length; i++) {
          nextRowCells[i].style.height = `${startHeightNextRow - diffY}px`;
        }
      }

      // 리사이저 위치 이동
      const newTop = row.offsetTop + row.offsetHeight - 4;
      resizer.style.top = `${newTop}px`;
    }

    function onMouseUp() {
      resizer.classList.remove('active');
      tableWrap.classList.remove('resizing-table');

      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      // 업데이트된 위치로 모든 리사이저 재설정
      refreshTableResizers(table);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
}

// WYSIWYG 에디터에 테이블 삽입 함수
export function loadWysiwygTable(row, col, showBtn = false) {
  console.log('== loadWysiwygTable : showBtn == : ', showBtn);
  return createTable(Number(col) || 3, Number(row) || 3, showBtn);
}

// 테이블 삽입 함수
export function insertTableToWysiwyg(wysiwyg, col, row, showBtn = false) {
  console.log('== insertTableToWysiwyg : showBtn == : ', showBtn);
  if (!wysiwyg) return;

  const tableElement = loadWysiwygTable(row, col, showBtn);

  wysiwyg.command({
    element: tableElement,
    contenteditable: true,
    focus: true
  });

  console.log('테이블 삽입됨:', col, row);
}
