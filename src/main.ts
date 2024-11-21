import './assets/less/main.less';

import { createApp, ref } from 'vue';
import { Skapi } from 'skapi-js';
import { user, profileImage} from './user';
import App from './App.vue';
import router from './router';

const app = createApp(App);

export let iwaslogged = ref(false);
export let loaded = ref(false);

export let loginCheck = async(profile: object | null, router: any) => {
  if (profile) {
    Object.assign(user, profile);
    
    if (user.picture) {
      skapi.getFile(user.picture, {
        dataType: 'endpoint',
      })
      .then((res) => {  
        console.log(res)
        profileImage.value = res;
      })
      .catch((err) => {
        window.alert('프로필 사진을 불러오는데 실패했습니다.');
        throw err; // 의도적으로 에러 전달
      });
    } else {
      profileImage.value = '';
    }
    
    iwaslogged.value = true;
  } else {   
    if(iwaslogged.value) {
      Object.assign(user, {});
      iwaslogged.value = false;
    }
  }
  console.log('profile', profile)
  console.log('iwaslogged', iwaslogged.value)
  loaded.value = true;
};

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
