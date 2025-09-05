# Project: Playwright

## Overview
- Purpose: Browser automation service with web interface and MCP integration
- URL: https://playwright.ai-servicers.com
- Repository: /home/administrator/projects/playwright
- Created: 2025-09-05

## Configuration
- Project Name: playwright
- Environment: /home/administrator/secrets/playwright.env
- Container: playwright
- MCP Server: /home/administrator/projects/mcp-playwright

## Services & Ports
- Application: Port 3000 (internal)
- External: https://playwright.ai-servicers.com
- MCP Server: stdio transport via Claude Code

## Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Claude Code   │◄──►│  MCP-Playwright │◄──►│  Playwright     │
│                 │    │     Server      │    │   Service       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                                              ┌─────────────────┐
                                              │   Browser       │
                                              │   Engines       │
                                              │ (Chrome/FF/WK)  │
                                              └─────────────────┘
```

## Features
- **Multi-browser Support**: Chromium, Firefox, WebKit
- **REST API**: Complete automation API
- **MCP Integration**: Direct Claude Code integration
- **Web Interface**: Browser-based control panel
- **Artifact Storage**: Screenshots, videos, traces
- **Real-time Updates**: WebSocket connections
- **Test Persistence**: Result storage and retrieval

## MCP Tools Available
1. **run_browser_test**: Execute custom JavaScript automation
2. **navigate_and_screenshot**: Take screenshots of web pages
3. **extract_page_data**: Scrape data using CSS selectors
4. **fill_form_and_submit**: Automate form submissions
5. **get_test_results**: Retrieve test execution results
6. **list_test_reports**: Browse historical test reports
7. **check_service_health**: Monitor service status

## API Endpoints
- `POST /api/tests/run` - Execute browser test
- `POST /api/tests/screenshot` - Take screenshot
- `POST /api/tests/extract` - Extract page data
- `POST /api/tests/form` - Submit forms
- `GET /api/tests/:testId` - Get test results
- `GET /api/reports` - List test reports
- `GET /health` - Health check

## Storage Locations
- **Reports**: `/home/administrator/projects/playwright/data/reports/`
- **Screenshots**: `/home/administrator/projects/playwright/data/screenshots/`
- **Videos**: `/home/administrator/projects/playwright/data/videos/`
- **Traces**: `/home/administrator/projects/playwright/data/traces/`

## Docker Networks
- `traefik-proxy`: Web access via Traefik
- `redis-net`: Optional queue management

## Environment Variables
Key configuration in `/home/administrator/secrets/playwright.env`:
- `APP_PORT`: Application port (3000)
- `PLAYWRIGHT_BROWSERS_PATH`: Browser binaries path
- `MAX_CONCURRENT_TESTS`: Concurrent test limit (5)
- `TEST_TIMEOUT`: Default test timeout (60s)
- `REDIS_HOST`: Queue management (optional)

## Deployment
```bash
cd /home/administrator/projects/playwright
./deploy.sh
```

## MCP Server Deployment
```bash
cd /home/administrator/projects/mcp-playwright
./deploy.sh
# Restart Claude Code to load MCP server
```

## Container Management
```bash
# View logs
docker logs playwright -f

# Restart container
docker restart playwright

# Check health
curl https://playwright.ai-servicers.com/health

# Shell access
docker exec -it playwright /bin/bash

# Stop container
docker stop playwright

# Remove container
docker rm playwright
```

## Usage Examples

### Via MCP (Claude Code)
```
Can you take a screenshot of google.com using the Playwright service?

Can you extract the title and main heading from example.com?

Run a test that fills out a contact form on my website.
```

### Via API
```bash
# Take screenshot
curl -X POST https://playwright.ai-servicers.com/api/tests/screenshot \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "browser": "chromium"}'

# Extract data
curl -X POST https://playwright.ai-servicers.com/api/tests/extract \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "selectors": {"title": "h1", "description": "p"}}'
```

## Development Features
- **Hot reload**: Development mode with nodemon
- **Debug mode**: Run tests with `--debug` flag
- **Trace viewer**: Built-in trace analysis
- **Video recording**: Full session recording
- **Network inspection**: Request/response logging

## Monitoring & Health Checks
- Health endpoint: `/health`
- Container logs: `docker logs playwright`
- Browser processes: Monitored and cleaned automatically
- Test results: 24-hour retention by default
- Resource usage: Memory and CPU monitoring

## Security Considerations
- **Sandboxed execution**: All browser processes isolated
- **Resource limits**: CPU and memory constraints
- **Network restrictions**: Controlled external access
- **Input validation**: All API inputs validated
- **Rate limiting**: API request throttling

## Integration Points
- **Redis**: Queue management (optional) - connected to redis-net
- **MinIO**: Artifact storage for screenshots/videos
- **Traefik**: HTTPS termination and routing via traefik-proxy network
- **Claude Code**: Direct MCP integration via stdio transport
- **Dashy**: Listed in Developer Tools section for easy access
- **Docker Networks**: traefik-proxy (web access), redis-net (queue)

## Troubleshooting Log
- [2025-09-05]: Initial deployment completed
  - All browser engines installed and verified
  - MCP server integrated with Claude Code
  - Web interface accessible at https://playwright.ai-servicers.com
  - Test automation working with all three browser types
  - Added to Dashy dashboard under Developer Tools section

## Performance Notes
- **Concurrent tests**: Limited to 5 by default (configurable)
- **Browser reuse**: Browsers kept alive between requests
- **Memory management**: Automatic cleanup of old test data
- **Resource monitoring**: Built-in health checks and metrics

## Known Issues & Solutions
- **Port 3000 not accessible locally**: Container runs on Docker network, use `docker exec` or access via https://playwright.ai-servicers.com
- **MCP connection issues**: Ensure container IP is correct in MCP config (check with `docker inspect playwright`)
- **Browser download errors**: Browsers are pre-installed in the Microsoft Playwright image
- **Health check delays**: Service takes ~10 seconds to fully start due to browser initialization

## Future Enhancements
- Database persistence for test results
- User authentication and multi-tenancy
- Test scheduling and cron jobs
- Advanced reporting and analytics
- CI/CD pipeline integration
- Performance testing capabilities
- Parallel test execution across multiple containers
- Integration with GitLab CI/CD
- Slack/Discord notifications for test results