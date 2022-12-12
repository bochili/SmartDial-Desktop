<template>

  <div class="nav-operate">
    <div @click="windowClose" class="nav-operate-close"></div>
    <div @click="windowMin" class="nav-operate-min"></div>
  </div>
  <aside>
    <div class="logo">
      <img src="@/assets/smartdial.png" />
      <div class="status">
        <div :style="{
          'background-color': store.getConnectStatus == 0 ? 'rgb(255, 10, 92)' : (store.getConnectStatus == 1 ? 'rgb(45, 213, 147)' : '#FCBC2F')
        }" class="nav-status-indicator"></div>
        <span :style="{
          'color': store.getConnectStatus == 0 ? 'rgb(255, 10, 92)' : (store.getConnectStatus == 1 ? 'rgb(45, 213, 147)' : '#FCBC2F')
        }">{{ store.getConnectStatus == 0 ? '未连接' : (store.getConnectStatus == 1 ? '已连接' : '连接中...') }}</span>
      </div>
    </div>
    <ul class="nav-list">
      <li :class="currentRoute == '/' ? 'nav-list-item-active' : ''" class="nav-list-item" @click="router.push('/')">
        <div class="nav-list-item-icon" style="color:#0078ff">
          <icon-link />
        </div>
        <div class="nav-list-item-title">
          设备连接
        </div>
      </li>
      <li :class="currentRoute == '/policy' ? 'nav-list-item-active' : ''" class="nav-list-item"
        @click="router.push('/policy')">
        <div class="nav-list-item-icon" style="color:rgb(45, 213, 147)">
          <icon-list />
        </div>
        <div class="nav-list-item-title">
          策略配置
        </div>
      </li>
      <li :class="currentRoute == '/settings' ? 'nav-list-item-active' : ''" class="nav-list-item"
        @click="router.push('/settings')">
        <div class="nav-list-item-icon" style="color:rgb(255, 10, 92)">
          <icon-settings />
        </div>
        <div class="nav-list-item-title">
          设置
        </div>
      </li>
    </ul>
  </aside>
  <!-- <img alt="Vue logo" src="./assets/logo.png">
  <HelloWorld msg="Welcome to Your Vue.js App"/> -->
  <router-view />
</template>

<script setup>
import router from '@/router/index'
import { ref, watch, onMounted } from 'vue';
import { DevicesStore } from "@/store/index";
const store = DevicesStore()
let currentRoute = ref('/')
const { ipcRenderer } = window.electron
watch(router.currentRoute, (val) => {
  currentRoute.value = val.fullPath
})
watch(store.getIsConnected, (val) => {
  console.log(val);
})
const windowClose = () => {
  console.log("关闭");
  ipcRenderer.send('window-close')
}
const windowMin = () => {
  console.log("最小化");
  ipcRenderer.send('window-min')
}

ipcRenderer.send("getConfig")
ipcRenderer.send("getDevicesList")
ipcRenderer.send("getConfig")
onMounted(() => {
})
ipcRenderer.on("foundDevice", (e, devices) => {
  // deviceList.value = devices
  // scanning.value = false
  console.log("foundDevice");
  store.setDevicesList(devices)
})
ipcRenderer.on("localConfig", (e, data) => {
  if (data.lastConnect != "" && data.recoverWhenStart) {
    ipcRenderer.send("connectLast", data.lastConnect)
  }
  store.setLocalConfig(data)
})
</script>

<style lang="stylus">


#app
  font-family Avenir, Helvetica, Arial, sans-serif
  -webkit-font-smoothing antialiased
  -moz-osx-font-smoothing grayscale
  // text-align center
  color #2c3e50
  margin-top 60px
.logo 
  margin 60px 0 25px 30px
  img
    height 50px
aside 
  position fixed
  top 0
  left 0
  height 100%
  width 250px
  // box-shadow 0 0 10px rgba(0,0,0,.1)
  .nav-msg
    position fixed
    bottom 20px
    left 25px
.status
  position absolute
  top 95px
  right 20px
.nav-status-indicator 
    width 10px
    height 10px
    border-radius 1000px
    display inline-block
    background-color #000
    margin-right 10px
</style>
