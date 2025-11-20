const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const { execSync } = require('child_process');

const app = express();
const PORT = process.env.PORT || 9000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const DEPLOY_SCRIPT_PATH = process.env.DEPLOY_SCRIPT_PATH || '/app/deploy.sh';

if (!WEBHOOK_SECRET) {
  console.error('ERROR: WEBHOOK_SECRET environment variable is required');
  process.exit(1);
}

// Middleware
app.use(bodyParser.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Verify GitHub webhook signature
function verifySignature(payload, signature) {
  if (!signature) {
    return false;
  }

  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const digest = 'sha256=' + hmac.update(JSON.stringify(payload)).digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// Webhook endpoint
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const event = req.headers['x-github-event'];

  console.log(`[${new Date().toISOString()}] Received webhook event: ${event}`);

  // Verify signature
  if (!verifySignature(req.body, signature)) {
    console.error(`[${new Date().toISOString()}] Invalid signature`);
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Only process push events to main branch
  if (event === 'push') {
    const ref = req.body.ref;
    const branch = ref ? ref.split('/').pop() : '';

    if (branch !== 'main') {
      console.log(`[${new Date().toISOString()}] Ignoring push to branch: ${branch}`);
      return res.status(200).json({ message: `Ignored push to ${branch}` });
    }

    console.log(`[${new Date().toISOString()}] Starting deployment...`);

    // Return response immediately to GitHub
    res.status(200).json({ message: 'Deployment triggered' });

    // Execute deployment script asynchronously
    try {
      execSync(`bash ${DEPLOY_SCRIPT_PATH}`, {
        cwd: '/app/project',
        stdio: 'inherit',
        env: {
          ...process.env,
          PROJECT_DIR: '/app/project',
        }
      });
      console.log(`[${new Date().toISOString()}] Deployment completed successfully`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Deployment failed:`, error.message);
    }
  } else if (event === 'ping') {
    console.log(`[${new Date().toISOString()}] Ping received`);
    res.status(200).json({ message: 'Pong' });
  } else {
    console.log(`[${new Date().toISOString()}] Ignoring event: ${event}`);
    res.status(200).json({ message: `Event ${event} ignored` });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[${new Date().toISOString()}] Webhook listener running on port ${PORT}`);
  console.log(`[${new Date().toISOString()}] Waiting for GitHub webhooks...`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log(`[${new Date().toISOString()}] SIGTERM received, shutting down gracefully`);
  process.exit(0);
});
