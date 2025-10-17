# 📦 Package Delivery Workflow

Demonstrate end-to-end parcel delivery using CloudEvents and Knative routing.

## Event Sequence
```
ce-type = package.created ─▶ prepareShipment()
                               └ emits ce-type = package.prepared
                                       ▼
assignCourier() ──────────────── emits ce-type = package.assigned
                                       ▼
trackDelivery() ──────────────── emits ce-type = package.in-transit
                                       ▼
confirmReceipt() ─────────────── emits ce-type = package.delivered
                                       ▼
archiveAndNotify() ───────────── publishes to Kafka, returns 204
```

## Design Notes
- Map each arrow to a Knative Trigger watching the corresponding `ce-type`.
- Update the parcel payload with checkpoint data (`hub`, `eta`, `signature`).
- The final handler can publish to Kafka topic `packages-delivered` for analytics.

## Starter Event
```bash
NS=$(oc project -q)

oc exec -it curler -n "$NS" -- curl -v \
  "http://broker-ingress.knative-eventing.svc.cluster.local/${NS}/default" \
  -H "Ce-Id: pkg-101" \
  -H "Ce-Specversion: 1.0" \
  -H "Ce-Type: package.created" \
  -H "Ce-Source: fulfillment" \
  -H "Content-Type: application/json" \
  -d '{"packageId":"PKG-1001","customerId":"C-77","destination":"SYD","weight":3.5}'
```

Modify the Node.js workflow or create dedicated route handlers. The orchestration remains the same: return a CloudEvent from each step.
