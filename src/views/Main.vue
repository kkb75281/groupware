<template lang="pug">
#update-window(v-if="isUpdateLoading")
    .update-window-cont
        Loading#loading
        .loading-msg 새로운 버전으로 업데이트 중입니다.#[br]잠시만 기다려 주세요.
Header
main#main
    .wrap(ref="mainWrap" :class="{ loading: mainPageLoading }")
        //- #loading-msg(v-if="isUpdateLoading") 새로운 버전으로 업데이트 중입니다.#[br]잠시만 기다려 주세요.
        Loading#loading(v-if="mainPageLoading") 
        router-view        
#update-modal.modal(v-if="showNewVersionAlert")
    .modal-cont
        .modal-header
            h2.modal-title 업데이트 알림
            //- button.btn-close
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-close")
        .modal-body
            p 새로운 버전이 있습니다. 업데이트 하시겠습니까?
        .modal-footer
            button.btn(@click="applyUpdate" style="width:100%") 확인
            //- button.btn(@click="isUpdateLoading = false") 취소
</template>

<script setup>
import { watch, ref, nextTick, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { mainPageLoading, isUpdateLoading, newVersionAvailable, newVersion, applyUpdate } from '@/main.ts'

import Header from '@/components/header.vue';
import Navbar from '@/components/navbar.vue';
import Loading from '@/components/loading.vue';

const router = useRouter();
const route = useRoute();

const showNewVersionAlert = computed(() => {
    return newVersionAvailable.value && newVersion.value && !isUpdateLoading.value;
});

let mainWrap = ref(null);

watch([mainPageLoading, isUpdateLoading], (nv) => {
    if (nv) {
        nextTick(() => {
            const loadingElement = document.querySelector('#loading');
            // const msgElement = document.querySelector('#loading-msg');
            let scrollLocation = document.documentElement.scrollTop;

            loadingElement.style.setProperty('--loading-top', `${(window.innerHeight - mainWrap.value.getBoundingClientRect().top + scrollLocation - 200) / 2}px`);
            // msgElement.style.setProperty('--loading-top', `${(window.innerHeight - mainWrap.value.getBoundingClientRect().top + scrollLocation - 80) / 2}px`);
        })
    }
}, { immediate: true });
</script>

<style scoped lang="less">
#update-window {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.7);
    z-index: 99999;

    .update-window-cont {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -80%);
        text-align: center;

        .loading-msg {
            line-height: 1.5;
        }
    }
}

#update-modal {
    .modal-cont {
        min-width: unset;
        max-width: unset;
    }

    .modal-title {
        font-size: 1.2rem;
    }

    .modal-body {
        padding: 0 1rem;
        font-size: 0.9rem;
    }
}

#main {
    padding-top: calc(var(--header-height));
    // padding-left: calc(var(--navbar-width));
    transition: padding-left 0.15s linear;

    .wrap {
        // padding: 3rem 2.4rem 0;
        position: relative;
        // padding: 3rem 2.4rem;
        // padding: 1rem;

        &.loading {
            &::after {
                position: absolute;
                content: '';
                width: 100%;
                height: 100%;
                top: 0;
                left: 0;
                background: rgba(255, 255, 255, 0.7);
                z-index: 999;
            }
        }

        #loading-msg {
            position: absolute;
            top: var(--loading-top);
            left: 50%;
            width: 100%;
            transform: translateX(-50%);
            text-align: center;
            line-height: 1.5;
            color: var(--color-primary);
            z-index: 9999;
        }
    }

    #loading {
        position: absolute;
        top: var(--loading-top);
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
    }
}

.fold {
    #navbar {
        width: var(--navbar-fold-width);
    }

    #main {
        // padding-left: calc(var(--navbar-fold-width));

        .wrap {
            padding: 3rem 2.4rem 0;
        }
    }

    #header {
        padding-left: var(--navbar-fold-width);
    }
}

@media (max-width: 1200px) {
    #header {
        padding-left: 2.4rem;
    }

    #navbar {
        left: calc(-1 * var(--navbar-width) - 5rem);
    }

    #main {
        padding-left: 0;
    }
}

@media (max-width: 768px) {
    #header {
        padding: 0 16px;
    }

    #main {
        // padding-left: 0;

        // .wrap {
        // 	padding-left: 16px;
        // 	padding-right: 16px;
        // }
    }

    .fold {
        #header {
            padding: 0 16px;
        }

        #navbar {
            left: calc(-1 * var(--navbar-width) - 5rem);
        }

        #main {
            padding-left: 0;
        }
    }
}
</style>