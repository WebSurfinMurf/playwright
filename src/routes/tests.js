const express = require('express');
const { body, validationResult } = require('express-validator');
const { PlaywrightService } = require('../services/playwright-service');
const router = express.Router();

const playwright = new PlaywrightService();

// Validation middleware
const validateTestScript = [
  body('script').notEmpty().withMessage('Script is required'),
  body('browser').optional().isIn(['chromium', 'firefox', 'webkit']),
  body('timeout').optional().isInt({ min: 1000, max: 300000 }),
];

// Run a browser test
router.post('/run', validateTestScript, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const result = await playwright.runTest(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Take screenshot
router.post('/screenshot', async (req, res) => {
  try {
    const result = await playwright.takeScreenshot(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Extract page data
router.post('/extract', async (req, res) => {
  try {
    const result = await playwright.extractData(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit form
router.post('/form', async (req, res) => {
  try {
    const result = await playwright.submitForm(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get test result
router.get('/:testId', async (req, res) => {
  try {
    const result = await playwright.getTestResult(req.params.testId);
    if (!result) {
      return res.status(404).json({ error: 'Test not found' });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;