const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const port = process.env.PORT || 10000;

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('FFmpeg Merge API is running');
});

app.post('/merge', async (req, res) => {
  try {
    const { videoUrl, audioUrl } = req.body;

    if (!videoUrl || !audioUrl) {
      return res.status(400).json({ error: 'Missing videoUrl or audioUrl' });
    }

    const videoPath = path.join(__dirname, 'input.mp4');
    const audioPath = path.join(__dirname, 'input.mp3');
    const outputPath = path.join(__dirname, 'output.mp4');

    const downloadFile = async (url, dest) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to download ${url}`);
      const buffer = await response.buffer();
      fs.writeFileSync(dest, buffer);
    };

    await downloadFile(videoUrl, videoPath);
    await downloadFile(audioUrl, audioPath);

    const ffmpegCommand = `ffmpeg -y -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -shortest "${outputPath}"`;

    exec(ffmpegCommand, (err, stdout, stderr) => {
      if (err) {
        console.error('FFmpeg error:', stderr);
        return res.status(500).json({ error: 'Failed to merge video and audio' });
      }

      res.sendFile(outputPath, () => {
        fs.unlinkSync(videoPath);
        fs.unlinkSync(audioPath);
        fs.unlinkSync(outputPath);
      });
    });

  } catch (error) {
    console.error(er
