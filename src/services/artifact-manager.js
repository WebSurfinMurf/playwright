const fs = require('fs').promises;
const path = require('path');

class ArtifactManager {
  constructor() {
    this.dirs = {
      screenshots: '/app/screenshots',
      videos: '/app/videos',
      traces: '/app/traces',
      reports: '/app/reports'
    };
  }

  async init() {
    for (const dir of Object.values(this.dirs)) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async saveScreenshot(testId, buffer) {
    const filePath = path.join(this.dirs.screenshots, `${testId}.png`);
    await fs.writeFile(filePath, buffer);
    return filePath;
  }

  async getScreenshot(testId) {
    const filePath = path.join(this.dirs.screenshots, `${testId}.png`);
    try {
      return await fs.readFile(filePath);
    } catch (error) {
      return null;
    }
  }

  async saveVideo(testId, buffer) {
    const filePath = path.join(this.dirs.videos, `${testId}.webm`);
    await fs.writeFile(filePath, buffer);
    return filePath;
  }

  async saveTrace(testId, data) {
    const filePath = path.join(this.dirs.traces, `${testId}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return filePath;
  }

  async cleanup(olderThanMs = 24 * 60 * 60 * 1000) {
    const now = Date.now();
    
    for (const dir of Object.values(this.dirs)) {
      try {
        const files = await fs.readdir(dir);
        
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = await fs.stat(filePath);
          
          if (now - stats.mtimeMs > olderThanMs) {
            await fs.unlink(filePath);
          }
        }
      } catch (error) {
        console.error(`Cleanup error in ${dir}:`, error);
      }
    }
  }
}

module.exports = { ArtifactManager };