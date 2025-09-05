const { chromium, firefox, webkit } = require('@playwright/test');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class PlaywrightService {
  constructor() {
    this.browsers = new Map();
    this.testResults = new Map();
    this.setupCleanup();
  }

  async getBrowser(browserType = 'chromium', headless = true) {
    const key = `${browserType}-${headless}`;
    
    if (this.browsers.has(key)) {
      const browser = this.browsers.get(key);
      if (browser.isConnected()) {
        return browser;
      } else {
        this.browsers.delete(key);
      }
    }

    let browser;
    const options = { headless };

    switch (browserType) {
      case 'firefox':
        browser = await firefox.launch(options);
        break;
      case 'webkit':
        browser = await webkit.launch(options);
        break;
      case 'chromium':
      default:
        browser = await chromium.launch(options);
        break;
    }

    this.browsers.set(key, browser);
    return browser;
  }

  async runTest(config) {
    const testId = uuidv4();
    const startTime = Date.now();

    try {
      const {
        script,
        browser: browserType = 'chromium',
        headless = true,
        viewport = { width: 1280, height: 720 },
        timeout = 30000,
        takeScreenshot = false,
        recordVideo = false
      } = config;

      const browser = await this.getBrowser(browserType, headless);
      const context = await browser.newContext({
        viewport,
        recordVideo: recordVideo ? { dir: '/app/videos' } : undefined
      });

      const page = await context.newPage();
      page.setDefaultTimeout(timeout);

      // Execute the script in a controlled environment
      const result = await this.executeScript(page, script);

      let screenshotPath = null;
      if (takeScreenshot) {
        screenshotPath = `/app/screenshots/${testId}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
      }

      await context.close();

      const testResult = {
        testId,
        status: 'completed',
        result,
        browser: browserType,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        artifacts: {
          screenshot: screenshotPath,
          video: recordVideo ? `/app/videos/${testId}.webm` : null
        }
      };

      this.testResults.set(testId, testResult);
      return testResult;

    } catch (error) {
      const testResult = {
        testId,
        status: 'failed',
        error: error.message,
        browser: config.browser || 'chromium',
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };

      this.testResults.set(testId, testResult);
      return testResult;
    }
  }

  async executeScript(page, script) {
    // Create a safe execution context
    const wrappedScript = `
      (async () => {
        ${script}
      })();
    `;

    return await page.evaluate(wrappedScript);
  }

  async takeScreenshot(config) {
    const testId = uuidv4();

    try {
      const {
        url,
        browser: browserType = 'chromium',
        fullPage = false,
        selector,
        waitFor = 'networkidle'
      } = config;

      const browser = await this.getBrowser(browserType, true);
      const page = await browser.newPage();

      await page.goto(url);
      
      // Wait based on condition
      if (waitFor === 'networkidle') {
        await page.waitForLoadState('networkidle');
      } else if (waitFor === 'load') {
        await page.waitForLoadState('load');
      } else if (waitFor === 'domcontentloaded') {
        await page.waitForLoadState('domcontentloaded');
      } else {
        // Assume it's a CSS selector
        await page.waitForSelector(waitFor);
      }

      const screenshotPath = `/app/screenshots/${testId}.png`;
      const screenshotOptions = { path: screenshotPath, fullPage };

      if (selector) {
        const element = await page.locator(selector);
        await element.screenshot({ path: screenshotPath });
      } else {
        await page.screenshot(screenshotOptions);
      }

      await page.close();

      return {
        testId,
        screenshotPath,
        screenshotUrl: `/screenshots/${testId}.png`,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      throw new Error(`Screenshot failed: ${error.message}`);
    }
  }

  async extractData(config) {
    const testId = uuidv4();

    try {
      const {
        url,
        selectors,
        browser: browserType = 'chromium',
        waitFor = 'networkidle'
      } = config;

      const browser = await this.getBrowser(browserType, true);
      const page = await browser.newPage();

      await page.goto(url);
      
      if (waitFor === 'networkidle') {
        await page.waitForLoadState('networkidle');
      } else if (waitFor === 'load') {
        await page.waitForLoadState('load');
      } else {
        await page.waitForSelector(waitFor);
      }

      const data = {};
      for (const [key, selector] of Object.entries(selectors)) {
        try {
          const element = page.locator(selector).first();
          data[key] = await element.textContent();
        } catch (error) {
          data[key] = null;
        }
      }

      await page.close();

      return {
        testId,
        data,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      throw new Error(`Data extraction failed: ${error.message}`);
    }
  }

  async submitForm(config) {
    const testId = uuidv4();

    try {
      const {
        url,
        formData,
        submitSelector = 'input[type="submit"], button[type="submit"]',
        browser: browserType = 'chromium',
        waitAfterSubmit = 3000
      } = config;

      const browser = await this.getBrowser(browserType, true);
      const page = await browser.newPage();

      await page.goto(url);
      await page.waitForLoadState('networkidle');

      // Fill form fields
      for (const [selector, value] of Object.entries(formData)) {
        await page.fill(selector, value);
      }

      // Submit form
      await page.click(submitSelector);
      
      // Wait for submission
      await page.waitForTimeout(waitAfterSubmit);

      const finalUrl = page.url();
      await page.close();

      return {
        testId,
        success: true,
        finalUrl,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      throw new Error(`Form submission failed: ${error.message}`);
    }
  }

  getTestResult(testId) {
    return this.testResults.get(testId) || null;
  }

  async cleanup() {
    for (const browser of this.browsers.values()) {
      try {
        await browser.close();
      } catch (error) {
        console.error('Error closing browser:', error);
      }
    }
    this.browsers.clear();
  }

  setupCleanup() {
    // Cleanup browsers periodically
    setInterval(async () => {
      const now = Date.now();
      for (const [key, browser] of this.browsers.entries()) {
        try {
          if (!browser.isConnected()) {
            this.browsers.delete(key);
          }
        } catch (error) {
          this.browsers.delete(key);
        }
      }
    }, 60000); // Every minute

    // Cleanup old test results
    setInterval(() => {
      const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
      for (const [testId, result] of this.testResults.entries()) {
        if (new Date(result.timestamp).getTime() < cutoff) {
          this.testResults.delete(testId);
        }
      }
    }, 60 * 60 * 1000); // Every hour
  }
}

module.exports = { PlaywrightService };