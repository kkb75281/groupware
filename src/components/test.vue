<template lang="pug">
h4 {{ realtimeTestingMsg }}

.test-area
	h3.title Notification Subscribe Test
	//- p {{  subsState ? 'Notification is subscribed' : 'Notification is not subscribed' }}

	br

	button.btn(@click="subscribe") Subscribe
	button.btn(@click="unsubscribeNotification") Unsubscribe

	.input-wrap
		input(type="text" v-model="notifications.content.title" placeholder="Title")
		input(type="text" v-model="notifications.content.body" placeholder="Body")
		//- input(type="text" v-model="notifications.user_id" placeholder="User ID")

	.input-wrap
		select(v-model="notifications.user_id")
			option(value="" selected disabled) 유저선택
			option(value="9b9a927f-7de0-4f37-932e-2009bed90e28") 권구글(구글)
			option(value="43f04f10-8b33-40ee-8bfc-1c54d8711ad5") 오구글(구글)
			option(value="c11c0501-156e-4027-bb2f-97a6758033a6") 김박사(구글)

	br

	button.btn(@click="pushNotification(notifications.content, notifications.user_id)") Push notifications
	button.btn(@click="postRealTimeMsg") Post Realtime Msg

</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { subscribeNotification, unsubscribeNotification, pushNotification } from "@/notifications";
import { skapi, realtimeTestingMsg } from "@/main";
import { user } from "@/user";

let subsState = ref(false);
let pushNotificationBody = {
	text: '테스트 Notification',
	type: 'test',
}
let notifications = {
	content: {
		title: "알림",
		// body: JSON.stringify(pushNotificationBody),
		body: "테스트 Notification",
	},
	user_id: "",
}

console.log({user});

function subscribe () {
	subscribeNotification();
	subsState.value = true;
}

let postRealtimeBody = {
	text: '테스트 Realtime',
	type: 'test',
}

// 마지막 매개변수 리얼타임 못받을 경우 꼭 노티피케이션 받아야 하면 추가
function postRealTimeMsg () {
	// 실시간 알림 보내기
	skapi.postRealtime(
		'postRealTimeMsgTest',
		notifications.user_id,
		{
			title: '알림',
			// body: JSON.stringify(postRealtimeBody),
			body: '테스트 Realtime',
		}
	).then((res) => {
		console.log('postRealTimeMsg', res);
	});
}

onMounted(async() => {
	// let subs = window.localStorage.getItem('skapi_subscription_obj');
	// if (subs) {
	// 	subsState.value = true;
	// }
	// let pms = await Notification.requestPermission();
	// pms ? notiState.value = true : notiState.value = false;
})
</script>

<style scoped lang="less">
.title {
	margin-bottom: 1rem;
}
button {
	margin-bottom: 1rem;
}
</style>