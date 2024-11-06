import './assets/less/main.less';

import { createApp, ref } from 'vue';
import { Skapi } from 'skapi-js';
import App from './App.vue';
import router from './router';

const loginState = ref(false);
const app = createApp(App);
const skapi = new Skapi(
  'ap21T837jUF8IFyfR98Z',
  'f498d188-1fa5-43e5-a32d-904d3e125983',
  { autoLogin: true },
  { hostDomain: 'skapi.app', target_cdn: 'd1wrj5ymxrt2ir' }
);

skapi.login({
  email: 'admin@email.com',
  password: '123123'
}).then(user => {
  if(user) {
    loginState.value = true;
  }
}).catch(err => {
  loginState.value = false;
  throw(err.message);
});

app.use(router);

app.mount('#app');

export { skapi, loginState };
