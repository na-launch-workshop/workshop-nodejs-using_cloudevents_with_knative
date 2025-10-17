const { Kafka, logLevel } = require('kafkajs');
const config = require('./config');
const logger = require('./logger');

let kafkaProducer;

function resolveLogLevel(level) {
  switch (level) {
    case 'trace':
      return logLevel.TRACE;
    case 'debug':
      return logLevel.DEBUG;
    case 'warn':
      return logLevel.WARN;
    case 'error':
      return logLevel.ERROR;
    case 'fatal':
      return logLevel.NOTHING;
    default:
      return logLevel.INFO;
  }
}

async function getProducer() {
  if (!config.kafka.enabled) {
    logger.info('Kafka publishing disabled via KAFKA_ENABLED=false');
    return null;
  }

  if (kafkaProducer) {
    return kafkaProducer;
  }

  const kafka = new Kafka({
    clientId: config.kafka.clientId,
    brokers: config.kafka.brokers,
    logLevel: resolveLogLevel(config.logLevel)
  });

  kafkaProducer = kafka.producer();
  await kafkaProducer.connect();
  logger.info({ brokers: config.kafka.brokers, topic: config.kafka.topic }, 'Connected to Kafka');
  return kafkaProducer;
}

async function publishTransaction(transaction) {
  const producer = await getProducer();
  if (!producer) {
    logger.info('Skipping Kafka publish because Kafka is disabled');
    return;
  }

  const payload = JSON.stringify(transaction);
  await producer.send({
    topic: config.kafka.topic,
    messages: [{ value: payload }]
  });
  logger.info({ topic: config.kafka.topic, transactionId: transaction.transactionId }, 'Published transaction to Kafka');
}

async function disconnect() {
  if (!kafkaProducer) {
    return;
  }
  await kafkaProducer.disconnect();
  logger.info('Kafka producer disconnected');
}

module.exports = {
  publishTransaction,
  disconnect
};
