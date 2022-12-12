import { createApp } from 'vue'
import App from './App.vue'
import ArcoVue from '@arco-design/web-vue';
import '@arco-design/web-vue/dist/arco.css';
import '@/assets/global.css'
import router from './router'
import ArcoVueIcon from '@arco-design/web-vue/es/icon';
import { createPinia } from 'pinia'
createApp(App).use(createPinia()).use(router).use(ArcoVue).use(ArcoVueIcon).mount('#app')
