<template lang="pug">
Header
Navbar
main#main
	.wrap(ref="mainWrap" :class="{ loading: mainPageLoading }")
		Loading#loading(v-if="mainPageLoading") 
		router-view
</template>

<script setup>
import { onMounted, watch, ref, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { updateEmails } from "@/notifications";
import { mainPageLoading } from '@/main'

import Header from '@/components/header.vue';
import Navbar from '@/components/navbar.vue';
import Loading from '@/components/loading.vue';

const router = useRouter();
const route = useRoute();

let mainWrap = ref(null);
let emailCheckInterval;

onMounted(async () => {
	await updateEmails();
	
	// 30초마다 이메일 업데이트
	emailCheckInterval = setInterval(() => {
		updateEmails();
	}, 10000);
});

watch(mainPageLoading, (nv) => {
	if (nv) {
		nextTick(() => {
			const targetElement = document.querySelector('#loading');
			let scrollLocation = document.documentElement.scrollTop;

			console.log('innerHeight',window.innerHeight);
			console.log('scrollLocation',scrollLocation);

			targetElement.style.setProperty('--loading-top', `${(window.innerHeight - mainWrap.value.getBoundingClientRect().top + scrollLocation - 200) / 2}px`);
		})
	}
}, { immediate: true });
</script>

<style scoped lang="less">
#main {
	padding-top: calc(var(--header-height));
	padding-left: calc(var(--navbar-width));
	transition: padding-left 0.15s linear;

	.wrap {
		// padding: 3rem 2.4rem 0;
		position: relative;
		padding: 3rem 2.4rem;

		&.loading {
			&::after {
				position: absolute;
				content: '';
				width: 100%;
				height: 100%;
				top: 0;
				left: 0;
				background: rgba(255, 255, 255, 0.6);
			}
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
		padding-left: calc(var(--navbar-fold-width));

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
		left: calc(-1 * var(--navbar-width));
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
		padding-left: 0;

		.wrap {
			padding-left: 16px;
			padding-right: 16px;
		}
	}

	.fold {
		#header {
			padding: 0 16px;
		}

		#navbar {
			left: calc(-1 * var(--navbar-width));
		}

		#main {
			padding-left: 0;
		}
	}
}
</style>