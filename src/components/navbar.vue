<template lang="pug">
//- nav#navbar
//-     ul
//-         li.prof
//-             router-link(to="/profile")
//-         li.menu
//-             router-link(to="/") Home
//-         li.menu
//-             router-link(to="/admin") Admin
nav#navbar
    .navbar-wrap
        .logo
            img.img-logo(src="@/assets/img/logo-white.svg" alt="img-logo")
            button.btn-menu(@click="toggleNavbarFold")
                i.icon-menu
            button.btn-close(@click="!toggleNavbarFold")
                i.icon-close

        ul.menu-item
            li
                a.item
                    i.icon
                    span.text Admin
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
    background-color: rgb(193, 225, 193);
    z-index: 100;
    transition: width 0.15s linear;

    .navbar-wrap {
        overflow: hidden;
        color: var(--gray-color-600);
    }

    .btn-close {
        display: none;
    }
}

.fold {
    .nav-bar-wrap {
        .logo-cont {
            justify-content: center;

            .logo {
                display: none;
            }
        }

        .link-items {
            li {
                .item {
                    span {
                        opacity: 0;
                    }

                    &.active {
                        background-image: none;
                        background-color: var(--primary-color-400);
                    }
                }

                .sub-nav {
                    display: none;
                }
            }
        }
    }
}
</style>