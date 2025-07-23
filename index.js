const express = require("express");
const fetch = require("node-fetch");
const app = express();

app.use(express.json());

app.post("/test", async (req, res) => {
  const { videoUrl, audioUrl } = req.body;

  try {
    const videoRes = await fetch(videoUrl);
    const audioRes = await fetch(audioUrl);

    if (!videoRes.ok || !audioRes.ok) {
      return res.status(400).json({
        error: "Unable to download one or both files.",
        videoStatus: videoRes.status,
        audioStatus: audioRes.status,
      });
    }

    return res.json({ message: "Both files are accessible!" });
  } catch (err) {
    return res.status(500).json({ error: "Fetch failed", details: err.message });
  }
});

app.listen(10000, () => {
  console.log("Test server running on port 10000");
});

