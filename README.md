# 🚀 Module 4: Building a CloudEvents Transaction Chain with Node.js

Technology Stack:

- Node.js + Express
- CloudEvents (CNCF)
- Knative Eventing
- Red Hat OpenShift Serverless
- Apache Kafka

---

## 🎯 Scenario

Company A is sending a payment transaction (credit card) to ACME. ACME has 4 business steps that must succeed for the transaction to be considered complete.

1. Customer Profile Service — confirm the customer is active
2. Fraud Detection Service — ensure the transaction is legitimate
3. Payment Processor — debit the account and reach out to the card network
4. Settlement Services — ledger the transaction and notify the customer

The existing workflow engine is stateful and centralized. In this module you will replace it with a stateless, event-driven architecture powered by CloudEvents on Knative.

---

## 🧩 Challenge Checklist

- Receive CloudEvents in a Node.js service and route based on the `ce-type` header
- Emit new CloudEvents that drive the remainder of the workflow through Knative Triggers
- Enrich the transaction payload at every hop (status + message fields)
- Publish the final CloudEvent payload to Kafka for downstream consumers

---

## 🔄 Transaction Flow

### 1. 🔹 Validate Customer (`defaultChain`)
- Triggered by an external CloudEvent (`ce-type: defaultChain`)
- Simulates a call to a Customer Profile Service
- Marks the transaction as **VALIDATED**
- Responds with a new CloudEvent of type `fraudCheck`

```bash
NS=$(oc project -q)

oc exec -it curler -n "$NS" -- curl -v \
  "http://broker-ingress.knative-eventing.svc.cluster.local/${NS}/default" \
  -H "Ce-Id: txn-001" \
  -H "Ce-Specversion: 1.0" \
  -H "Ce-Type: defaultChain" \
  -H "Ce-Source: bash" \
  -H "Content-Type: application/json" \
  -d '{"transactionId":"txn-1001","customerId":"42","amount":12500,"currency":"JPY"}'
```

### 2. 🔸 Fraud Check (`fraudCheck`)
- Triggered by a Knative Trigger watching for `ce-type: fraudCheck`
- Simulates a machine-learning powered fraud engine
- Flags transactions above 10,000 for manual review
- Responds with a CloudEvent of type `annotated`

```bash
NS=$(oc project -q)

oc exec -it curler -n "$NS" -- curl -v \
  "http://broker-ingress.knative-eventing.svc.cluster.local/${NS}/default" \
  -H "Ce-Id: txn-002" \
  -H "Ce-Specversion: 1.0" \
  -H "Ce-Type: fraudCheck" \
  -H "Ce-Source: bash" \
  -H "Content-Type: application/json" \
  -d '{"transactionId":"txn-1002","customerId":"57","amount":5000,"currency":"USD"}'
```

### 3. 🔹 Payment Processing (`annotated`)
- Triggered when the previous step emits `ce-type: annotated`
- Simulates calls to the core banking system and a card network
- Marks the transaction as **PROCESSED**
- Responds with a CloudEvent of type `lastChainLink`

```bash
NS=$(oc project -q)

oc exec -it curler -n "$NS" -- curl -v \
  "http://broker-ingress.knative-eventing.svc.cluster.local/${NS}/default" \
  -H "Ce-Id: txn-003" \
  -H "Ce-Specversion: 1.0" \
  -H "Ce-Type: annotated" \
  -H "Ce-Source: bash" \
  -H "Content-Type: application/json" \
  -d '{"transactionId":"txn-1003","customerId":"99","amount":2000,"currency":"EUR"}'
```

### 4. 🔸 Settlement (`lastChainLink`)
- Triggered by `ce-type: lastChainLink`
- Simulates ledger + notification calls
- Publishes the enriched transaction to Kafka (`<username>--transactions-completed`)
- Terminates the CloudEvent chain with a `204 No Content` response

```bash
NS=$(oc project -q)

oc exec -it curler -n "$NS" -- curl -v \
  "http://broker-ingress.knative-eventing.svc.cluster.local/${NS}/default" \
  -H "Ce-Id: txn-004" \
  -H "Ce-Specversion: 1.0" \
  -H "Ce-Type: lastChainLink" \
  -H "Ce-Source: bash" \
  -H "Content-Type: application/json" \
  -d '{"transactionId":"txn-1004","customerId":"88","amount":7500,"currency":"GBP","status":"PROCESSED","message":"Payment successfully processed"}'
```

---

## ✅ Key Takeaways

- Event choreography is handled entirely through CloudEvents headers and Knative Triggers
- Each Node.js handler is stateless—Knative scales it up and down based on demand
- Kafka captures the final transaction state for further analytics or notifications
