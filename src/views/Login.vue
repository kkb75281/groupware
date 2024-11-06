<template lang="pug">
#login
	router-link(to="/")
        //- img(src="@/assets/img/logo/symbol-logo.png")

	form(@submit.prevent="")
		.input-wrap
			p.label.essential Email
			input(type="email" placeholder="your@email.com")
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import Component from '@/components/component.vue';

const router = useRouter();
const route = useRoute();
</script>

<style scoped lang="less">

</style>