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

watch(
  () => props.menuList,
  (nv) => {
    menuList.value = nv;
  },
  { immediate: true }
);

let navbar = ref(null);
let activeMenu = ref(null);
let isSendingValue = ref(false);
const isadmin = computed(() => user.access_group > 98);

const getIconPath = computed(() => (iconName) => {
  return `${MaterialIcon}${iconName}`;
});

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
    // console.log('activeMenu : ', activeMenu.value);

    // if (nv === 'list-employee') {
    // 	if (isadmin.value) {
    // 		activeMenu.value = 'admin';
    // 		return;
    // 	} else {
    // 		activeMenu.value = 'list-employee';
    // 		return;
    // 	}
    // }

    if (nv === 'audit-detail' && isSendingValue.value) {
      activeMenu.value = 'request-list';
      return;
    } else if (nv === 'audit-detail' && !isSendingValue.value) {
      activeMenu.value = 'audit-list';
      return;
    }

    // childList 중에 현재 route.name이 포함되어 있는지 확인
    let childList = menuList.value.filter((item) => item.child);
    let foundChild = childList.find((item) => item.child.some((child) => child === nv));

    if (foundChild) {
      activeMenu.value = foundChild.name;
      return;
    }

    // if (nv === 'detail-employee') {
    // 	if (isadmin.value) {
    // 		activeMenu.value = 'admin';
    // 		return;
    // 	} else {
    // 		activeMenu.value = 'list-employee';
    // 		return;
    // 	}
    // }

    activeMenu.value = nv;

    // if (nv === 'audit-detail' || nv === 'audit-detail-reference' || nv === 'audit-detail-favorite') {
    // 	activeMenu.value = 'approval';
    // 	return;
    // }

    // if (nv === 'newsletter-detail') {
    // 	activeMenu.value = 'newsletter';
    // 	return;
    // }

    // let foundChild = childList.find((item) => item.child.list.some((child) => child.name === nv));

    // // 현재 route.name이 childList에 포함되어 있으면 activeMenu를 해당 menu의 name으로 설정
    // if (foundChild) {
    // 	activeMenu.value = foundChild.name;
    // 	return;
    // } else {
    // 	activeMenu.value = nv;
    // }
  },
  { immediate: true }
);
</script>

<style scoped lang="less">
#navbar {
  // width: var(--navbar-width);
  // height: 100vh;
  height: calc(100vh - var(--header-height));
  position: fixed;
  top: var(--header-height);
  left: 0;
  // margin-top: var(--header-height);
  overflow-y: overlay;
  background-color: #fff;
  // box-shadow: 5px 1px 20px rgba(0, 0, 0, 0.2);
  border-right: 1px solid rgba(0, 0, 0, 0.1);

  z-index: 9999;
  // transition: width 0.15s linear;
  // transition: left 0.15s linear;
  transition: all 0.3s;

  .navbar-wrap {
    overflow: hidden;
    color: var(--gray-color-600);
  }

  &:hover {
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
  }

  .logo {
    height: var(--header-height);
    // box-shadow: 1px 1px 10px rgba(0,0,0,0.03);
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: space-between;
    // padding: 1rem 20px 0;
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
      // margin-top: 0.8rem;

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
      justify-content: center;
      // padding: 1.2rem 1.25rem 1.2rem 0.75rem;
      // padding: 1.2rem 0.875rem 1.2rem 0.25rem;
      padding: 1rem 0.5rem;
      border-radius: 36px;
      transition: all 0.3s;
      cursor: pointer;

      .text {
        flex-grow: 1;
        display: flex;
        align-items: center;
        // justify-content: space-between;
        justify-content: center;
        padding-right: 12px;
        display: none;
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

    .menu-item {
      .router {
        .text {
          // display: none !important;
        }
      }
    }

    .sub-menu-item {
      display: none !important;
    }
  }
}

// @media (max-width: 1200px) {
// 	#navbar {
// 		.btn-close {
// 			display: block;
// 		}

// 		.menu-item {
// 			.router {
// 				// padding: 1.2rem 1.25rem 1.2rem 0.75rem;
// 			}
// 		}
// 	}

// 	.open {
// 		#navbar {
// 			left: 0;
// 			width: 100% !important;
// 		}
// 	}
// }

@media (max-width: 768px) {
  #navbar {
    position: relative;
    top: unset;
    left: unset;
    width: 100%;
    height: unset;
    border-right: 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);

    .navbar-wrap {
      overflow-x: auto;
    }

    .menu-item {
      padding: 20px;
      // display: block;
      flex-direction: row;
      justify-content: flex-start;
      gap: 1.2rem;

      .item {
        .icon {
          svg {
            width: 20px;
            height: 20px;
          }
        }

        .router {
          display: inline-block;
          text-align: center;

          // flex-wrap: wrap;
          // gap: 4px;
          padding: 0;

          .text {
            display: flex;
            white-space: nowrap;
            width: 100%;
            padding: 0;
            font-size: 14px;
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

      // .router {
      // 	&:hover {
      // 		.text {
      // 			display: block !important;
      // 		}
      // 	}
      // }
    }
  }
  // #navbar {
  // 	// display: none;
  // 	top: 0;
  // 	left: 110%;
  // 	width: 100%;

  // 	.logo {
  // 		display: flex;
  // 	}
  // }
  // .open {
  // 	#navbar {
  // 		display: block;
  // 		width: 100% !important;
  // 		top: 0;
  // 		border-right: 0;
  // 		// transform: translateX(-100vw) !important;
  // 		left: 0;

  // 		.btn-close {
  // 			display: block;
  // 		}
  // 		.menu-item {
  // 			.item {
  // 				.router {
  // 					.text {
  // 						display: flex;
  // 					}
  // 				}
  // 			}
  // 		}
  // 	}
  // }
}

// @media (hover: none) {
// 	#navbar .menu-item .item:hover .router {
// 		background-color: transparent !important;
// 	}

// 	#navbar .menu-item .item.active:hover .router {
// 		background-color: var(--primary-color-400) !important;
// 	}
// }
</style>
