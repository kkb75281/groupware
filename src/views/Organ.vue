<template lang="pug">
.title
	h1 조직도

hr

.button-wrap(style="display: flex; justify-content: end; align-items: center;")
	button.btn.outline(type="button" @click="toggleAllDetails") {{ allDetailsOpen ? '모두 닫기' : '모두 열기' }}

br

Organigram(:useCheckbox="false")
</template>

<script lang="ts" setup>
import { ref } from 'vue';

import Organigram from '@/components/organigram.vue';

let allDetailsOpen = ref(false);

function toggleAllDetails() {
	allDetailsOpen.value = !allDetailsOpen.value;

	document.querySelectorAll('details').forEach(detail => {
		if(allDetailsOpen.value) {
			detail.open = true;
		} else {
			detail.open = false;
		}
	});
}
</script>

<style lang="less" scoped>

</style>