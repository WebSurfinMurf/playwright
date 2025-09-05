const fs = require('fs').promises;
const path = require('path');

class ReportGenerator {
  constructor() {
    this.reportsDir = '/app/reports';
  }

  async generateReport(testResult) {
    const reportPath = path.join(this.reportsDir, `${testResult.testId}.json`);
    
    const report = {
      ...testResult,
      generatedAt: new Date().toISOString(),
      reportVersion: '1.0.0'
    };

    try {
      await fs.mkdir(this.reportsDir, { recursive: true });
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      return reportPath;
    } catch (error) {
      console.error('Failed to generate report:', error);
      return null;
    }
  }

  async getReport(testId) {
    const reportPath = path.join(this.reportsDir, `${testId}.json`);
    try {
      const content = await fs.readFile(reportPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  async listReports(limit = 10) {
    try {
      const files = await fs.readdir(this.reportsDir);
      const reports = [];
      
      for (const file of files.slice(0, limit)) {
        if (file.endsWith('.json')) {
          const report = await this.getReport(file.replace('.json', ''));
          if (report) reports.push(report);
        }
      }
      
      return reports;
    } catch (error) {
      return [];
    }
  }
}

module.exports = { ReportGenerator };