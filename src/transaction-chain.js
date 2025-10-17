const { publishTransaction } = require('./kafka');
const logger = require('./logger');

function cloneTransaction(input) {
  return {
    transactionId: input.transactionId,
    customerId: input.customerId,
    amount: Number(input.amount),
    currency: input.currency,
    status: input.status,
    message: input.message
  };
}

function assertRequiredFields(tx) {
  const missing = [];
  if (!tx.transactionId) missing.push('transactionId');
  if (!tx.customerId) missing.push('customerId');
  if (Number.isNaN(tx.amount)) missing.push('amount');
  if (!tx.currency) missing.push('currency');

  if (missing.length > 0) {
    throw new Error(`Missing required transaction fields: ${missing.join(', ')}`);
  }
}

function handleValidation(input) {
  const tx = cloneTransaction(input);
  assertRequiredFields(tx);
  logger.info({ transactionId: tx.transactionId }, 'Validation step');
  logger.info('Connecting to Customer Profile Service... customer account is active');
  tx.status = 'VALIDATED';
  tx.message = 'Transaction validated successfully';
  return tx;
}

function handleFraudCheck(input) {
  const tx = cloneTransaction(input);
  assertRequiredFields(tx);
  logger.info({ transactionId: tx.transactionId }, 'Fraud check step');
  logger.info('Connecting to Fraud Detection System... evaluating rules');

  if (tx.amount > 10000) {
    tx.status = 'FLAGGED';
    tx.message = 'Transaction flagged for manual review';
  } else {
    tx.status = 'CLEARED';
    tx.message = 'Transaction cleared by fraud detection';
  }
  return tx;
}

function handleProcessPayment(input) {
  const tx = cloneTransaction(input);
  assertRequiredFields(tx);
  logger.info({ transactionId: tx.transactionId }, 'Payment processing step');
  logger.info('Connecting to Core Banking API... debit request submitted');
  logger.info('Connecting to Payment Gateway... payment confirmed');
  tx.status = 'PROCESSED';
  tx.message = 'Payment successfully processed';
  return tx;
}

async function handleSettlement(input) {
  const tx = cloneTransaction(input);
  assertRequiredFields(tx);
  logger.info({ transactionId: tx.transactionId }, 'Settlement step');
  logger.info('Connecting to Ledger Service... recording transaction');
  logger.info('Connecting to Notification Service... notifying customer');
  await publishTransaction(tx);
}

async function processEvent(eventType, payload) {
  switch (eventType) {
    case 'defaultChain': {
      const tx = handleValidation(payload);
      return { nextType: 'fraudCheck', nextSource: 'validation', payload: tx };
    }
    case 'fraudCheck': {
      const tx = handleFraudCheck(payload);
      return { nextType: 'annotated', nextSource: 'fraud', payload: tx };
    }
    case 'annotated': {
      const tx = handleProcessPayment(payload);
      return { nextType: 'lastChainLink', nextSource: 'payments', payload: tx };
    }
    case 'lastChainLink': {
      await handleSettlement(payload);
      return null;
    }
    default:
      throw new Error(`Unsupported CloudEvent type: ${eventType}`);
  }
}

module.exports = {
  processEvent
};
