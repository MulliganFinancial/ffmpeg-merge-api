const express = require('express');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
app.use(express.json());

app.post('/merge', async (req, res) => {
  const { videourl, audiourl } = req.body;

  if (!videourl || !audiourl) {
    return res.status(400).json({ error: 'Missing video or audio URL' });
  }

  const tempId = uuidv4();
  const videoPath = path.join(__dirname, `${tempId}-video.mp4`);
  const audioPath = path.join(__dirname, `${tempId}-audio.mp3`);
  const outputPath = path.join(__dirname, `${tempId}-output.mp4`);

  try {
    const downloadFile = async (url, outputPath) => {
      const response = await axios({ url, method: 'GET', responseType: 'stream' });
      const writer = fs.createWriteStream(outputPath);
      response.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    };

    await downloadFile(videourl, videoPath);
    await downloadFile(audiourl, audioPath);

    ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .outputOptions('-c:v copy', '-c:a aac')
      .on('end', () => {
        res.sendFile(outputPath, {}, () => {
          fs.unlinkSync(videoPath);
          fs.unlinkSync(audioPath);
          fs.unlinkSync(outputPath);
        });
      })
      .on('error', (err) => {
        console.error(err);
        res.status(500).json({ error: 'Failed to merge video and audio' });
      })
      .save(outputPath);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Download or processing failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
