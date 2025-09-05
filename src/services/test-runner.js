class TestRunner {
  constructor(playwrightService) {
    this.playwrightService = playwrightService;
    this.activeTests = new Map();
  }

  async runTest(config) {
    return await this.playwrightService.runTest(config);
  }

  getActiveTests() {
    return Array.from(this.activeTests.values());
  }

  cancelTest(testId) {
    if (this.activeTests.has(testId)) {
      // Cancel logic would go here
      this.activeTests.delete(testId);
      return true;
    }
    return false;
  }
}

module.exports = { TestRunner };