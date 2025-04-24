export function createTable(cols, rows, isCreate = false) {
  // 전체 테이블 컨테이너 생성
  const tableWrap = document.createElement('div');
  tableWrap.className = 'wysiwyg-table-wrap';
  tableWrap.style.margin = '0.5rem 0 1.5rem';
  tableWrap.style.width = '100%';
  tableWrap.style.display = 'block';
  tableWrap.style.position = 'relative';

  // 테이블 요소 생성
  const table = document.createElement('table');
  table.className = 'wysiwyg-table';
  table.style.position = 'relative';
  table.style.borderCollapse = 'collapse';
  table.style.width = 'calc(100% - 10px)';
  table.style.tableLayout = 'fixed';
  table.style.margin = '0 auto';

  const tbody = document.createElement('tbody');

  console.log('== isCreate == : ', isCreate);

  // 행과 열 생성
  for (let r = 0; r < rows; r++) {
    const tr = document.createElement('tr');
    tr.style.height = '30px';

    for (let c = 0; c < cols; c++) {
      const td = document.createElement('td');
      td.contentEditable = isCreate ? 'true' : 'false';
      td.innerHTML = '&nbsp;';
      td.style.border = '1px solid #000';
      td.style.padding = '5px';
      td.style.minWidth = '50px';
      td.style.minHeight = '30px';
      td.style.backgroundColor = 'white';
      td.style.overflow = 'hidden';
      td.style.wordBreak = 'break-word';
      td.style.whiteSpace = 'normal';
      td.setAttribute('disabled', !isCreate);

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
  rowControlWrap.style.position = 'absolute';
  rowControlWrap.style.display = 'flex';
  rowControlWrap.style.bottom = '-24px';
  rowControlWrap.style.left = '5px';

  // 행 추가 버튼
  const addRowBtn = document.createElement('button');
  addRowBtn.className = 'btn-add';
  addRowBtn.type = 'button';
  addRowBtn.style.backgroundColor = 'var(--gray-color-200)';
  addRowBtn.style.width = '24px';
  addRowBtn.style.height = '24px';
  addRowBtn.style.display = 'flex';
  addRowBtn.style.alignItems = 'center';
  addRowBtn.style.justifyContent = 'center';
  addRowBtn.style.cursor = 'pointer';
  addRowBtn.style.fontWeight = 'bold';
  addRowBtn.textContent = '+';

  // 행 추가 이벤트
  addRowBtn.addEventListener('click', () => {
    const tr = document.createElement('tr');
    tr.style.height = '30px';

    // 현재 테이블의 첫 번째 행을 기준으로 열 수 가져오기
    const currentCols = tbody.firstChild ? tbody.firstChild.childNodes.length : cols;

    for (let c = 0; c < currentCols; c++) {
      const td = document.createElement('td');
      td.contentEditable = 'true';
      td.style.border = '1px solid #000';
      td.style.padding = '5px';
      td.style.minWidth = '50px';
      td.style.minHeight = '30px';
      td.style.backgroundColor = 'white';
      td.style.overflow = 'hidden';
      td.style.wordBreak = 'break-word';
      td.style.whiteSpace = 'normal';

      td.addEventListener('focus', () => {
        td.style.outline = '2px solid #4a90e2';
      });

      td.addEventListener('blur', () => {
        td.style.outline = 'none';
      });

      tr.appendChild(td);
    }

    tbody.appendChild(tr);

    // 새 행 추가 후 리사이징 핸들 재설정
    if (isCreate) {
      setupTableResizing(table);
    }
  });

  // 행 삭제 버튼
  const removeRowBtn = document.createElement('button');
  removeRowBtn.className = 'btn-remove';
  removeRowBtn.type = 'button';
  removeRowBtn.style.backgroundColor = 'var(--gray-color-200)';
  removeRowBtn.style.width = '24px';
  removeRowBtn.style.height = '24px';
  removeRowBtn.style.display = 'flex';
  removeRowBtn.style.alignItems = 'center';
  removeRowBtn.style.justifyContent = 'center';
  removeRowBtn.style.cursor = 'pointer';
  removeRowBtn.style.fontWeight = 'bold';
  removeRowBtn.textContent = '-';

  // 행 삭제 이벤트
  removeRowBtn.addEventListener('click', () => {
    if (tbody.childNodes.length > 1) {
      tbody.removeChild(tbody.lastChild);

      // 행 삭제 후 리사이징 핸들 재설정
      if (isCreate) {
        setupTableResizing(table);
      }
    }
  });

  // 열 컨트롤 버튼 그룹 생성
  const colControlWrap = document.createElement('div');
  colControlWrap.contentEditable = 'false';
  colControlWrap.tabIndex = '-1';
  colControlWrap.className = 'btn-control-wrap control-col';
  colControlWrap.style.position = 'absolute';
  colControlWrap.style.display = 'flex';
  colControlWrap.style.flexDirection = 'column';
  colControlWrap.style.top = '0';
  colControlWrap.style.right = '-19px';

  // 열 추가 버튼
  const addColBtn = document.createElement('button');
  addColBtn.className = 'btn-add';
  addColBtn.type = 'button';
  addColBtn.style.backgroundColor = 'var(--gray-color-200)';
  addColBtn.style.width = '24px';
  addColBtn.style.height = '24px';
  addColBtn.style.display = 'flex';
  addColBtn.style.alignItems = 'center';
  addColBtn.style.justifyContent = 'center';
  addColBtn.style.cursor = 'pointer';
  addColBtn.style.fontWeight = 'bold';
  addColBtn.textContent = '+';

  // 열 추가 이벤트
  addColBtn.addEventListener('click', (e) => {
    e.preventDefault();

    const rows = tbody.childNodes;
    for (let i = 0; i < rows.length; i++) {
      const td = document.createElement('td');
      td.contentEditable = 'true';
      td.innerHTML = '&nbsp;';
      td.style.border = '1px solid #000';
      td.style.padding = '5px';
      td.style.minWidth = '50px';
      td.style.minHeight = '30px';
      td.style.backgroundColor = 'white';
      td.style.overflow = 'hidden';
      td.style.wordBreak = 'break-word';
      td.style.whiteSpace = 'normal';

      td.addEventListener('focus', () => {
        td.style.outline = '2px solid #4a90e2';
      });

      td.addEventListener('blur', () => {
        td.style.outline = 'none';
      });

      rows[i].appendChild(td);
    }

    // 새 열 추가 후 리사이징 핸들 재설정
    if (isCreate) {
      setupTableResizing(table);
    }
  });

  // 열 삭제 버튼
  const removeColBtn = document.createElement('button');
  removeColBtn.className = 'btn-remove';
  removeColBtn.type = 'button';
  removeColBtn.style.backgroundColor = 'var(--gray-color-200)';
  removeColBtn.style.width = '24px';
  removeColBtn.style.height = '24px';
  removeColBtn.style.display = 'flex';
  removeColBtn.style.alignItems = 'center';
  removeColBtn.style.justifyContent = 'center';
  removeColBtn.style.cursor = 'pointer';
  removeColBtn.style.fontWeight = 'bold';
  removeColBtn.textContent = '-';

  // 열 삭제 이벤트
  removeColBtn.addEventListener('click', (e) => {
    e.preventDefault();

    const rows = tbody.childNodes;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].childNodes.length > 1) {
        rows[i].removeChild(rows[i].lastChild);
      }
    }

    // 열 삭제 후 리사이징 핸들 재설정
    if (isCreate) {
      setupTableResizing(table);
    }
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
    setupTableResizing(table);
  }

  return tableWrap;
}

// 테이블 리사이징 기능 설정
function setupTableResizing(table) {
  // 기존 리사이징 핸들 제거
  const existingHandles = table.parentNode.querySelectorAll('.resize-handle');
  existingHandles.forEach((handle) => handle.remove());

  // 리사이징 관련 스타일 추가
  addResizingStyles();

  // 열 리사이징 핸들 추가
  setupColumnResizing(table);

  // 행 리사이징 핸들 추가
  setupRowResizing(table);
}

// 리사이징 스타일 추가
function addResizingStyles() {
  // 스타일이 이미 존재하면 다시 추가하지 않음
  if (document.getElementById('table-resize-styles')) return;

  const style = document.createElement('style');
  style.id = 'table-resize-styles';
  style.textContent = `
      .col-resize-handle {
        position: absolute;
        top: 0;
        width: 5px;
        cursor: col-resize;
        z-index: 1;
        background-color: transparent;
      }
      .col-resize-handle:hover {
        background-color: #4a90e2;
      }
      .col-resize-handle.active {
        background-color: #4a90e2;
      }
      
      .row-resize-handle {
        position: absolute;
        left: 0;
        height: 5px;
        cursor: row-resize;
        z-index: 1;
        background-color: transparent;
      }
      .row-resize-handle:hover {
        background-color: #4a90e2;
      }
      .row-resize-handle.active {
        background-color: #4a90e2;
      }
    `;
  document.head.appendChild(style);
}

// 열 리사이징 설정
function setupColumnResizing(table) {
  const tableRect = table.getBoundingClientRect();
  const tableWrap = table.parentNode;
  const firstRow = table.rows[0];

  if (!firstRow) return;

  // 각 열마다 리사이징 핸들 추가
  for (let i = 0; i < firstRow.cells.length - 1; i++) {
    const cell = firstRow.cells[i];
    const nextCell = firstRow.cells[i + 1];
    const cellRect = cell.getBoundingClientRect();

    const handle = document.createElement('div');
    handle.className = 'resize-handle col-resize-handle';
    handle.style.height = `${table.offsetHeight}px`;
    handle.style.left = `${cell.offsetLeft + cell.offsetWidth}px`;

    // 드래그 이벤트 처리
    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();

      const startX = e.clientX;
      const startWidth = cell.offsetWidth;
      const nextStartWidth = nextCell.offsetWidth;

      handle.classList.add('active');

      function onMouseMove(e) {
        const diffX = e.clientX - startX;

        // 최소 너비 제한
        if (startWidth + diffX < 30 || nextStartWidth - diffX < 30) return;

        cell.style.width = `${startWidth + diffX}px`;
        nextCell.style.width = `${nextStartWidth - diffX}px`;

        // 핸들 위치 업데이트
        handle.style.left = `${cell.offsetLeft + cell.offsetWidth}px`;
      }

      function onMouseUp() {
        handle.classList.remove('active');
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      }

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    tableWrap.appendChild(handle);
  }
}

// 행 리사이징 설정
function setupRowResizing(table) {
  const tableWrap = table.parentNode;

  // 각 행마다 리사이징 핸들 추가 (마지막 행 제외)
  for (let i = 0; i < table.rows.length - 1; i++) {
    const row = table.rows[i];
    const nextRow = table.rows[i + 1];

    const handle = document.createElement('div');
    handle.className = 'resize-handle row-resize-handle';
    handle.style.width = `${table.offsetWidth}px`;
    handle.style.top = `${row.offsetTop + row.offsetHeight}px`;

    // 드래그 이벤트 처리
    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();

      const startY = e.clientY;
      const startHeight = row.offsetHeight;
      const nextStartHeight = nextRow.offsetHeight;

      handle.classList.add('active');

      function onMouseMove(e) {
        const diffY = e.clientY - startY;

        // 최소 높이 제한
        if (startHeight + diffY < 20 || nextStartHeight - diffY < 20) return;

        row.style.height = `${startHeight + diffY}px`;
        nextRow.style.height = `${nextStartHeight - diffY}px`;

        // 핸들 위치 업데이트
        handle.style.top = `${row.offsetTop + row.offsetHeight}px`;
      }

      function onMouseUp() {
        handle.classList.remove('active');
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      }

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    tableWrap.appendChild(handle);
  }
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
