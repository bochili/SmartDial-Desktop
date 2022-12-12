<template>
    <div class="container">
        <div>
            <header>
                <div class="header-title">
                    设置
                    <span class="header-savetime" v-if="configSaveTime != ''">最近保存于：{{ configSaveTime }}</span>

                </div>
            </header>
            <div>
                <ul>
                    <li>
                        <a-checkbox @change="startWhenHandle" :model-value="config.startWhenStart">开机自动启动</a-checkbox>
                    </li>
                    <li>
                        <a-checkbox @change="recoverHandle"
                            :model-value="config.recoverWhenStart">启动时恢复上次退出时的连接状态</a-checkbox>
                    </li>
                    <li>
                        <a-button type="secondary">检查更新</a-button>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>
<script setup>
import { ref, onMounted, watch } from 'vue';
import { DevicesStore } from "@/store/index";
const { ipcRenderer } = window.electron
let config = ref({})
let configSaveTime = ref('')
const store = DevicesStore()
onMounted(() => {
    console.log(store.getLocalConfig);
    config.value = store.getLocalConfig
})
const recoverHandle = (e) => {
    config.value.recoverWhenStart = e
    saveConfig()
}
const startWhenHandle = (e) => {
    config.value.startWhenStart = e
    saveConfig()
}
const saveConfig = () => {
    let localConfig = JSON.parse(JSON.stringify(config.value))
    console.log(localConfig);
    store.setLocalConfig(localConfig)
    configSaveTime.value = (new Date().toLocaleDateString()) + " " + (new Date().toLocaleTimeString())
    ipcRenderer.send("saveConfig", localConfig)
}
</script>
<style scoped>
.header-savetime {
    color: #7b8292;
    font-style: italic;
    font-size: 13px;
    padding-left: 10px;
}

li {
    margin-top: 10px;
}
</style>