const DEFAULT_KAFKA_BROKERS = 'kafka.workshop-kafka.svc.cluster.local:9092';

function parseBrokers(raw) {
  if (!raw) {
    return DEFAULT_KAFKA_BROKERS.split(',');
  }
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

module.exports = {
  port: Number.parseInt(process.env.PORT || '8080', 10),
  host: process.env.HOST || '0.0.0.0',
  logLevel: process.env.LOG_LEVEL || 'info',
  eventSource: process.env.EVENT_SOURCE || 'urn:workshop:transaction-chain:nodejs',
  kafka: {
    enabled: process.env.KAFKA_ENABLED !== 'false',
    brokers: parseBrokers(process.env.KAFKA_BOOTSTRAP_SERVERS),
    clientId: process.env.KAFKA_CLIENT_ID || 'transaction-chain-service',
    topic: process.env.KAFKA_TOPIC_COMPLETED || '<username>--transactions-completed'
  }
};
