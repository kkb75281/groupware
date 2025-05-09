export function createTable(cols, rows, isCreate = false) {
  // 드래그 관련 변수
  let isDragging = false;
  let startCell = null;
  let endCell = null;
  let showMergeBtn = false;
  let selectedCellsArray = [];
  let outlinePosition = {
    top: 0,
    left: 0,
    width: 0,
    height: 0
  };

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

  // 테이블 스타일 추가
  const style = document.createElement('style');

  // 셀 병합 버튼
  const mergeBtn = document.createElement('button');
  mergeBtn.className = 'btn-merge';
  mergeBtn.type = 'button';
  mergeBtn.textContent = 'Merge';
  mergeBtn.classList.add('hidden'); // 기본적으로 숨김 처리

  mergeBtn.addEventListener('click', () => {
    console.log('fffff');

    if (!selectedCellsArray.length) {
      console.warn('병합할 셀이 없습니다.');
      return;
    }

    // const firstCell = selectedCellsArray[0];
    const rows = Array.from(tbody.querySelectorAll('tr'));

    // 최소/최대 행/열 계산
    let minRow = Infinity,
      maxRow = -Infinity;
    let minCol = Infinity,
      maxCol = -Infinity;

    selectedCellsArray.forEach(({ rowIndex, colIndex }) => {
      minRow = Math.min(minRow, rowIndex);
      maxRow = Math.max(maxRow, rowIndex);
      minCol = Math.min(minCol, colIndex);
      maxCol = Math.max(maxCol, colIndex);
    });

    console.log({ minRow, maxRow, minCol, maxCol });

    const startCell = selectedCellsArray[0].cell;
    if (!startCell) return;

    // 셀 내용 병합
    // let mergedContent = '';
    // for (let r = minRow; r <= maxRow; r++) {
    //   for (let c = minCol; c <= maxCol; c++) {
    //     const cell = rows[r].querySelector(`td[data-col-index="${c}"]`);
    //     if (cell) {
    //       mergedContent += cell.innerText + '\n';
    //       if (!(r === minRow && c === minCol)) {
    //         cell.style.display = 'none';
    //       } else {
    //         cell.setAttribute('rowspan', maxRow - minRow + 1);
    //         cell.setAttribute('colspan', maxCol - minCol + 1);
    //         cell.innerText = mergedContent.trim();
    //       }
    //     }
    //   }
    // }

    // 🧹 기존 병합 해제 (이미 rowspan/colspan이 있는 경우)
    const existingMerged = table.querySelectorAll('td[rowspan], td[colspan]');
    existingMerged.forEach((cell) => {
      cell.removeAttribute('rowspan');
      cell.removeAttribute('colspan');
    });

    // 💡 병합할 셀들의 내용 합치기
    let mergedContent = '';
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const cell = rows[r].querySelector(`td[data-col-index="${c}"]`);
        if (!cell) continue;

        mergedContent += cell.innerHTML + '<br>';
        if (r !== minRow || c !== minCol) {
          // 시작 셀만 남기고 나머지는 제거
          cell.remove(); // 👈 DOM에서 셀 직접 삭제
        }
      }
    }

    // ✅ 시작 셀에 rowspan / colspan 적용
    startCell.setAttribute('rowspan', maxRow - minRow + 1);
    startCell.setAttribute('colspan', maxCol - minCol + 1);
    startCell.classList.add('merged-cell');
    startCell.contentEditable = 'true'; // ✏️ 편집 가능하게 설정
    startCell.innerHTML = mergedContent.trim();

    // 🧼 선택 상태 초기화
    table.querySelectorAll('td').forEach((cell) => {
      cell.classList.remove('selected-cell');
    });

    // 🔄 인덱스 갱신
    updateRowIndexes(tbody);
    updateColumnIndexes(tbody);
  });

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
          cell.classList.remove('selected-cell', 'dragged-cell');
        });

        mergeBtn.classList.remove('active');
        mergeBtn.classList.add('hidden');
        console.log({ mergeBtn });

        // // 드래그 영역 외곽선 제거
        // const dragOutline = table.querySelector('.drag-area-outline');
        // console.log({ dragOutline });
        // if (dragOutline) {
        //   dragOutline.remove();
        // }

        // 현재 셀에 선택 표시
        td.classList.add('selected-cell');

        // 행 컨트롤을 현재 행 옆으로 이동
        updateRowControlPosition(table, parseInt(rowIndex));

        // 열 컨트롤을 현재 열 옆으로 이동
        updateColControlPosition(table, parseInt(colIndex));
      });

      td.addEventListener('mousedown', (e) => {
        if (!isCreate) return;

        isDragging = true;
        startCell = td;
        endCell = td;

        // 모든 셀 선택 해제
        table.querySelectorAll('td').forEach((cell) => {
          cell.classList.remove('selected-cell', 'dragged-cell');
        });

        // 시작 셀만 선택 표시
        // td.classList.add('selected-cell');

        // 데이터 갱신
        const rowIndex = td.parentElement.getAttribute('data-row-index');
        const colIndex = td.getAttribute('data-col-index');
        table.setAttribute('data-selected-row', rowIndex);
        table.setAttribute('data-selected-col', colIndex);
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

  // 드래그 중: mousemove 이벤트 추가
  document.addEventListener('mousemove', (e) => {
    if (!isDragging || !startCell) return;

    const target = e.target;

    if (target && target.tagName === 'TD') {
      endCell = target;

      // 모든 셀 초기화 후 새 영역 표시
      table.querySelectorAll('td').forEach((cell) => {
        cell.classList.remove('selected-cell');
        cell.classList.remove('dragged-cell');
      });

      selectCellsInRange(startCell, endCell);
    }
  });

  // 드래그 종료: mouseup 이벤트 추가
  document.addEventListener('mouseup', () => {
    if (!isDragging || !startCell) return;

    isDragging = false;

    const rowIdx = endCell.parentElement.getAttribute('data-row-index');
    const colIdx = endCell.getAttribute('data-col-index');

    console.log(`드래그가 끝난 셀: 행 ${rowIdx}, 열 ${colIdx}`);

    table.setAttribute('data-selected-row', rowIdx);
    table.setAttribute('data-selected-col', colIdx);

    // 컨트롤 위치 갱신
    updateRowControlPosition(table, parseInt(rowIdx));
    updateColControlPosition(table, parseInt(colIdx));

    if (startCell === endCell) {
      endCell.classList.add('selected-cell');
      endCell.classList.remove('dragged-cell');
    }

    if (selectedCellsArray.length > 1) {
      document.body.style.setProperty('--merge-btn-top', `${outlinePosition.top - 28}px`);
      document.body.style.setProperty('--merge-btn-left', `${outlinePosition.left}px`);
      mergeBtn.classList.remove('hidden');
      mergeBtn.classList.add('active');
    } else {
      mergeBtn.classList.remove('active');
      mergeBtn.classList.add('hidden');
    }

    // if (startCell !== endCell) {
    //   // 드래그 영역 외곽선 엘리먼트 생성
    //   const dragOutline = document.createElement('div');
    //   dragOutline.className = 'drag-area-outline';

    //   dragOutline.style.position = 'absolute';
    //   dragOutline.style.left = `${outlinePosition.left}px`;
    //   dragOutline.style.top = `${outlinePosition.top}px`;
    //   dragOutline.style.width = `${outlinePosition.width}px`;
    //   dragOutline.style.height = `${outlinePosition.height}px`;
    //   dragOutline.style.pointerEvents = 'none'; // 클릭 방지
    //   dragOutline.style.zIndex = '9999'; // 최상위로 표시
    //   dragOutline.style.boxSizing = 'border-box'; // 테두리 포함
    //   dragOutline.style.border = '1px dashed #487ff2'; // 외곽선 스타일
    //   dragOutline.style.display = 'block'; // 드래그 영역 표시

    //   table.appendChild(dragOutline);
    // }
  });

  // 셀 범위 선택 함수 정의
  function selectCellsInRange(start, end) {
    const rows = Array.from(table.querySelectorAll('tr'));
    const startRow = rows.indexOf(start.parentElement);
    const endRow = rows.indexOf(end.parentElement);
    const startCol = Array.from(start.parentElement.children).indexOf(start);
    const endCol = Array.from(end.parentElement.children).indexOf(end);

    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);

    selectedCellsArray = [];

    // 모든 셀 초기화
    table.querySelectorAll('td').forEach((cell) => {
      cell.classList.remove('selected-cell', 'dragged-cell');
    });

    // 시작 셀은 selected-cell
    console.log({ start });
    start.classList.add('selected-cell');

    for (let r = minRow; r <= maxRow; r++) {
      const cells = rows[r].querySelectorAll('td');
      for (let c = minCol; c <= maxCol; c++) {
        if (cells[c]) {
          cells[c].classList.add('dragged-cell');
          selectedCellsArray.push({
            cell: cells[c],
            rowIndex: r,
            colIndex: c
          }); // 선택된 셀 배열에 추가
        }
      }
    }

    // 드래그 영역 외곽선 표시
    const topLeft = rows[minRow].querySelectorAll('td')[minCol];
    const bottomRight = rows[maxRow].querySelectorAll('td')[maxCol];

    if (!topLeft || !bottomRight) return;

    const wrapRect = tableWrap.getBoundingClientRect();

    // 셀의 위치
    const rectTopLeft = topLeft.getBoundingClientRect();
    const rectBottomRight = bottomRight.getBoundingClientRect();

    // 드래그 영역 좌표 계산
    const outlineLeft = rectTopLeft.left + window.scrollX;
    const outlineTop = rectTopLeft.top + window.scrollY;
    const outlineWidth = rectBottomRight.right - rectTopLeft.left;
    const outlineHeight = rectBottomRight.bottom - rectTopLeft.top;

    console.log({ outlineLeft, outlineTop, outlineWidth, outlineHeight });
    console.log({ left: rectTopLeft.left, top: rectTopLeft.top });

    outlinePosition = {
      top: rectTopLeft.top - wrapRect.top,
      left: rectTopLeft.left - wrapRect.left,
      width: outlineWidth,
      height: outlineHeight
    };

    // loadingElement.style.setProperty('--loading-top', `${(window.innerHeight - mainWrap.value.getBoundingClientRect().top + scrollLocation - 200) / 2}px`);
  }

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
          cell.classList.remove('selected-cell', 'dragged-cell');
        });

        // mergeBtn.style.display = 'none';
        mergeBtn.classList.remove('active');
        mergeBtn.classList.add('hidden');

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

      td.addEventListener('mousedown', (e) => {
        if (!isCreate) return;

        isDragging = true;
        startCell = td;
        endCell = td;

        // 모든 셀 선택 해제
        table.querySelectorAll('td').forEach((cell) => {
          cell.classList.remove('selected-cell', 'dragged-cell');
        });

        // 시작 셀만 선택 표시
        // td.classList.add('selected-cell');

        // 데이터 갱신
        const rowIndex = td.parentElement.getAttribute('data-row-index');
        const colIndex = td.getAttribute('data-col-index');
        table.setAttribute('data-selected-row', rowIndex);
        table.setAttribute('data-selected-col', colIndex);
      });

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
          cell.classList.remove('selected-cell', 'dragged-cell');
        });

        // mergeBtn.style.display = 'none';
        mergeBtn.classList.remove('active');
        mergeBtn.classList.add('hidden');

        // 현재 셀에 선택 표시
        td.classList.add('selected-cell');

        // 행 컨트롤을 현재 행 옆으로 이동
        updateRowControlPosition(table, parseInt(rowIndex));

        // 열 컨트롤을 현재 열 옆으로 이동
        updateColControlPosition(table, parseInt(colIndex));
      });

      td.addEventListener('mousedown', (e) => {
        if (!isCreate) return;

        isDragging = true;
        startCell = td;
        endCell = td;

        // 모든 셀 선택 해제
        table.querySelectorAll('td').forEach((cell) => {
          cell.classList.remove('selected-cell', 'dragged-cell');
        });

        // 시작 셀만 선택 표시
        // td.classList.add('selected-cell');

        // 데이터 갱신
        const rowIndex = td.parentElement.getAttribute('data-row-index');
        const colIndex = td.getAttribute('data-col-index');
        table.setAttribute('data-selected-row', rowIndex);
        table.setAttribute('data-selected-col', colIndex);
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
  tableWrap.appendChild(mergeBtn);
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
  style.textContent = `
    body {
        --merge-btn-top: 0px;
        --merge-btn-left: 0px;
    }
    .wysiwyg-table td.selected-cell {
      border: 3px solid #487ff2;
      position: relative;
    }

    .wysiwyg-table td.dragged-cell {
      background-color: rgba(72, 127, 242, 0.1);
    }

    .wysiwyg-table *::selection {
      background: transparent;
    }

    .btn-merge.active {
        display: block;
        position: absolute;
        top: var(--merge-btn-top);
        left: var(--merge-btn-left);
        background-color: #487ff2;
        color: white;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        z-index: 9999;
    }

    .btn-merge.hidden {
        display: none;
        position: absolute;
        top: var(--merge-btn-top);
        left: var(--merge-btn-left);
        background-color: #487ff2;
        color: white;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        z-index: 9999;
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
    // const allRows = table.rows;
    // for (let i = 0; i < allRows.length; i++) {
    //   if (i === rowIndex) {
    //     allRows[i].classList.add('selected-row');
    //   } else {
    //     allRows[i].classList.remove('selected-row');
    //   }
    // }
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
    // for (let i = 0; i < table.rows.length; i++) {
    //   const row = table.rows[i];
    //   for (let j = 0; j < row.cells.length; j++) {
    //     if (j === colIndex) {
    //       row.cells[j].classList.add('selected-col');
    //     } else {
    //       row.cells[j].classList.remove('selected-col');
    //     }
    //   }
    // }
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
      cell.classList.remove('selected-cell', 'dragged-cell');
    });

    // 선택 표시 추가
    // firstCell.classList.add('selected-cell');

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
