<template lang="pug">
nav#navbar(ref="navbar")
	.navbar-wrap
		ul.menu-item(v-if="menuList.length")
			template(v-for="item in menuList" :key="item.name")
				li.item(v-if="item.show" :class="{'active': activeMenu == item.name}")
					router-link.router(:to="item.to")
						.icon
							svg
								use(:href="getIconPath(item.icon)")
						.text 
							span {{ item.text }}

</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { watch, onMounted, onUnmounted, ref, computed } from 'vue';
import { user } from '@/user.ts';
import MaterialIcon from '@/assets/icon/material-icon.svg';

const router = useRouter();
const route = useRoute();

const props = defineProps({
  menuList: {
    type: Array,
    default: true
  }
});
const menuList = ref(props.menuList);

let navbar = ref(null);
let activeMenu = ref(null);
let isSendingValue = ref(false);

const getIconPath = computed(() => (iconName) => {
  return `${MaterialIcon}${iconName}`;
});

let checkRouteName = (routeName) => {
  if (routeName === 'audit-detail' && isSendingValue.value) {
    activeMenu.value = 'request-list';
    return;
  } else if (routeName === 'audit-detail' && !isSendingValue.value) {
    activeMenu.value = 'audit-list';
    return;
  }

  let childList = menuList.value.filter((item) => item.child);
  let foundChild = childList.find((item) => item.child.some((child) => child === routeName));

  if (foundChild) {
    activeMenu.value = foundChild.name;
    return;
  }

  activeMenu.value = routeName;
};

watch(
  () => props.menuList,
  (nv) => {
    menuList.value = nv;
    checkRouteName(route.name);
  },
  { immediate: true }
);

watch(
  () => route.query,
  (nv) => {
    if (nv.isSending) {
      isSendingValue.value = true;
    } else {
      isSendingValue.value = false;
    }
  },
  { immediate: true }
);

watch(
  () => route.name,
  (nv) => {
    checkRouteName(nv);
  },
  { immediate: true }
);
</script>

<style scoped lang="less">
#navbar {
  width: 4.625rem;
  height: calc(100vh - var(--header-height));
  position: fixed;
  top: var(--header-height);
  left: 0;
  overflow-x: hidden;
  overflow-y: overlay;
  background-color: #fff;
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  z-index: 9998;
  transition: width 0.3s ease-in-out;

  .navbar-wrap {
    overflow: hidden;
    color: var(--gray-color-600);
  }

  &:hover {
    width: 10.8rem;

    .menu-item {
      .item {
        .router {
          .text {
            display: flex;
          }
        }
      }
    }
  }

  .icon {
    padding: 0 8px;
    flex: none;
  }

  .logo {
    height: var(--header-height);
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    margin-bottom: 30px;
    cursor: pointer;
    display: none;

    .img-logo {
      width: 12rem;

      img {
        width: calc(12rem - 16px);
      }

      svg {
        width: 2rem;
        height: 2rem;
      }
    }
  }

  .btn-close {
    display: none;
    position: relative;
    top: 0px;

    .icon {
      padding: 0;
    }
  }

  .menu-item {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.8rem;
    padding: 20px 16px 40px;

    .item {
      display: flex;
      align-items: center;

      &:first-child {
        margin-top: 0;
      }

      &.active {
        .router {
          background-color: var(--primary-color-400);
          color: #fff;

          svg {
            fill: #fff;
          }

          .arrow {
            fill: #fff;
            opacity: 0.7;
          }
        }

        &:hover {
          .router {
            background-color: var(--primary-color-400);
          }
        }
      }

      &:hover {
        .router {
          background-color: var(--primary-color-100);
        }
      }
    }

    .router {
      display: flex;
      flex-wrap: nowrap;
      align-items: center;
      gap: 4px;
      padding: 1rem 0.5rem;
      border-radius: 36px;
      transition: all 0.3s;
      cursor: pointer;
      width: 100%;

      .text {
        padding-right: 12px;
        display: none;
        white-space: nowrap;
        transition: opacity 0.3s ease-in-out;
      }

      .arrow {
        width: max(1.2rem, 16px);
        height: max(1.2rem, 16px);
        fill: #b7b7b7;
        transition: all 0.3s;

        &.down {
          transform: rotate(90deg);
        }
      }
    }
  }

  .sub-menu-item {
    padding-top: 1.5rem;
    padding-left: 3.5rem;

    &.show {
      display: block;
    }

    li {
      margin-bottom: 1rem;

      &.active {
        color: var(--primary-color-400);
        font-weight: bold;
      }

      &:hover {
        color: var(--primary-color-400);
      }
    }

    a {
      display: block;
      padding: 0.4rem 0;
    }
  }
}

.fold {
  #navbar {
    .menu-item {
      .router {
        padding-left: 0;
        padding-right: 0;
      }
    }
  }
  .navbar-wrap {
    .logo {
      justify-content: center !important;

      .img-logo {
        display: none;
      }
    }

    .sub-menu-item {
      display: none !important;
    }
  }
}

@media (max-width: 768px) {
  #navbar {
    position: relative;
    top: unset;
    left: unset;
    width: 100%;
    height: unset;
    border-right: 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);

    &:hover {
      width: 100%;
    }

    .navbar-wrap {
      overflow-x: auto;
    }

    .menu-item {
      padding: 20px;
      flex-direction: row;
      justify-content: flex-start;
      gap: 1.2rem;

      .item {
        &:last-of-type {
          padding-right: 20px;
        }

        .icon {
          svg {
            width: 20px;
            height: 20px;
          }
        }

        .router {
          display: inline-block;
          text-align: center;
          padding: 0;

          .text {
            display: flex;
            white-space: nowrap;
            width: 100%;
            padding: 0;
            font-size: 14px;
            margin-top: 0.5rem;
          }

          svg {
            fill: var(--gray-color-300);
            margin: 0 auto;
            margin-bottom: 4px;
          }
        }

        &.active {
          .router {
            background-color: unset;
            color: var(--primary-color-400);

            svg {
              fill: var(--primary-color-400);
            }
          }

          &:hover {
            .router {
              background-color: unset;
            }
          }
        }

        &:hover {
          .router {
            background-color: unset;

            .text {
              color: var(--primary-color-400);
            }
            svg {
              fill: var(--primary-color-400);
            }
          }
        }
      }
    }
  }
}
</style>
