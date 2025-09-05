const express = require('express');
const router = express.Router();

// Mock reports route - would normally connect to database or file system
router.get('/', (req, res) => {
  const { limit = 10, browser } = req.query;
  
  // Mock data for demonstration
  const mockReports = [
    {
      testId: '123e4567-e89b-12d3-a456-426614174000',
      status: 'completed',
      browser: 'chromium',
      duration: 2340,
      timestamp: '2025-09-05T10:30:00.000Z',
      type: 'screenshot'
    },
    {
      testId: '123e4567-e89b-12d3-a456-426614174001',
      status: 'completed',
      browser: 'firefox',
      duration: 1840,
      timestamp: '2025-09-05T10:25:00.000Z',
      type: 'data_extraction'
    }
  ];

  let filteredReports = mockReports;
  if (browser) {
    filteredReports = mockReports.filter(r => r.browser === browser);
  }

  res.json({
    reports: filteredReports.slice(0, parseInt(limit)),
    total: filteredReports.length
  });
});

module.exports = router;