<template lang="pug">
nav#navbar
    .navbar-wrap
        .logo
            //- img.img-logo(src="@/assets/img/img_logo_white.svg" alt="img-logo" style="max-width: 150px; filter: brightness(0.3);")
            router-link.img-logo(to="/") 로고 부분
            button.btn-menu(@click="toggleNavbarFold")
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-menu")
            button.btn-close(@click="!toggleNavbarFold")
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-close")

        ul.menu-item
            li.item(:class="{'active': route.name === 'home'}")
                router-link(to="/")
                    .icon
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-dashboard")
                    .text 
                        span 대시보드
            li.item(:class="{'active': route.path.startsWith('/admin')}")
                router-link(to="/admin/list")
                    .icon
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-manage-accounts")
                    .text 
                        span 관리자 페이지
                        svg.arrow(:class="{'down': route.path.startsWith('/admin')}")
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")
            ul.sub-menu-item(:class="{'show': route.path.startsWith('/admin')}")
                li(:class="{'active': route.name === 'list'}")
                    router-link(to="/admin/list") 부서(회사) 목록
                li(:class="{'active': route.name === 'company'}")
                    router-link(to="/admin/company") 부서(회사) 등록
                li(:class="{'active': route.name === 'member'}")
                    router-link(to="/admin/member") 직원 등록
            li.item(:class="{'active': route.name === 'component'}")
                router-link(to="/component") 
                    .icon
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-component")
                    .text
                        span component

</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted, onUnmounted } from 'vue'

const router = useRouter();
const route = useRoute();

const isFolded = ref(false); // 메뉴 접힘 상태
const isOpen = ref(false);   // 메뉴 열림 상태

function toggleNavbarFold() {
  isFolded.value = !isFolded.value;
  document.body.classList.toggle('fold', isFolded.value);
}

function toggleOpen() {
  isOpen.value = !isOpen.value
  document.body.classList.toggle('open', isOpen.value)
}

function checkScreenWidth() {
  if (window.innerWidth <= 1200) {
    document.body.classList.remove('fold', isFolded.value);
  }
}

onMounted(() => {
  checkScreenWidth(); // 컴포넌트가 마운트될 때 한 번 실행
  window.addEventListener('resize', checkScreenWidth); // 리사이즈 이벤트 등록
});

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenWidth); // 컴포넌트가 언마운트될 때 이벤트 해제
});
</script>

<style scoped lang="less">
#navbar {
    width: var(--navbar-width);
    height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
    overflow-y: overlay;
    // background-color: rgb(193, 225, 193);
    box-shadow: 5px 1px 30px rgba(0,0,0,0.05);
    z-index: 9999;
    transition: width 0.15s linear;

    .navbar-wrap {
        overflow: hidden;
        color: var(--gray-color-600);
    }

    .logo {
        height: var(--header-height);
        // box-shadow: 1px 1px 10px rgba(0,0,0,0.03);
        display: flex;
        flex-wrap: nowrap;
        align-items: center;
        justify-content: space-between;
        padding: 0 20px;
    }

    .btn-close {
        display: none;
    }

    .menu-item {
        // padding: 0 20px;
        padding: 20px 20px 0;

        .item {
            padding: 1.2rem 0;
            border-radius: 8px;

            &.active {
                background: linear-gradient(90.25deg, var(--primary-color-400) 5%, var(--primary-color-300) 98%);

                a {
                    color: #fff;

                    svg {
                        fill: #fff;
                    }
                    .arrow {
                        fill: #fff;
                        opacity: 0.7;
                    }
                }
            }
        }

        a {
            display: flex;
            flex-wrap: nowrap;
            align-items: center;
            justify-content: center;

            .text {
                display: block;
                padding-right: 1rem;
                flex-grow: 1;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            .arrow {
                width: max(1.2rem, 16px);
                height: max(1.2rem, 16px);
                fill: #b7b7b7;
                transition: all .3s;

                &.down {
                    transform: rotate(90deg);
                }
            }
        }
    }

    .sub-menu-item {
        display: none;
        padding-top: 1.5rem;
        padding-left: 3rem;

        &.show {
            display: block;
        }

        li {
            margin-bottom: 1.2rem;

            &.active {
                color: var(--primary-color-400);
                font-weight: bold;
            }
        }

        a {
            display: block;
        }
    }
}

// .fold {
//     .nav-bar-wrap {
//         .logo-cont {
//             justify-content: center;

//             .logo {
//                 display: none;
//             }
//         }

//         .link-items {
//             li {
//                 .item {
//                     span {
//                         opacity: 0;
//                     }

//                     &.active {
//                         background-image: none;
//                         background-color: var(--primary-color-400);
//                     }
//                 }

//                 .sub-nav {
//                     display: none;
//                 }
//             }
//         }
//     }
// }

.fold {
    .navbar-wrap {
        .logo {
            justify-content: center !important;

            .img-logo {
                display: none;
            }
        }

        .menu-item {
            a {
                .text {
                    display: none !important;
                }
            }
        }

        .sub-menu-item {
            display: none !important;
        }
    }
}
</style>