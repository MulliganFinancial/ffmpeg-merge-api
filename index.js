const express = require('express');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

const downloadFile = async (url, filepath) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}`);
  const fileStream = fs.createWriteStream(filepath);
  return new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on("error", reject);
    fileStream.on("finish", resolve);
  });
};

app.post('/merge', async (req, res) => {
  try {
    const { videourl, audiourl } = req.body;

    if (!videourl || !audiourl) {
      return res.status(400).json({ error: 'Missing videourl or audiourl' });
    }

    const videoFile = `/tmp/${uuidv4()}.mp4`;
    const audioFile = `/tmp/${uuidv4()}.mp3`;
    const outputFile = `/tmp/${uuidv4()}.mp4`;

    await downloadFile(videourl, videoFile);
    await downloadFile(audiourl, audioFile);

    ffmpeg()
      .input(videoFile)
      .input(audioFile)
      .outputOptions('-c:v copy', '-c:a aac', '-shortest')
      .save(outputFile)
      .on('end', () => res.sendFile(outputFile))
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        res.status(500).json({ error: 'Failed to merge video and audio' });
      });

  } catch (err) {
    console.error('Merge handler error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(10000, () => {
  console.log('FFmpeg Merge API running on port 10000');
});
