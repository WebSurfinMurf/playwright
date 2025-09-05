const express = require('express');
const router = express.Router();

// Artifacts route - serve files from artifact directories
router.get('/screenshots/:filename', (req, res) => {
  const filename = req.params.filename;
  res.sendFile(`/app/screenshots/${filename}`, (err) => {
    if (err) {
      res.status(404).json({ error: 'Screenshot not found' });
    }
  });
});

router.get('/videos/:filename', (req, res) => {
  const filename = req.params.filename;
  res.sendFile(`/app/videos/${filename}`, (err) => {
    if (err) {
      res.status(404).json({ error: 'Video not found' });
    }
  });
});

router.get('/traces/:filename', (req, res) => {
  const filename = req.params.filename;
  res.sendFile(`/app/traces/${filename}`, (err) => {
    if (err) {
      res.status(404).json({ error: 'Trace not found' });
    }
  });
});

module.exports = router;