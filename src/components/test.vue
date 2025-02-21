<template lang="pug">
h4 {{ realtimeTestingMsg }}

.test-area
	h3.title Notification Subscribe Test
	button.btn(@click="subscribeNotification") Subscribe
	button.btn(@click="unsubscribeNotification") Unsubscribe

	.input-wrap
		input(type="text" v-model="notifications.content.title" placeholder="Title")
		input(type="text" v-model="notifications.content.body" placeholder="Body")
		input(type="text" v-model="notifications.user_id" placeholder="User ID")
		button.btn(@click="pushNotification(notifications.content, notifications.user_id)") Push notifications
		button.btn(@click="postRealTimeMsg") Post Realtime Msg

</template>

<script setup lang="ts">
import { subscribeNotification, unsubscribeNotification, pushNotification } from "@/notifications";
import { skapi, realtimeTestingMsg } from "@/main";
import { user } from "@/user";

let notifications = {
	content: {
		title: "Test Title",
		body: "Test Body",
	},
	user_id: user.user_id,
}

console.log({user});

// 마지막 매개변수 리얼타임 못받을 경우 꼭 노티피케이션 받아야 하면 추가
function postRealTimeMsg () {
	// 실시간 알림 보내기
	skapi.postRealtime(
		'postRealTimeMsgTest',
		notifications.user_id,
		{
			title: '알림',
			body: `결재 요청이 도착했습니다.`
		}
	).then((res) => {
		console.log('postRealTimeMsg', res);
	});
}
</script>

<style scoped lang="less">
.title {
	margin-bottom: 1rem;
}
button {
	margin-bottom: 1rem;
}
</style>