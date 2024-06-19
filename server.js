const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const youtubedl = require('youtube-dl-exec');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use('/videos', express.static(path.join(__dirname, 'videos')));

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('downloadVideo', async (url) => {
        try {
            const output = `videos/video-${Date.now()}.mp4`;
            const videoPath = path.basename(output);

            const result = await youtubedl(url, {
                output: output,
                format: 'mp4',
            });

            socket.emit('downloadComplete', videoPath);
        } catch (error) {
            console.error(error);
            socket.emit('downloadError', 'Failed to download video');
        }
    });

    socket.on('videoDownloaded', (videoPath) => {
        // Schedule deletion of the video file after 1 minute (60000 ms)
        setTimeout(() => {
            const fullPath = path.join(__dirname, 'videos', videoPath);
            fs.unlink(fullPath, (err) => {
                if (err) console.error(`Failed to delete ${videoPath}:`, err);
            });
        }, 60000);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
