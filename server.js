const { WebcastPushConnection } = require('tiktok-live-connector');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

// 初始化 Express 应用
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 监听 3000 端口
server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});

// Serve static HTML file
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// 创建一个 WebcastPushConnection 实例
let tiktokLiveConnection;

// 连接到 TikTok 直播聊天室的函数
function connectToTikTokLive(username) {
    tiktokLiveConnection = new WebcastPushConnection(username);
    tiktokLiveConnection.connect().then(state => {
        console.info(`Connected to roomId ${state.roomId}`);
    }).catch(err => {
        console.error('Failed to connect', err);
    });

    // 绑定聊天事件
    tiktokLiveConnection.on('chat', data => {
        // 将聊天消息发送到客户端
        io.emit('chatMessage', {
            user: data.nickname || data.uniqueId, // 使用昵称，如果没有则使用 uniqueId
            message: data.comment
        });
    });

    // 绑定礼物事件
    tiktokLiveConnection.on('gift', data => {
        // 将礼物事件发送到客户端
        io.emit('giftEvent', {
            user: data.uniqueId,
            giftName: data.giftName,
            giftCount: data.repeatCount,
            diamondCount: data.diamondCount,
            giftPictureUrl: data.giftPictureUrl // 确保这里包含礼物图片的 URL
        });
    });
}

// 处理 socket 连接
io.on('connection', (socket) => {
    socket.on('changeRoom', (username) => {
        // 断开之前的连接
        if (tiktokLiveConnection) {
            tiktokLiveConnection.disconnect();
        }

        // 创建新的连接
        connectToTikTokLive(username);
    });
});

// 默认连接
const defaultUsername = "moongirls.47"; // 可以设置一个默认的 TikTok 用户名
connectToTikTokLive(defaultUsername);
