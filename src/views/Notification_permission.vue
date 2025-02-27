<template lang="pug">
.notiPermission
	.notiPermission-cont
		h2.title 알림 허용
		hr(style="margin-bottom: 1.5rem")
		p.desc 
			| 그룹웨어의 원활한 이용을 위해 알림을 허용해주세요.
			br
			| 알림 허용을 하시면 새로운 공지사항이나 메일이 도착할 때 알림을 받을 수 있습니다.
		button.btn(@click="subscribeNotification") Subscribe
</template>
<script setup>
import { subscribeNotification } from "@/notifications";
</script>
<style scoped lang="less">
.notiPermission {
	margin: 10% 16px 0;
}
</style>