var robot = require("robotjs");
const keyBoard = {
    setDelay: (e) => {
        robot.setKeyboardDelay(e)
    },
    // 切换一次窗口
    toggleWindow: () => {
        robot.keyToggle("tab", "down", "command")
        robot.setKeyboardDelay(50)
        robot.keyToggle("command", "down")
        robot.setKeyboardDelay(50)
        robot.keyToggle("tab", "up")
    },
    // 调出切换窗口菜单
    openWindowMenu: () => {
        robot.setKeyboardDelay(100)
        robot.keyToggle("tab", "down", "command")
        robot.keyToggle("command", "down")
        robot.setKeyboardDelay(100)
        robot.keyToggle("tab", "up", "command")
    },
    // 调出切换窗口菜单
    windowMenuLeft: () => {
        robot.setKeyboardDelay(100)
        robot.keyToggle("left", "down", "command")
        robot.keyToggle("command", "down")
        robot.setKeyboardDelay(100)
        robot.keyToggle("left", "up", "command")
    },
    left: () => {
        robot.keyTap("left")
    },
    right: () => {
        robot.keyTap("right")
    },
    backspace: () => {
        robot.keyTap("backspace")
    },
    enter: () => {
        robot.keyTap("enter")
    },
    nextSong: () => {
        // robot.keyTap("right", ["command"])
        robot.keyTap("audio_next")
        // robot.keyTap("right", ["control", "alt"])
    },
    prevSong: () => {
        robot.keyTap("audio_prev")
        // robot.keyTap("left", ["command"])
        // robot.keyTap("left", ["control", "alt"])
    },
    togglePlay: () => {
        // robot.keyTap("audio_play", ["control", "alt"])
        robot.keyTap("audio_play")
    }
}


module.exports = keyBoard


234

23

4
