<template lang="pug">
.wysiwyg-table-wrapper
    .table-controls
        button.control-btn(type="button" @click="addRow") 행 추가
        button.control-btn(type="button" @click="removeRow") 행 삭제
        button.control-btn(type="button" @click="addColumn") 열 추가
        button.control-btn(type="button" @click="removeColumn") 열 삭제
        
    table.wysiwyg-table(ref="wysiwygTable")
        tbody
            tr(v-for="rowIndex in rows" :key="`row-${rowIndex}`")
                td(v-for="colIndex in cols" :key="`${rowIndex}-${colIndex}`" contenteditable="true") 
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
// import { currentTable, createTable, loadWysiwygTable } from '@/components/wysiwygTable';

const props = defineProps({
    col: {
        type: Number,
        default: 3 // 기본값 설정
    },
    row: {
        type: Number,
        default: 3 // 기본값 설정
    }
});

const wysiwygTable = ref(null);

// 명시적으로 숫자형 변환하여 반응형 변수 초기화
const rows = ref(props.row);
const cols = ref(props.col);

console.log('스크립트 시작:', { props, rows, cols }); // 스크립트 시작 시점 확인

// props 변경 시 반응형 변수 업데이트
// watch(() => props.row, (newVal) => {
//     rows.value = newVal;
// }, { immediate: true });

// watch(() => props.col, (newVal) => {
//     cols.value = newVal;
// }, { immediate: true });

const addRow = () => {
    if (!wysiwygTable.value) return;

    rows.value++;
    console.log(rows.value, cols.value);
};

const removeRow = () => {
    if (!wysiwygTable.value) return;

    if (rows.value > 1) {
        rows.value--;
    }
    console.log(rows.value, cols.value);
};

const addColumn = () => {
    if (!wysiwygTable.value) return;

    cols.value++;
    console.log(rows.value, cols.value);
};

const removeColumn = () => {
    if (!wysiwygTable.value) return;

    if (cols.value > 1) {
        cols.value--;
    }
    console.log(rows.value, cols.value);
};

onMounted(() => {
    console.log(cols.value, rows.value);

    if (!wysiwygTable.value) {
        console.error('테이블 참조가 올바르지 않습니다.');
        return;
    }

    // if (rows.value <= 0 || cols.value <= 0) {
    //     console.error('유효하지 않은 rows 또는 cols 값:', rows.value, cols.value);
    //     rows.value = 1;
    //     cols.value = 1;
    // }

    console.log('테이블 컴포넌트가 마운트되었습니다:', {
        rows: rows.value,
        cols: cols.value
    });
});

// defineExpose({
//   addRow,
//   removeRow,
//   addColumn,
//   removeColumn
// });
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
