<template lang="pug">
nav#navbar(ref="navbar" @click.stop)
    .navbar-wrap
        .logo
            router-link.img-logo(to="/") 로고 부분
            button.btn-menu(@click="toggleNavbarFold")
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-menu")
            button.btn-close(@click="toggleNavbarFold")
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-close")

        ul.menu-item
            li.item(:class="{'active': route.name === 'home'}")
                router-link.router(to="/")
                    .icon
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-dashboard")
                    .text 
                        span 대시보드

            li.item(:class="{'active': route.path.startsWith('/mypage')}")
                router-link.router(to="/mypage" @click="toggleSubMenu('mypage')") 
                    .icon
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-account-circle-fill")
                    .text 
                        span 마이페이지
                        svg.arrow(:class="{'down': activeMenu === 'mypage'}")
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")
                ul.sub-menu-item(v-if="activeMenu === 'mypage'")
                    li(:class="{'active': route.name === 'edit-myinfo'}")
                        router-link(to="/mypage/edit-myinfo") 회원정보 수정
                    li(:class="{'active': route.name === 'change-password'}")
                        router-link(to="/change-password") 비밀번호 변경

            //- li.item(:class="{'active': route.name === 'list-data'}")
                router-link.router(to="/list-data")
                    .icon
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-account-circle-fill")
                    .text 
                        span 자료 (임시)

            template(v-if="user.access_group > 98")
                li.item(:class="{'active': route.path.startsWith('/admin')}")
                    router-link.router(to="/admin" @click="toggleSubMenu('admin')") 
                        .icon
                            svg
                                use(xlink:href="@/assets/icon/material-icon.svg#icon-settings")
                        .text 
                            span 마스터 페이지
                            svg.arrow(:class="{'down': activeMenu === 'admin'}")
                                use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")
                    ul.sub-menu-item(v-if="activeMenu === 'admin'")
                        li(:class="{'active': route.name === 'list-divisions'}")
                            router-link(to="/admin/list-divisions") 부서 관리
                        li(:class="{'active': route.name === 'list-employee' || route.name === 'employee-data'}")
                            router-link(to="/admin/list-employee") 직원 관리
                ul.sub-menu-item(v-if="activeMenu === 'admin'")
                    li(:class="{'active': route.name === 'list-divisions'}")
                        router-link(to="/admin/list-divisions") 부서 관리
                    li(:class="{'active': route.name === 'list-employee' || route.name === 'employee-data'}")
                        router-link(to="/list-employee") 직원 관리
            template(v-else)
                li.item(:class="{'active': route.name === 'list-employee'}")
                    router-link.router(to="/list-employee")
                        .icon
                            svg
                                use(xlink:href="@/assets/icon/material-icon.svg#icon-groups")
                        .text 
                            span 직원 목록

            //- li.item(:class="{'active': route.name === 'component'}")
                router-link.router(to="/component") 
                    .icon
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-component")
                    .text
                        span component
            //- li.item(:class="{'active': route.name === 'mailing'}")
                router-link(to="/mailing") 
                    .icon
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-mail")
                    .text
                        span mailing

</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { watch, onMounted, onUnmounted, ref } from 'vue'
import { checkScreenWidth, toggleNavbarFold, isOpen } from '@/components/navbar'
import { user } from '@/user'

const router = useRouter();
const route = useRoute();

let navbar = ref(null);
let adminSubMenu = ref(null);
let showSubMenu = ref(false);
let isadmin = user.access_group > 98;
let activeMenu = ref(null);

let toggleSubMenu = (menu) => {
  activeMenu.value = activeMenu.value === menu ? null : menu;
};   

watch(() => route.path, (newPath) => {
  if (!newPath.startsWith('/mypage')) {
    if (activeMenu.value === 'mypage') activeMenu.value = null;
  }
  if (!newPath.startsWith('/admin')) {
    if (activeMenu.value === 'admin') activeMenu.value = null;
  }
});

let checkNavbarClose = (e) => {
    if (window.innerWidth > 768 || window.innerWidth <= 1200) {
        if(isOpen.value && !navbar.value.contains(e.target)) {
            isOpen.value = !isOpen.value;
            document.body.classList.toggle('open', isOpen.value);
        }
    }
}

onMounted(() => {
  checkScreenWidth(); // 컴포넌트가 마운트될 때 한 번 실행
  window.addEventListener('resize', checkScreenWidth); // 리사이즈 이벤트 등록
  window.addEventListener('click', checkNavbarClose);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenWidth); // 컴포넌트가 언마운트될 때 이벤트 해제
  window.removeEventListener('click', checkNavbarClose);
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
    background-color: #fff;
    box-shadow: 5px 1px 30px rgba(0,0,0,0.05);
    z-index: 9999;
    // transition: width 0.15s linear;
    transition: left 0.15s linear;

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
        margin-bottom: 30px;
    }

    .btn-close {
        display: none;
    }

    .menu-item {
        padding: 20px 20px 0;

        .item {
            margin-top: 0.8rem;

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
            padding: 1.2rem 0;
            border-radius: 8px;
            cursor: pointer;

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
        padding-top: 1.5rem;
        padding-left: 3rem;

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
                    display: none !important;
                }
            }
        }

        .sub-menu-item {
            display: none !important;
        }
    }
}

@media (max-width: 1200px)  {
    .open {
        #navbar {
            left: 0;
        }
    }
}

@media (max-width: 768px) {
    .open {
        #navbar {
            width: 100% !important;

            .btn-menu {
                display: none;
            }
            
            .btn-close {
                display: block;
            }
        }
    }
}
</style>