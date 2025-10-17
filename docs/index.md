# 🚀 Module 4: Building a Serverless Transaction Chain with Node.js

Technology Stack:

- Node.js + Express
- CloudEvents 1.0
- Knative Eventing on OpenShift Serverless
- Apache Kafka

---

## 🎯 Scenario

Company A is forwarding credit card transactions to ACME. Each transaction must pass four stateless services before it is considered settled.

1. **Validate Customer** – confirm the account is active
2. **Fraud Detection** – apply rules/ML to decide if it is safe
3. **Payment Processing** – debit the account and confirm with the network
4. **Settlement & Notification** – persist the outcome and alert the customer

We replace a monolithic, stateful workflow engine with an event-driven pipeline. CloudEvents headers (`ce-type`) drive the entire orchestration through Knative Triggers.

---

## 🧩 Challenge

- Handle incoming CloudEvents in Node.js, using only headers and payload
- Emit new CloudEvents with updated business state so the broker can route them
- Keep services stateless; rely on Knative scaling instead of storing context
- Send the final transaction state to Kafka for downstream consumers

---

## 🔄 Event Chain at a Glance

| Step | Trigger (`ce-type`) | Business Action | Outgoing `ce-type` |
| ---- | ------------------- | ----------------| ------------------ |
| 1 | `defaultChain` | Validate customer profile | `fraudCheck` |
| 2 | `fraudCheck` | Flag/clear transaction | `annotated` |
| 3 | `annotated` | Process payment | `lastChainLink` |
| 4 | `lastChainLink` | Settle + notify + publish to Kafka | _terminates chain_ |

Each HTTP handler enriches the transaction payload (`status`, `message`) and returns a new CloudEvent to the Knative Broker. The final step responds with `204` so Knative stops forwarding.

---

## 📦 Sample CloudEvents

Use the provided `curler` pod to post CloudEvents into the `default` broker. Replace `<namespace>` with your OpenShift project name.

```bash
NS=$(oc project -q)

oc exec -it curler -n "$NS" -- curl -v \
  "http://broker-ingress.knative-eventing.svc.cluster.local/${NS}/default" \
  -H "Ce-Id: txn-001" \
  -H "Ce-Specversion: 1.0" \
  -H "Ce-Type: defaultChain" \
  -H "Ce-Source: docs" \
  -H "Content-Type: application/json" \
  -d '{"transactionId":"txn-42","customerId":"1001","amount":2500,"currency":"USD"}'
```

---

## ✅ What You Will Learn

- Designing CloudEvent-driven chains without function-specific frameworks
- Mapping Knative Triggers to `ce-type` values
- Managing Kafka producers in a stateless HTTP service
- Observing event flows via `oc logs` and Knative broker traces
