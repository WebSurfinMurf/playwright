const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs').promises;

const { PlaywrightService } = require('./services/playwright-service');
const { TestRunner } = require('./services/test-runner');
const { ReportGenerator } = require('./services/report-generator');
const { ArtifactManager } = require('./services/artifact-manager');

const app = express();
const server = createServer(app);
const wss = new WebSocket.Server({ server });

// Environment configuration
const PORT = process.env.APP_PORT || 3000;
const HOST = process.env.APP_HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize services
const playwrightService = new PlaywrightService();
const testRunner = new TestRunner(playwrightService);
const reportGenerator = new ReportGenerator();
const artifactManager = new ArtifactManager();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.API_RATE_LIMIT) || 100,
  message: { error: 'Too many requests from this IP' }
});

app.use(limiter);
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
if (NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: NODE_ENV,
    browsers: {
      chromium: process.env.CHROMIUM_ENABLED === 'true',
      firefox: process.env.FIREFOX_ENABLED === 'true',
      webkit: process.env.WEBKIT_ENABLED === 'true'
    }
  });
});

// API Routes
app.use('/api/tests', require('./routes/tests'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/artifacts', require('./routes/artifacts'));
app.use('/api/browsers', require('./routes/browsers'));

// Serve static files and web interface
app.use('/reports', express.static(path.join(__dirname, '../reports')));
app.use('/screenshots', express.static(path.join(__dirname, '../screenshots')));
app.use('/videos', express.static(path.join(__dirname, '../videos')));
app.use('/', express.static(path.join(__dirname, '../public')));

// WebSocket connections for real-time updates
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'subscribe') {
        // Subscribe to test updates
        ws.testId = data.testId;
      }
    } catch (error) {
      ws.send(JSON.stringify({ error: 'Invalid message format' }));
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// Broadcast test updates to WebSocket clients
function broadcastTestUpdate(testId, update) {
  wss.clients.forEach(client => {
    if (client.testId === testId && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(update));
    }
  });
}

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: NODE_ENV === 'production' ? 'Internal server error' : err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    await playwrightService.cleanup();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(async () => {
    await playwrightService.cleanup();
    process.exit(0);
  });
});

// Start server
server.listen(PORT, HOST, () => {
  console.log(`🎭 Playwright service running on http://${HOST}:${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Browsers enabled: ${JSON.stringify({
    chromium: process.env.CHROMIUM_ENABLED === 'true',
    firefox: process.env.FIREFOX_ENABLED === 'true',
    webkit: process.env.WEBKIT_ENABLED === 'true'
  })}`);
});

module.exports = { app, server, broadcastTestUpdate };