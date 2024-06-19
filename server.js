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
        // Synchronously read and delete files in the videos folder
        try {
            const files = fs.readdirSync(path.join(__dirname, 'videos'));
            if (files.length > 0) {
                for (const file of files) {
                    fs.unlinkSync(path.join(__dirname, 'videos', file));
                }
            }
        } catch (err) {
            console.error(`Failed to read or delete files in videos directory:`, err);
            socket.emit('downloadError', 'Failed to manage videos directory');
            return;
        }

        try {
            const output = path.join(__dirname, 'videos', `video-${Date.now()}.mp4`);
            const videoPath = path.basename(output);

            await youtubedl(url, {
                output: output,
                format: 'mp4',
            });

            socket.emit('downloadComplete', videoPath);
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
