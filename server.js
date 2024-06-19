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
        // Read the files in the videos folder
        fs.readdir(path.join(__dirname, 'videos'), (err, files) => {
            if (err) console.error(`Failed to read videos directory:`, err);

            // If there are more than one file, delete all files
            if (files.length > 1) {
                for (const file of files) {
                    fs.unlink(path.join(__dirname, 'videos', file), err => {
                        if (err) console.error(`Failed to delete ${file}:`, err);
                    });
                }
            }
        });

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

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
