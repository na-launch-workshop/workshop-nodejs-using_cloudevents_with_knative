const express = require('express');
const { v4: uuidv4 } = require('uuid');
const config = require('./config');
const logger = require('./logger');
const { processEvent } = require('./transaction-chain');
const { disconnect: disconnectKafka } = require('./kafka');

const app = express();

app.use(express.json({ type: ['application/json', 'application/*+json'] }));

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    logger.warn({ error: error.message }, 'Invalid JSON payload');
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  return next(error);
});

app.get('/health', (req, res) => {
  res.status(200).send('ok');
});

app.post('/', async (req, res) => {
  const eventType = req.get('ce-type');
  const eventId = req.get('ce-id');
  const eventSource = req.get('ce-source');

  if (!eventType) {
    logger.warn('Received CloudEvent without ce-type header');
    return res.status(400).json({ error: 'Missing ce-type header' });
  }

  const payload = req.body || {};

  logger.info({ eventType, eventId, eventSource, payload }, 'CloudEvent received');

  try {
    const result = await processEvent(eventType, payload);

    if (!result) {
      logger.info({ eventType, eventId }, 'End of transaction chain');
      return res.status(204).send();
    }

    const ceId = uuidv4();
    const ceSource = `${config.eventSource}/${result.nextSource}`;

    logger.info({
      nextType: result.nextType,
      ceId,
      ceSource
    }, 'Emitting next CloudEvent');

    return res
      .status(200)
      .set('ce-specversion', '1.0')
      .set('ce-type', result.nextType)
      .set('ce-source', ceSource)
      .set('ce-id', ceId)
      .set('Content-Type', 'application/json')
      .json(result.payload);
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Failed to process CloudEvent');
    return res.status(500).json({ error: error.message });
  }
});

const server = app.listen(config.port, config.host, () => {
  logger.info({ port: config.port, host: config.host }, 'Transaction chain service running');
});

async function shutdown(signal) {
  logger.info({ signal }, 'Shutting down');
  server.close(() => {
    logger.info('HTTP server closed');
  });
  await disconnectKafka();
  process.exit(0);
}

['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => {
    shutdown(signal).catch((error) => {
      logger.error({ error: error.message }, 'Error during shutdown');
      process.exit(1);
    });
  });
});

module.exports = app;
