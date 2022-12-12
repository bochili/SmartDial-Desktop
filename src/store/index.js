import { defineStore } from 'pinia'

export const DevicesStore = defineStore('Devices', {
  state: () => ({
    connectStatus: 0,
    connectedIP: '',
    devicesList: [],
    isConnected: new Map(),
    messageCount: 0,
    localConfig: {},
  }),
  getters: {
    getMessageCount: state => state.messageCount,
    getDevicesList: state => state.devicesList,
    getConnectedIP: state => state.connectedIP,
    getConnectStatus: state => state.connectStatus,
    getIsConnected: (state) => (ip) => {
      return state.isConnected.get(ip)
    },
    getLocalConfig: state => state.localConfig
  },
  actions: {
    setLocalConfig(state) {
      this.localConfig = state
    },
    setMessageCount() {
      this.messageCount++
    },
    setDevicesList(state) {
      this.devicesList = state
    },
    setConnectedIP(state) {
      this.connectedIP = state
    },
    setConnectStatus(state) {
      this.connectStatus = state
    },
    setIsConnected(ip, val) {
      this.isConnected.set(ip, val)
    }
  },
})
