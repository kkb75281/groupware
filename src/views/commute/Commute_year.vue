<template lang="pug">
//- div(style="display: flex; gap: 1rem")
//- 	h1.title 출퇴근 관리

//- hr

.itembox
	.title-wrap(style="margin-bottom: 0;")
		h3.title 연차 페이지

br

</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted, watch } from 'vue';
import { skapi } from '@/main.ts';
import { user, makeSafe } from '@/user.ts';

const router = useRouter();
const route = useRoute();

</script>

<style scoped lang="less">
.table-wrap {
  position: relative;

  #loading {
    position: absolute;
    top: 126px;
    left: 50%;
    transform: translateX(-50%);
  }

  #searchForm {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .table {
    min-width: 35rem;

    tbody {
      tr {
        &:hover {
          background-color: transparent;
        }
      }
    }
  }
}

.itembox-wrap {
  display: flex;
  gap: 0 24px;
  flex-wrap: wrap;
}

.itembox {
  box-shadow: 1px 1px 10px 0px rgba(0, 0, 0, 0.15);
  border-radius: 16px;
  padding: 1.5rem;
  line-height: 1.2;
  flex: 1;

  .time {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    font-size: 1.25rem;
    font-weight: 600;
    color: #2c3e50;
    border-bottom: 1px solid #ccc;
    padding-bottom: 1.5rem;

    .value {
      flex: 1;
      margin-left: 8px;
    }
  }

  .btn-work {
    width: 100%;
    margin-top: 1.5rem;

    &.disabled {
      background-color: var(--primary-color-200);
      border: 1px solid var(--primary-color-200);
      cursor: default;
    }
  }

  .title-wrap {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 20px;
  }
}

.today {
  font-size: 1rem;
  color: #777;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;

  .icon {
    padding: 0;
  }
}

.remark {
  .btn-wrap {
    flex-wrap: nowrap;

    button {
      width: 1.5rem;
      height: 1.5rem;
      display: flex;
      justify-content: center;
      align-items: center;

      &:hover {
        .icon {
          svg {
            fill: var(--primary-color-400);
          }
        }
      }
    }

    .icon {
      padding: 0;
    }
  }
}

@media (max-width: 768px) {
  .itembox-wrap {
    flex-direction: column;
  }
}
</style>
