import './assets/less/main.less';

import { createApp, ref } from 'vue';
import { Skapi } from 'skapi-js';
import App from './App.vue';
import router from './router';

const app = createApp(App);

// const skapi = new Skapi(
//   'ap21T7fhHOcU2HgaCmGr',
//   '5750ee2c-f7f7-43ff-b6a5-cce599d30101',
//   { autoLogin: window.localStorage.getItem('remember') === 'true' },
//   { hostDomain: 'skapi.app', target_cdn: 'd1wrj5ymxrt2ir' }
// ); // pb

const skapi = new Skapi(
  'ap21T837jUF8IFyfR98Z',
  'f498d188-1fa5-43e5-a32d-904d3e125983',
  { autoLogin: false },
  { hostDomain: 'skapi.app', target_cdn: 'd1wrj5ymxrt2ir' }
);

app.use(router);

app.mount('#app');

export { skapi };
