<template lang="pug">
.title
	h1 공지사항

hr

.table-wrap
	.tb-head-wrap
	.tb-overflow
		table.table#newsletter_list
			colgroup
				col(style="width: 5%")
				col(style="width: 50%")
				col(style="width: 10%")
				col(style="width: 10%")
			thead
				tr
					th NO
					th 제목
					th 작성자
					th 작성일
			tbody
				template(v-if="loading")
					tr.loading
						td(colspan="10")
							Loading#loading
				template(v-else-if="!newsletters || newsletters.length === 0")
					tr
						td(colspan="4") 등록된 공지사항이 없습니다.
</template>

<script lang="ts" setup>
// import { newsletters } from '@/'
import Loading from '../components/loading.vue';
</script>

<style lang="less" scoped>

</style>