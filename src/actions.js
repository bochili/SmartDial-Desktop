const keyBoard = require("./keyBoard");
let actions = {
    config: {},
    click: (clickPolicy) => {
        console.log(clickPolicy);
        for (let el of clickPolicy) {
            switch (el.type) {
                case "内置方法":
                    try {
                        console.log("执行：", el.function);
                        eval("keyBoard." + el.function + "()")
                        continue;
                    } catch (e) {
                        console.log(e);
                        return false
                    }
                case "自定义组合":
                    try {
                        continue;
                    } catch (e) {
                        console.log(e);
                        return false
                    }
                default:
                    return false
            }
        }
    },
    normalClockWise: () => {

    },
    normalAntiClockWise: () => {

    },
    clockWiseWithPressed: () => {

    },
    antiClockWiseWithPressed: () => {

    }
}
module.exports = actions;