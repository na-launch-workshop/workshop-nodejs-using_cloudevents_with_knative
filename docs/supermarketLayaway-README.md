# 🛒 Supermarket Layaway Workflow

Layaway programs are a perfect fit for CloudEvents-driven processes: each payment moves the reservation forward.

## Workflow
```
ce-type = layaway.start ─▶ reserveItems()
                             └ emits ce-type = layaway.reserved
                                     ▼
collectDeposit() ─────────── emits ce-type = layaway.deposit
                                     ▼
collectInstallments() ────── emits ce-type = layaway.installment
                                     ▼
releaseInventory() ───────── emits ce-type = layaway.ready-for-pickup
                                     ▼
closeLayaway() ───────────── publishes to Kafka, returns 204
```

## Notes
- Use Knative Triggers to fan events back into the same service.
- Track outstanding balance, payments, and pickup deadlines inside the payload.
- Publish to Kafka topic `layaway-completed` for downstream ERP updates.

## Sample Event
```bash
NS=$(oc project -q)

oc exec -it curler -n "$NS" -- curl -v \
  "http://broker-ingress.knative-eventing.svc.cluster.local/${NS}/default" \
  -H "Ce-Id: lay-001" \
  -H "Ce-Specversion: 1.0" \
  -H "Ce-Type: layaway.start" \
  -H "Ce-Source: pos-system" \
  -H "Content-Type: application/json" \
  -d '{"orderId":"L-445","customerId":"C-22","items":[{"sku":"TV-55","price":799}]}'
```

Customize the Node.js handlers to update payment schedules and enforce time limits.
