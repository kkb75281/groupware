<template lang="pug">
nav#navbar(ref="navbar")
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
            template(v-for="item in menuList" :key="item.name")
                li.item(v-if="item.show" :class="{'active': activeMenu == item.name}")
                    router-link.router(:to="item.to" @click="toggleSubMenu(item.name)")
                        .icon
                            svg
                                use(:xlink:href="`@/assets/icon/material-icon.svg#icon-${item.icon}`")
                        .text 
                            span {{ item.text }}
                            svg.arrow(v-if="item.child" :class="{'down': item.child.name === activeMenu}")
                                use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")
                    ul.sub-menu-item(v-if="item.child && item.child.name === activeMenu")
                        li(v-for="child in item.child.list" :key="child.name" :class="{'active': route.name === child.name}")
                            router-link(:to="child.to") {{ child.text }}

</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { watch, onMounted, onUnmounted, ref, computed } from 'vue'
import { checkScreenWidth, toggleNavbarFold, isOpen } from '@/components/navbar'
import { user } from '@/user'

const router = useRouter();
const route = useRoute();

let navbar = ref(null);
let isadmin = user.access_group > 98;

let menuList = [
    {
        show: true,
        name: 'home',
        to: '/',
        icon: 'dashboard',
        text: '대시보드',
    },
    {
        show: true,
        name: 'mypage',
        to: '/mypage',
        icon: 'account-circle-fill',
        text: '마이페이지',
        child: {
            name: 'mypage',
            list: [
                {
                    name: 'edit-myinfo',
                    to: '/mypage/edit-myinfo',
                    text: '회원정보 수정',
                },
                {
                    name: 'change-password',
                    to: '/change-password',
                    text: '비밀번호 변경',
                }
            ]
        }
    },
    {
        show: isadmin,
        name: 'admin',
        to: '/admin',
        icon: 'settings',
        text: '마스터 페이지',
        child: {
            name: 'admin',
            list: [
                {
                    name: 'list-divisions',
                    to: '/admin/list-divisions',
                    text: '부서 관리',
                },
                {
                    name: 'list-employee',
                    to: '/list-employee',
                    text: '직원 관리',
                }
            ]
        }
    },
    {
        show: !isadmin,
        name: 'list-employee',
        to: '/list-employee',
        icon: 'groups',
        text: '직원 목록',
    },
    // {
    //     name: 'component',
    //     to: '/component',
    //     icon: 'component',
    //     text: 'component',
    // },
    // {
    //     name: 'mailing',
    //     to: '/mailing',
    //     icon: 'mail',
    //     text: 'mailing',
    // }
];
let adminSubMenu = ref(null);
let showSubMenu = ref(false);
let activeMenu = ref(null);
let parentRouteNames = computed(() => {
    return menuList.map(item => item.name);
});
let closeNavbar = computed(() => {
    let arr = [];
    menuList.forEach(item => {
        if(item.child) {
            arr.push(item.child.list.map(child => child.name));
        } else {
            arr.push(item.name);
        }
    });
    let newArr = new Set(arr.flat());

    return [...newArr];
});

let toggleSubMenu = (menu) => {
  activeMenu.value = activeMenu.value === menu ? null : menu;
};

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

watch(route, (nv) => {
    if(nv) {
        if(closeNavbar.value.includes(nv.name) && isOpen.value) {
            isOpen.value = false;
            document.body.classList.toggle('open', isOpen.value);
        }
    }
})

watch(() => route.fullPath, (nv) => {
    let currentPath = nv.split('/');
    let currentPathName = currentPath[currentPath.length - 1];

    for(let menu of menuList) {
        let menuTo = menu.to.split('/');
        let menuName = menuTo[menuTo.length - 1];

        if(menuName === currentPathName) {
            activeMenu.value = menu.name;
            return;
        }

        if(menu.child) {
            for(let child of menu.child.list) {
                let childTo = child.to.split('/');
                let childName = childTo[childTo.length - 1];

                if(childName === currentPathName) {
                    activeMenu.value = menu.name;
                    return;
                }
            }
        }
    }
},{ immediate: true });
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