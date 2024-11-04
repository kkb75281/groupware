import './assets/main.less'

import { createApp } from 'vue'
import { Skapi } from "skapi-js"
import App from './App.vue'
import router from './router'

const app = createApp(App)

const skapi = new Skapi("ap21T7fhHOcU2HgaCmGr", "5750ee2c-f7f7-43ff-b6a5-cce599d30101", { autoLogin: true }, {"hostDomain": "skapi.app","target_cdn": "d1wrj5ymxrt2ir"});

app.use(router)

app.mount('#app')

export { skapi }
