<template>
    <div class="container">
        <a-modal v-model:visible="manualIPDialogVisible" @ok="connectDevice(manualIPVal)" ok-text="连接">
            <template #title>
                输入 IP 地址以连接 SmartDial
            </template>
            <div>
                <a-input v-model="manualIPVal" placeholder="请在此输入IP地址或域名，无需添加端口号" />
            </div>
        </a-modal>
        <a-modal @before-open="getHistory" v-model:visible="historyDialogVisible">
            <template #title>
                历史连接记录
                <div style="margin-left:10px">
                    <a-button @click="clearHistory" type="secondary" size="mini" status="warning">
                        <template #icon>
                            <icon-delete />
                        </template>
                    </a-button>
                </div>
            </template>
            <div>
                <a-table :pagination="{
                    pageSize: 7
                }" :columns="historyColumns" :data="historyData">
                    <template #time="{ record, rowIndex }">
                        {{ (new Date(Number(record.time)).toLocaleDateString()) + (new
                                Date(Number(record.time)).toLocaleTimeString())
                        }}
                    </template>
                </a-table>
            </div>
        </a-modal>
        <div>
            <header>
                <div class="header-title">网络上的 SmartDial</div>
                <div class="header-operate">
                    <a-button size="mini" :loading="scanning" @click="getDevices" status="info" type="primary">
                        <template #icon>
                            <icon-loop />
                        </template>
                        扫描
                    </a-button>
                    <a-button size="mini" @click="(manualIPDialogVisible = true)" status="info" type="secondary">
                        <template #icon>
                            <icon-plus />
                        </template>
                        手动输入IP
                    </a-button>
                    <a-button size="mini" @click="(historyDialogVisible = true)" status="warning" type="secondary">
                        <template #icon>
                            <icon-history />
                        </template>
                        历史记录
                    </a-button>
                    <a-button size="mini" @click="clearConnection" status="danger" type="primary">
                        <template #icon>
                            <icon-refresh />
                        </template>
                        重置连接
                    </a-button>
                </div>
            </header>
            <div>
                <a-list :loading="scanning">
                    <a-list-item v-for="(item, index) in deviceList" :key="index">
                        <a-list-item-meta :title="item">
                            <template #avatar>
                                <!-- <div class="devices-list-icon">
                                    <icon-poweroff />
                                </div> -->
                                <img style="width:30px" src="@/assets/smartdialIco.png" />
                            </template>
                        </a-list-item-meta>
                        <template #actions>
                            <a-button type="primary" class="bg-blue" v-if="!store.getIsConnected(item)"
                                :loading="connecting" :disabled="store.getIsConnected(item)"
                                @click="connectDevice(item)">连接</a-button>

                            <a-button type="primary" v-else status="danger"
                                @click="disconnectDevice(item)">断开</a-button>

                        </template>
                    </a-list-item>
                </a-list>
            </div>
        </div>
    </div>
</template>
<style scoped>
.devices-list-icon {
    color: green;
    font-size: large;
    margin-top: 5px;
}
</style>
<script setup>
// @ is an alias to /src
import { onMounted, ref, watch } from 'vue';
import { Message } from '@arco-design/web-vue';
import { DevicesStore } from "@/store/index";
const store = DevicesStore()
const { ipcRenderer } = window.electron
let deviceList = ref([])
let connecting = ref(false)
let scanning = ref(false)
let refreshFlag = ref(false)
let manualIPDialogVisible = ref(false)
let manualIPVal = ref('')
let historyDialogVisible = ref(false)
const subscribeDevices = store.$subscribe((mutation, state) => {
    deviceList.value = state.devicesList
    scanning.value = false
}, { detached: false })
const historyColumns = [
    {
        title: '设备 IP',
        dataIndex: 'ip',
    },
    {
        title: '时间',
        dataIndex: 'time',
        slotName: 'time',
        sortable: {
            sortDirections: ['descend']
        },
    },
];
let historyData = ref([])
const getDevices = () => {
    ipcRenderer.send("getDevicesList")
    scanning.value = true
}
const getHistory = () => {
    ipcRenderer.send("getHistoryList")
}
const clearConnection = () => {
    disconnectDevice(store.getConnectedIP)
}
const clearHistory = () => {
    ipcRenderer.send("clearHistory")
    historyData.value = []
    Message.success("清除完成！")
}
onMounted(() => {
    deviceList.value = store.getDevicesList
})

ipcRenderer.on("historyList", (e, list) => {
    historyData.value = list
})

ipcRenderer.on("connectDevice", (e, ip) => {
    connectDevice(ip)
})
ipcRenderer.on("wsConnected", async (e, data) => {
    store.setIsConnected(data, true)
    store.setConnectedIP(data)
    connecting.value = false
    store.setConnectStatus(1)
})
const connectDevice = (ip) => {
    if (ip == "") {
        Message.error("ip 不能为空！"); return;
    }
    if (store.getConnectStatus == 1) disconnectDevice(store.getConnectedIP)
    connecting.value = true
    ipcRenderer.send("connectWS", ip)
    store.setConnectStatus(2)
}
const disconnectDevice = (ip) => {
    store.setIsConnected(ip, false)
    store.setConnectedIP(null)
    store.setConnectStatus(0)
    ipcRenderer.send("closeWS")
    connecting.value = false
}
</script>
<style lang="stylus">
</style>