import { createApp } from 'vue';
import App from './App.vue';
import VueShortkey from 'vue-shortkey';

const app = createApp(App);
app.use(VueShortkey); // 使用 vue-shortkey 插件
app.mount('#app');