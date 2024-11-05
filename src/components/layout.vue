<template lang="pug">
Header
Navbar
Main
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import Header from '@/components/header.vue';
import Navbar from '@/components/navbar.vue';
import Main from '@/views/Main.vue';

const router = useRouter();
const route = useRoute();
</script>

<style scoped lang="less">
.fold {
    #navbar {
      width: var(--navbar-fold-width);
    }

    #main {
      padding-left: var(--navbar-fold-width);
    }

    #header {
      padding-left: var(--navbar-fold-width);
    }
}

@media (max-width: 1200px) {
	#header {
		padding: 0 1.5rem;
	}

	#navbar {
		width: 0;
	}

	#main {
		padding-left: 0;
	}

	.fold {
		#header {
			padding: 0 1.5rem;
		}

		#navbar {
			width: 0;
		}

		#main {
			padding-left: 0;
		}
	}
}
@media (max-width: 768px) {
	#header {
		padding: 0 1rem;
	}
}
</style>