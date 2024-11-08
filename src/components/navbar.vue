<template lang="pug">
nav#navbar
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
                router-link(to="/")
                    .icon
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-dashboard")
                    .text 
                        span 대시보드
            template(v-if="user.access_group > 97")
                li.item(:class="{'active': route.path.startsWith('/admin')}")
                    router-link(to="/admin/list-divisions")
                        .icon
                            svg
                                use(xlink:href="@/assets/icon/material-icon.svg#icon-manage-accounts")
                        .text 
                            span 관리자 페이지
                            svg.arrow(:class="{'down': route.path.startsWith('/admin')}")
                                use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")
                ul.sub-menu-item(:class="{'show': route.path.startsWith('/admin')}")
                    li(:class="{'active': route.name === 'list-divisions'}")
                        router-link(to="/admin/list-divisions") 부서(회사) 목록
                    //- li(:class="{'active': route.name === 'edit-divisions'}")
                        router-link(to="/admin/edit-divisions") 부서(회사) 수정
                    li(:class="{'active': route.name === 'add-divisions'}")
                        router-link(to="/admin/add-divisions") 부서(회사) 등록
                    li(:class="{'active': route.name === 'add-employee'}")
                        router-link(to="/admin/add-employee") 직원 등록
            li.item(:class="{'active': route.name === 'component'}")
                router-link(to="/component") 
                    .icon
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-component")
                    .text
                        span component
            li.item(:class="{'active': route.name === 'mailing'}")
                router-link(to="/mailing") 
                    .icon
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-mail")
                    .text
                        span mailing

</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted, onUnmounted } from 'vue'
import { checkScreenWidth, toggleNavbarFold } from '@/components/navbar'
import { user } from '@/user'

const router = useRouter();
const route = useRoute();

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
        // padding: 0 20px;
        padding: 20px 20px 0;

        .item {
            margin-top: 0.8rem;

            &:first-child {
                margin-top: 0;
            }

            &.active {
                a {
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
                    a {
                        background-color: var(--primary-color-400);
                    }
                }
            }

            &:hover {
                a {
                    background-color: var(--primary-color-100);
                }
            }
        }

        a {
            display: flex;
            flex-wrap: nowrap;
            align-items: center;
            justify-content: center;
            padding: 1.2rem 0;
            border-radius: 8px;

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
            margin-bottom: 1rem;

            &.active {
                color: var(--primary-color-400);
                font-weight: bold;
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