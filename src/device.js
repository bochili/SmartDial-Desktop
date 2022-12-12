const getIP = require('ip')
const net = require('net')
const Socket = net.Socket
const ip = getIP.address().split('.')[0] + "." + getIP.address().split('.')[1] + "." + getIP.address().split('.')[2]
const port = 5657
const scanDevice = async function (host, cb) {
    var socket = new Socket()
    var status = null
    socket.setTimeout(1500)
    socket.on('connect', async function () {
        socket.end()
        await cb && await cb(null, host)
    })
    socket.on('timeout', async function () {
        socket.destroy()
        await cb && await cb(new Error('timeout'), host)
    })
    socket.on('error', async function (err) {
        await cb && await cb(err, host)
    })
    socket.on('close', function (err) {
    })
    socket.connect(port, host)
}

module.exports = {
    ip,
    scanDevice
}