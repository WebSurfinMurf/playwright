const express = require('express');
const router = express.Router();

// Browser information route
router.get('/', (req, res) => {
  const browsers = {
    chromium: {
      enabled: process.env.CHROMIUM_ENABLED === 'true',
      version: '119.0.0.0',
      features: ['screenshots', 'videos', 'traces', 'mobile-emulation']
    },
    firefox: {
      enabled: process.env.FIREFOX_ENABLED === 'true',
      version: '119.0.0',
      features: ['screenshots', 'videos', 'traces']
    },
    webkit: {
      enabled: process.env.WEBKIT_ENABLED === 'true',
      version: '17.0',
      features: ['screenshots', 'videos', 'mobile-emulation']
    }
  };

  res.json({
    browsers,
    default: 'chromium',
    concurrentLimit: parseInt(process.env.MAX_CONCURRENT_TESTS) || 5
  });
});

module.exports = router;