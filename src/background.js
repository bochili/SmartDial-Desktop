'use strict'

import { app, protocol, ipcMain, Notification, Tray, Menu, BrowserWindow, dialog, ipcRenderer, nativeImage } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
const device = require("./device");
const path = require("path");
const fs = require("fs");
const WebSocket = require('ws')
let actions = require('./actions')
const isDevelopment = process.env.NODE_ENV !== 'production'
let win

let tray = null
let buttonState = false

const configDir = app.getPath('userData')
const showNotification = (title, body) => {
  new Notification({ title, body }).show()
}
let toggleSchemeWindow
const createTogglePlanWindow = () => {
  toggleSchemeWindow = new BrowserWindow({
    width: 1000,
    height: 100,
    frame: false,
    fullscreen: false,
    vibrancy: 'dark',
    visualEffectState: "active",
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
      preload: path.join(__dirname, 'preload.js')
    }
  })
  toggleSchemeWindow.loadFile(`./toggleScheme.html`)
  let localSchemeList = []
  for (let el of localKeyPolicy) {
    localSchemeList.push(el.name)
  }
  setTimeout(() => {
    toggleSchemeWindow.webContents.send("schemeList", localSchemeList)
    toggleSchemeWindow.webContents.send("schemeListActived", localConfig.keyPolicySelectedScheme)
  }, 100)
}
let isConnected = {
  ip: '',
  stat: false,
}
let localConfig = {
  lastConnect: '',
  lastStatus: false,
  keyPolicyList: [{ title: "默认配置", path: `${configDir}/keyPolicy.json` }],
  keyPolicySelected: 0,
  keyPolicySelectedScheme: 0,
  recoverWhenStart: true,
  startWhenStart: true,
}
let localHistory = []
let localKeyPolicy = []
const syncLocalConfig = () => {
  fs.writeFileSync(`${configDir}/config.json`, JSON.stringify(localConfig));
  app.setLoginItemSettings({
    openAtLogin: localConfig.startWhenStart
  })
  console.log("配置文件已同步");
}
const syncLocalHistory = () => {
  fs.writeFileSync(`${configDir}/history.json`, JSON.stringify(localHistory));
  console.log("历史记录文件已同步");
}
const syncKeyPolicy = (path) => {
  fs.writeFileSync(path, JSON.stringify(localKeyPolicy));
  console.log("按键方案文件已同步");
  win.webContents.send("keyPolicySaved")
}
const loadFiles = () => {
  fs.stat(`${configDir}/config.json`, (error, status) => {
    if (error) {
      syncLocalConfig()
    } else {
      localConfig = JSON.parse(fs.readFileSync(`${configDir}/config.json`, 'utf8'));
    }

    loadKeyPolicy(localConfig.keyPolicyList[localConfig.keyPolicySelected].path)
  });
  fs.stat(`${configDir}/history.json`, (error, status) => {
    if (error) {
      syncLocalHistory()
    } else {
      localHistory = JSON.parse(fs.readFileSync(`${configDir}/history.json`, 'utf8'));
    }
    console.log("配置文件加载完毕");
  });
}
const loadKeyPolicy = (path) => {
  console.log("加载keyPolicy:", path);
  fs.stat(path, (error, status) => {
    if (error) {
      fs.writeFileSync(path, JSON.stringify({}));
    } else {
      localKeyPolicy = JSON.parse(fs.readFileSync(path, 'utf8'));
      actions.config = localKeyPolicy[localConfig.keyPolicySelected]
    }
  });
}
loadFiles()

let longPressFlag = false
// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])
let ws;
ipcMain.on('openSelectFile', (e, p) => {
  console.log("openFile");
  dialog.showOpenDialog(p).then(result => {
    console.log(result)
    e.sender.send('selectedFile', result.filePaths)
  })
});
ipcMain.on("showNotification", (e, data) => {
  console.log("Notification Structure:", data);
  showNotification(data.title, data.body)
})
ipcMain.on("changeScheme", (e, data) => {
  localConfig.keyPolicySelectedScheme = data
  console.log("changeScheme to:", data);
  win.webContents.send("schemeChanged", data)
  showNotification("切换方案成功", `已切换到${localKeyPolicy[localConfig.keyPolicySelectedScheme].name}方案`)
  actions.click(["toggleWindow"])
  syncLocalConfig()
})
ipcMain.on("clearHistory", (e) => {
  localHistory = []
  syncLocalHistory()
})
ipcMain.on('getConfig', async (e) => {
  e.sender.send("localConfig", localConfig)
})
ipcMain.on("saveConfig", (e, data) => {
  localConfig = data;
  console.log(localConfig);
  syncLocalConfig()
})
ipcMain.on("savePolicyList", (e, data) => {
  localConfig.keyPolicyList = data;
  syncLocalConfig()
})
ipcMain.on("savePolicy", (e, data) => {
  localKeyPolicy = data.policy;
  syncKeyPolicy(data.path)
})
ipcMain.on('getHistoryList', async (e) => {
  console.log("获取历史记录");
  e.sender.send("historyList", localHistory)
})
ipcMain.on("connectLast", (e, p) => {
  e.sender.send("connectDevice", p)
})
ipcMain.on("getPolicyContent", (e, p) => {
  e.sender.send("policyContent", localKeyPolicy)
})
ipcMain.on("getDevicesList", async (e) => {
  let devices = []
  for (var i = 1; i <= 255; i++) {
    await device.scanDevice(device.ip + '.' + i, function (err, host) {
      if (err) {
        return
      }
      devices.push(host)
    })
  }
  setTimeout(() => {
    console.log(devices);
    e.sender.send("foundDevice", devices)
  }, 2000)
})
let pressedTime;
let longPress1
let longPress2
let longPress3
ipcMain.on("connectWS", (e, p) => {
  console.log(p);
  if (ws) {
    ws.close();
  }
  ws = new WebSocket(`ws://${p}:5657`)
  ws.onopen = function (event) {
    console.log("已连接");
    showNotification("SmartDial连接成功！", `已连接到SmartDial`)
    e.sender.send("wsConnected", p);
    isConnected = { ip: p, stat: true }
    localConfig.lastConnect = p
    localHistory.push({
      time: Number(new Date()),
      ip: p
    })
    syncLocalHistory()
    syncLocalConfig()
  }
  ws.onclose = function (event) {
    console.log("服务器关闭");
    isConnected = { ip: null, stat: false }
  }
  ws.onerror = function () {
    console.log("连接出错");
    isConnected = { ip: null, stat: false }
  }
  ws.onmessage = function (event) {
    console.log(event.data);
    const timeStamp = Number(new Date())
    switch (event.data) {
      case "CW":
        if (toggleSchemeWindow) {
          toggleSchemeWindow.send("right")
          clearTimeout(longPress1)
          clearTimeout(longPress2)
          clearTimeout(longPress3)
          break;
        }
        if (longPressFlag) {
          let policy = localKeyPolicy[localConfig.keyPolicySelectedScheme].keyPolicy.find(e => e.name == "触发长按后顺时针")
          if (policy) {
            actions.click(policy.policy)
          }
        }
        if (buttonState) {
          clearTimeout(longPress1)
          clearTimeout(longPress2)
          clearTimeout(longPress3)
        } else {
          let policy = localKeyPolicy[localConfig.keyPolicySelectedScheme].keyPolicy.find(e => e.name == "顺时针")
          if (policy) {
            actions.click(policy.policy)
          }
        }
        break;
      case "CCW":
        if (toggleSchemeWindow) {
          toggleSchemeWindow.send("left")
          clearTimeout(longPress1)
          clearTimeout(longPress2)
          clearTimeout(longPress3)
          break;
        }
        if (longPressFlag) {
          let policy = localKeyPolicy[localConfig.keyPolicySelectedScheme].keyPolicy.find(e => e.name == "触发长按后逆时针")
          if (policy) {
            actions.click(policy.policy)
          }
        }
        if (buttonState) {
          clearTimeout(longPress1)
          clearTimeout(longPress2)
          clearTimeout(longPress3)
        } else {
          let policy = localKeyPolicy[localConfig.keyPolicySelectedScheme].keyPolicy.find(e => e.name == "逆时针")
          if (policy) {
            actions.click(policy.policy)
          }
        }
        break;
      case "btnPressed":
        console.log(timeStamp);
        pressedTime = timeStamp
        buttonState = true
        longPress1 = setTimeout(() => {
          console.log("长按1");
          createTogglePlanWindow()
        }, 1000)
        longPress2 = setTimeout(() => {
          console.log("长按2");
          let policy = localKeyPolicy[localConfig.keyPolicySelectedScheme].keyPolicy.find(e => e.name == "长按")
          if (policy) {
            actions.click(policy.policy)
            if (toggleSchemeWindow) {
              toggleSchemeWindow.close()
              toggleSchemeWindow = null
            }
          }
          longPressFlag = true
        }, 2000)
        longPress3 = setTimeout(() => {
          console.log("长按3");
        }, 3000)
        break;
      case "btnReleased":
        buttonState = false
        const pressedInterval = timeStamp - pressedTime;
        console.log("按下时间：", pressedInterval);
        if (toggleSchemeWindow) {
          toggleSchemeWindow.close()
          toggleSchemeWindow = null
          clearTimeout(longPress1)
          clearTimeout(longPress2)
          clearTimeout(longPress3)
          break;
        }
        if (longPressFlag) {
          let policy = localKeyPolicy[localConfig.keyPolicySelectedScheme].keyPolicy.find(e => e.name == "触发长按后松开")
          if (policy) {
            actions.click(policy.policy)
          }
          longPressFlag = false
          clearTimeout(longPress1)
          clearTimeout(longPress2)
          clearTimeout(longPress3)
          break;
        }
        if (pressedInterval < 200) {
          console.log("短按");
          // if (longPressFlag) {
          //   let policy = localKeyPolicy[localConfig.keyPolicySelectedScheme].keyPolicy.find(e => e.name == "触发长按后单击")
          //   if (policy) {
          //     actions.click(policy.policy)
          //   }
          //   longPressFlag = false
          // } else {
          let policy = localKeyPolicy[localConfig.keyPolicySelectedScheme].keyPolicy.find(e => e.name == "单击")
          if (policy) {
            actions.click(policy.policy)
          }
          // }
          clearTimeout(longPress1)
          clearTimeout(longPress2)
          clearTimeout(longPress3)
        } else if (pressedInterval < 1800) {
          console.log("清除2、3");
          clearTimeout(longPress1)
          clearTimeout(longPress2)
          clearTimeout(longPress3)
        } else if (pressedInterval < 2800) {
          console.log("清除3");
          clearTimeout(longPress1)
          clearTimeout(longPress2)
          clearTimeout(longPress3)
        }
        break;
      default:
        break;
    }
  }
})

ipcMain.on('window-close', () => {
  win.close();
})
ipcMain.on('window-min', () => {
  win.minimize();
})
ipcMain.on("closeWS", () => {
  ws.close()
  showNotification("SmartDial已断开！", `已断开与SmartDial的连接`)
})
async function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 1050,
    height: 700,
    frame: false,
    resizable: false,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  require('@electron/remote/main').initialize()  //添加语句
  require('@electron/remote/main').enable(win.webContents)   //添加语句
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }
  const icon = nativeImage.createFromPath(path.join(__dirname, '../public/small.png'))
  tray = new Tray(icon)
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Item1', type: 'radio' },
    {
      label: '显示主界面', click: () => {
        win.show()
      }
    },
    { label: 'Item3', type: 'radio', checked: true },
    {
      label: '退出', click: () => {
        app.quit()
      }
    }
  ])
  tray.setToolTip('This is my application.')
  tray.setContextMenu(contextMenu)
  win.on('close', (e) => {
    e.preventDefault();  // 阻止退出程序
    win.setSkipTaskbar(true)   // 取消任务栏显示
    win.hide();    // 隐藏主程序窗口
  })
  // tray = new Tray(path.join(__dirname, 'smartdialIco.ico'))
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS3_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
