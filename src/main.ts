import './assets/less/main.less';

import { createApp, ref } from 'vue';
import { Skapi } from 'skapi-js';
import App from './App.vue';
import router from './router';

// const loginState = ref(false);
const app = createApp(App);
const skapi = new Skapi(
  'ap21T7fhHOcU2HgaCmGr',
  '5750ee2c-f7f7-43ff-b6a5-cce599d30101',
  { autoLogin: false },
  { hostDomain: 'skapi.app', target_cdn: 'd1wrj5ymxrt2ir' }
);

await skapi.__connection;

app.use(router);

app.mount('#app');

export { skapi, loginState };
