<template lang="pug">
h4 {{ realtimeTestingMsg }}
h4(style="margin-bottom: 1rem;") {{buildTime}}

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
			template(v-for="emp in emps")
				option(:value="emp.user_id") {{ emp.name }}
			//- option(value="" selected disabled) 유저선택
			//- option(value="efac1396-00ec-43c3-829d-c17ab2d3c534") 권구글(구글)
			//- option(value="8592d676-9463-4391-9a7a-9a177736b2b9") 오구글(구글)
			//- option(value="81e6cd7f-1363-4ea9-a919-ff0051ed32f9") 김박사(구글)

	br

	button.btn(@click="pushNotification(notifications.content, notifications.user_id)") Push notifications
	button.btn(@click="postRealTimeMsg") Post Realtime Msg

	br

	h3.title WYSIWYG Editor Test

	#WYSIWYG(style="border: 1px solid #000;")

	button.btn(@click="tablePlugin(3, 3)") Table Plugin
</template>

<script setup>
import { createApp } from 'vue';
import { onMounted, ref } from "vue";
import { subscribeNotification, unsubscribeNotification, pushNotification } from "@/notifications";
import { skapi, realtimeTestingMsg, buildTime } from "@/main.ts";
import { user } from "@/user.ts";
import { getUsers } from "@/employee.ts";
import { Wysiwyg4All } from 'wysiwyg4all';
import 'wysiwyg4all/css';
import wysiwygTable from '@/components/wysiwygTable.vue';

let emps = ref([]);
let subsState = ref(false);
let pushNotificationBody = {
    text: '테스트 Notification',
    type: 'test',
}
let notifications = {
    content: {
        title: "알림",
        // body: JSON.stringify(pushNotificationBody),
        body: "test notification abcdefghijklmnopqrstuvwxyz",
    },
    user_id: "",
}

getUsers({
    searchFor: 'approved',
    value: 'by_skapi:approved',
    condition: '>='
}, true).then((res) => {
    // console.log('getUsers', res);
    emps.value = res;
});

// console.log({user});

function subscribe() {
    subscribeNotification();
    subsState.value = true;
}

let postRealtimeBody = {
    text: '테스트 Realtime',
    type: 'test',
}

// 마지막 매개변수 리얼타임 못받을 경우 꼭 노티피케이션 받아야 하면 추가
function postRealTimeMsg() {
    // 실시간 알림 보내기
    skapi.postRealtime(
        'postRealTimeMsgTest',
        notifications.user_id,
        {
            config: {
                always: true, // 무조건 알림 받기
            },
            title: '알림',
            // body: JSON.stringify(postRealtimeBody),
            body: '테스트 Realtime',
        }
    ).then((res) => {
        // console.log('postRealTimeMsg', res);
    });
}


// Function to dynamically load the component
function loadWysiwygTable(col, row) {
    // Create a container element
    const container = document.createElement('div');
    // container.id = 'wysiwyg-table-container';

    // Create and mount the Vue component with props
    const app = createApp(wysiwygTable, { col, row });
    app.mount(container);
    console.log({ app, container })
    return container;
}

let wysiwyg = null;
onMounted(async () => {
    // let subs = window.localStorage.getItem('skapi_subscription_obj');
    // if (subs) {
    // 	subsState.value = true;
    // }
    // let pms = await Notification.requestPermission();
    // pms ? notiState.value = true : notiState.value = false;

    console.log({ Wysiwyg4All })


    wysiwyg = new Wysiwyg4All({
        //set ID of target <DIV>.
        elementId: 'WYSIWYG',

        // Add placeholder string.
        placeholder: 'Build your custom wysiwyg',

        // Set spellcheck to true/false.
        spellcheck: false,

        // Set color scheme of wysiwyg (HTML color name | hex | rgb | hsl).
        highlightColor: 'teal',

        // When set to true, blank line will always be added on the last line of text area.
        lastLineBlank: false,

        // When set to true, wysiwyg will auto detect hashtag strings.
        hashtag: true,

        // When set to true, wysiwyg will auto detect url strings
        urllink: true,

        // When set to true, wysiwyg will output DOM mutation data via callback function.
        logMutation: false
    })
})
let tablePlugin = (col, row) => {
    wysiwyg.command({
        element: loadWysiwygTable(col, row),
        contenteditable: true
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