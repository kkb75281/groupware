<template lang="pug">
.wysiwyg-table-wrapper
  .table-controls
    button.control-btn(type="button" @click="addRow") 행 추가
    button.control-btn(type="button" @click="removeRow") 행 삭제
    button.control-btn(type="button" @click="addColumn") 열 추가
    button.control-btn(type="button" @click="removeColumn") 열 삭제
    
  table.wysiwyg-table
    tbody
      tr(v-for="rowIndex in Number(rows)" :key="`row-${rowIndex}`")
        td(v-for="colIndex in Number(cols)" :key="`${rowIndex}-${colIndex}`" contenteditable="true") 
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { insertTableToWysiwyg } from '@/components/wysiwygTable.js';

const props = defineProps({
  col: {
    type: Number,
    default: 3
  },
  row: {
    type: Number,
    default: 3
  }
});

// 명시적으로 숫자형 변환하여 반응형 변수 초기화
const rows = ref(Number(props.row) || 3);
const cols = ref(Number(props.col) || 3);

// props 변경 시 반응형 변수 업데이트
watch(
  () => props.row,
  (newVal) => {
    rows.value = Number(newVal) || 3;
  }
);

watch(
  () => props.col,
  (newVal) => {
    cols.value = Number(newVal) || 3;
  }
);

const addRow = () => {
  rows.value = Number(rows.value) + 1;

  if (currentTable && typeof currentTable.addRow === 'function') {
    currentTable.addRow();
  }
};

const removeRow = () => {
  if (Number(rows.value) > 1) {
    rows.value = Number(rows.value) - 1;
  }
};

const addColumn = () => {
  cols.value = Number(cols.value) + 1;
};

const removeColumn = () => {
  if (Number(cols.value) > 1) {
    cols.value = Number(cols.value) - 1;
  }
};

onMounted(() => {
  console.log('테이블 컴포넌트가 마운트되었습니다:', {
    rows: Number(rows.value),
    cols: Number(cols.value)
  });
});
</script>

<style scoped lang="less">
.wysiwyg-table-wrapper {
  margin: 1rem 0;
  width: 100%;
  display: block;
  position: relative;
}

.table-controls {
  margin-bottom: 0.5rem;
  display: flex;
  gap: 0.5rem;

  .control-btn {
    padding: 0.25rem 0.5rem;
    background-color: #f0f0f0;
    border: 1px solid #ccc;
    border-radius: 3px;
    cursor: pointer;
    font-size: 0.8rem;

    &:hover {
      background-color: #e0e0e0;
    }
  }
}

.wysiwyg-table {
  border-collapse: collapse;
  width: 100%;
  table-layout: fixed;

  tr {
    height: 30px;
  }

  td {
    border: 1px solid #000;
    padding: 5px;
    min-width: 50px;
    min-height: 30px;
    background-color: white;
    overflow: hidden;
    word-break: break-word;
    white-space: normal;

    &:focus {
      outline: 2px solid #4a90e2;
    }
  }
}
</style>
