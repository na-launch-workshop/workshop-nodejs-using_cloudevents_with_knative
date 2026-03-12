# 🚀 **Module: Building a CloudEvents Transaction Chain with Node.js**

**Technology Stack:**

- Node.js + Express
- CloudEvents (CNCF)
- Knative Eventing
- Red Hat OpenShift Serverless
- Apache Kafka

---

## 🎯 **Scenario**

Company A is sending a payment transaction (credit card) to ACME. ACME has 4 business steps that must succeed for the transaction to be considered complete.

1. Customer Profile Service — confirm the customer is active
2. Fraud Detection Service — ensure the transaction is legitimate
3. Payment Processor — debit the account and reach out to the card network
4. Settlement Services — ledger the transaction and notify the customer

The existing workflow engine is stateful and centralized. In this module you will replace it with a stateless, event-driven architecture powered by CloudEvents on Knative.

---

## 🧩 **Challenge**

- [ ] Receive CloudEvents in a Node.js service and route based on the `ce-type` header
- [ ] Emit new CloudEvents that drive the remainder of the workflow through Knative Triggers
- [ ] Enrich the transaction payload at every hop (status + message fields)
- [ ] Publish the final CloudEvent payload to Kafka for downstream consumers

---

## 🔄 Transaction Flow Breakdown

### **1. 🔹 Validate Customer (`defaultChain`)**
- Triggered by an external Knative CloudEvent (`defaultChain`), e.g., from a curl call.
- Mocks a call to a Customer Profile Service (verifies customer account is active).
- Marks transaction as **VALIDATED**.
- Returns a CloudEvent of type `fraudCheck`.

###### ✨ Example: Creating a CloudEvent | Default Chain

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

---

### **2. 🔸 Fraud Check (fraudCheck)**
- Triggered by the `fraudCheck` function (annotation-based mapping).
- Mocks a Fraud Detection System (rules + ML).
- Business rule:
  - If amount > 10,000 → **FLAGGED** for manual review.
  - Otherwise → **CLEARED**.
  - Emits a CloudEvent of type `annotated` to trigger the processPayment step.

###### ✨ Example: Creating a CloudEvent | Fraud Check

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

---

### **3. 🔹 Payment Processing (processPayment)**
- Triggered by the `processPayment` function (annotation-based mapping).
- Mocks:
  - Core Banking API (debit customer account).
  - Payment Gateway (Visa/MasterCard).
- Marks transaction as **PROCESSED**.
- Returns a CloudEvent of type `lastChainLink`.

###### ✨ Example: Creating a CloudEvent | Payment Processing

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

---

### **4. 🔸 Settlement (`lastChainLink`)**
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

## ✅ **Key Takeaways**

- Event choreography is handled entirely through CloudEvents headers and Knative Triggers
- Each Node.js handler is stateless—Knative scales it up and down based on demand
- Kafka captures the final transaction state for further analytics or notifications
