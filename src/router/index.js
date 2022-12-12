import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '@/Views/HomeView.vue'
import DevicesView from '@/Views/DevicesView.vue'
import PolicyViewVue from '@/Views/PolicyView.vue'
import SettingViewVue from '@/Views/SettingView.vue'

const routes = [
  {
    path: '/policy',
    name: 'policy',
    component: PolicyViewVue
  },
  {
    path: '/',
    name: 'devices',
    component: DevicesView
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingViewVue
  }
]

const router = createRouter({
  history: createWebHashHistory(process.env.BASE_URL),
  routes
})

export default router
