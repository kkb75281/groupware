import './assets/less/main.less';

import { createApp, ref } from 'vue';
import { Skapi } from 'skapi-js';
import { user, profileImage } from './user';
import { user, profileImage } from './user';
import App from './App.vue';
import router from './router';

const app = createApp(App);

export let iwaslogged = false;

let loginCheck = (profile: object) => {
  for (let k in user) {
    delete user[k];
  }
  if (profile) {
    iwaslogged = true;

    for (let k in profile) {
      user[k] = profile[k];
    }

    if (user.picture) {
      skapi
        .getFile(user.picture, {
          dataType: 'endpoint',
        })
        .then((res) => {
          profileImage.value = res;
        })
        .catch((err) => {
          window.alert('프로필 사진을 불러오는데 실패했습니다.');
          throw err; // 의도적으로 에러 전달
        });
    } else {
      profileImage.value = '';
    }

    // console.log('loginCheck', profile);
    // return;
  } else {
    if(iwaslogged) {
      router.push({ name: 'login' });
    }
    iwaslogged = false;
    // const routeName = router.currentRoute.value.name;
    // const allowedRoutes = ['forgot', 'mailing'];

    // if (allowedRoutes.includes(routeName)) {
    //   router.push({ name: routeName });
    // } else {
    //   router.push({ name: 'login' });
    // }
  }
}

const skapi = new Skapi(
  'ap21UAo9MdRQtaQ8CmGr',
  '5750ee2c-f7f7-43ff-b6a5-cce599d30101',
  { autoLogin: window.localStorage.getItem('remember') === 'true', eventListener: {onLogin: loginCheck} },
  { hostDomain: 'skapi.app', target_cdn: 'd1wrj5ymxrt2ir' }
); // pb

// const skapi = new Skapi(
//   'ap21T837jUF8IFyfR98Z',
//   'f498d188-1fa5-43e5-a32d-904d3e125983',
//   { autoLogin: false },
//   { hostDomain: 'skapi.app', target_cdn: 'd1wrj5ymxrt2ir' }
// );

app.use(router);

app.mount('#app');

export { skapi };
