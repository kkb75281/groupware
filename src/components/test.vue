<template lang="pug">
h4 {{ realtimeTestingMsg }}
.test-area
	h3.title Notification Subscribe Test
	button.btn(@click="subscribeNotification") Subscribe
	button.btn(@click="unsubscribeNotification") Unsubscribe
	button.btn(@click="pushNotification(notifications.content, notifications.user_id)") Push Notification
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
</script>

<style scoped lang="less">
.title {
	margin-bottom: 1rem;
}
button {
	margin-bottom: 1rem;
}
</style>