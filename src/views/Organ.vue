<template lang="pug">
//- .title
//- 	h1 조직도

//- hr

.inner
	.button-wrap(style="display: flex; justify-content: end; align-items: center;")
		button.btn.outline.refresh-icon(:disabled="getOrganigramRunning" @click="getOrganigram(true)")
			svg(:class="{'rotate' : getOrganigramRunning}")
				use(xlink:href="@/assets/icon/material-icon.svg#icon-refresh")
		button.btn.outline(type="button" @click="toggleAllDetails") {{ allDetailsOpen ? '모두 닫기' : '모두 열기' }}

	br

	Organigram(:useCheckbox="false" :excludeCurrentUser="false")
</template>

<script setup>
import { ref } from 'vue';
import { onMounted } from 'vue';
import {
  organigram,
  getOrganigram,
  getOrganigramRunning,
  excludeCurrentUser
} from '@/components/organigram.ts';

import Organigram from '@/components/organigram.vue';

let allDetailsOpen = ref(false);

function toggleAllDetails() {
  allDetailsOpen.value = !allDetailsOpen.value;

  document.querySelectorAll('details').forEach((detail) => {
    if (allDetailsOpen.value) {
      detail.open = true;
    } else {
      detail.open = false;
    }
  });
}

getOrganigram();
</script>

<style lang="less" scoped>
.inner {
    max-width: 1600px;
    margin: 0 auto;
    padding: 2rem;
}

@media (max-width: 768px) {
    .inner {
        padding: 1rem;
    }
}
</style>
