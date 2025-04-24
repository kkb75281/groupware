<template lang="pug">
.wysiwyg-table-wrapper
  table.wysiwyg-table(ref="table")
    tbody
      tr(v-for="r in rows" :key="`row-${r}`" :data-row="r-1")
      td(v-for="c in cols" :key="`cell-${r}-${c}`" contenteditable="true" :data-col="c-1" :data-row="r-1" @focus="handleFocus" @blur="handleBlur") &nbsp;

  //- 셀 추가 삭제 버튼
  .table-controls(v-if="showControls")
    .row-controls
      button.btn-control.add-row(type="button" @click="addRow") +
      button.btn-control.remove-row(type="button" @click="removeRow") -

  //- 셀 리사이징
  .row-resizer(v-for="r in rows" :key="`row-resizer-${r}`" :data-row="r-1")
  .col-resizer(v-for="c in cols" :key="`col-resizer-${c}`" :data-col="c-1")
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue';
import { insertTableToWysiwyg } from '@/components/wysiwygTable';

const props = defineProps({
  initialRows: {
    type: Number,
    default: 3
  },
  initialCols: {
    type: Number,
    default: 3
  },
  showControls: {
    type: Boolean,
    default: true
  }
});

const rows = ref(3);
const cols = ref(3);
const resizing = reactive({
  active: false,
  type: null,
  index: null,
  startPos: null,
  startSize: null
});

const table = ref(null);
const tableWrapper = ref(null);
const emit = defineEmits(['table-changed']);

const handleFocus = (e) => {
  e.target.style.outline = '2px solid #4a90e2';
};

const handleBlur = (e) => {
  e.target.style.outline = 'none';
};

const addRow = async () => {
  rows.value++;
  await nextTick();
  setupResizers();
};

const removeRow = async () => {
  if (rows.value > 1) {
    rows.value--;
    await nextTick();
    setupResizers();
  }
};

const addColumn = async () => {
  cols.value++;
  await nextTick();
  setupResizers();
};

const removeColumn = async () => {
  if (cols.value > 1) {
    cols.value--;
    await nextTick();
    setupResizers();
  }
};

const setupResizers = async () => {
  await nextTick();

  const rowResizers = tableWrapper.value.querySelectorAll('.row-resizer');
  rowResizers.forEach((resizer, index) => {
    if (index < rows.value) {
      const row = table.value.querySelectorAll('tr')[index];
      if (row) {
        const rowRect = row.getBoundingClientRect();
        Object.assign(resizer.style, {
          top: `${rowRect.bottom - 5}px`,
          left: `0`,
          width: `100%`,
          height: `5px`,
          cursor: 'row-resize'
        });
        setupResizerEvents(resizer, 'row', index);
      }
    }
  });

  const colResizers = tableWrapper.value.querySelectorAll('.col-resizer');
  colResizers.forEach((resizer, index) => {
    if (index < cols.value) {
      const firstRow = table.value.querySelector('tr');
      if (firstRow) {
        const cell = firstRow.querySelectorAll('td')[index];
        if (cell) {
          const cellRect = cell.getBoundingClientRect();
          Object.assign(resizer.style, {
            left: `${cellRect.right - 5}px`,
            top: `0`,
            width: `5px`,
            height: `100%`,
            cursor: 'col-resize'
          });
          setupResizerEvents(resizer, 'col', index);
        }
      }
    }
  });
};

const setupResizerEvents = (resizer, type, index) => {
  resizer.onmousedown = (e) => {
    e.preventDefault();
    resizing.active = true;
    resizing.type = type;
    resizing.index = index;
    resizing.startPos = type === 'row' ? e.clientY : e.clientX;
    resizing.startSize =
      type === 'row'
        ? table.value.querySelectorAll('tr')[index].offsetHeight
        : table.value.querySelector('tr').querySelectorAll('td')[index].offsetWidth;

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);

    resizer.style.backgroundColor = '#4a90e2';
  };

  resizer.onmouseover = () => {
    if (!resizing.active) resizer.style.backgroundColor = '#4a90e2';
  };

  resizer.onmouseout = () => {
    if (!resizing.active) resizer.style.backgroundColor = 'transparent';
  };
};

const handleResizeMove = (e) => {
  if (!resizing.active) return;
  e.preventDefault();

  const { type, index, startPos, startSize } = resizing;

  if (type === 'row') {
    const newY = e.clientY;
    const deltaY = newY - startPos;
    const newHeight = Math.max(30, startSize + deltaY);

    const rowsEl = table.value.querySelectorAll('tr');
    if (rowsEl[index]) {
      rowsEl[index].style.height = `${newHeight}px`;
    }
  } else {
    const newX = e.clientX;
    const deltaX = newX - startPos;
    const newWidth = Math.max(50, startSize + deltaX);

    table.value.querySelectorAll('tr').forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells[index]) {
        cells[index].style.width = `${newWidth}px`;
      }
    });
  }
};

const handleResizeEnd = () => {
  if (!resizing.active) return;

  const resizers =
    resizing.type === 'row'
      ? tableWrapper.value.querySelectorAll('.row-resizer')
      : tableWrapper.value.querySelectorAll('.col-resizer');

  if (resizers[resizing.index]) {
    resizers[resizing.index].style.backgroundColor = 'transparent';
  }

  resizing.active = false;
  resizing.type = null;
  resizing.index = null;
  resizing.startPos = null;
  resizing.startSize = null;

  document.removeEventListener('mousemove', handleResizeMove);
  document.removeEventListener('mouseup', handleResizeEnd);

  emit('table-changed', {
    rows: rows.value,
    cols: cols.value,
    element: tableWrapper.value
  });
};

onMounted(() => {
  setupResizers();
});
</script>

<style scoped lang="less">
.wysiwyg-table-wrapper {
  position: relative;
  margin: 0.5rem 0 1.5rem;
  width: 100%;
}

.wysiwyg-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.wysiwyg-table td {
  border: 1px solid #000;
  padding: 5px;
  min-width: 50px;
  height: 30px;
  background-color: white;
  overflow: hidden;
  word-break: break-word;
  white-space: normal;
}

/* 테이블 컨트롤 버튼 */
.table-controls {
  position: absolute;
  pointer-events: auto;
}

.row-controls {
  position: absolute;
  display: flex;
  bottom: -24px;
  left: 0;
}

.col-controls {
  position: absolute;
  display: flex;
  flex-direction: column;
  top: 0;
  right: -24px;
}

.control-btn {
  width: 24px;
  height: 24px;
  background-color: var(--gray-color-200, #e5e7eb);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: bold;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 리사이저 */
.row-resizer,
.col-resizer {
  position: absolute;
  background-color: transparent;
  z-index: 10;
  transition: background-color 0.2s;
}

.row-resizer {
  height: 5px;
  width: 100%;
  cursor: row-resize;
}

.col-resizer {
  width: 5px;
  height: 100%;
  cursor: col-resize;
}
</style>
