const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const youtubedl = require('youtube-dl-exec');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('downloadVideo', async (url) => {
        try {
            const output = `videos/video-${Date.now()}.mp4`;
            await youtubedl(url, {
                output: output,
                format: 'mp4'
            });
            socket.emit('downloadComplete', output);
        } catch (error) {
            console.error(error);
            socket.emit('downloadError', 'Failed to download video');
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
