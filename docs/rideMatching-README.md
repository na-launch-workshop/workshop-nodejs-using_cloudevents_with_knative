# 🚗 Ride Matching Workflow

Simulate a ride-hailing platform by chaining CloudEvents with the Node.js service.

## Sequence Diagram (ASCII)
```
ce-type = ride.requested ─▶ findDriver()
                              └ emits ce-type = ride.matched
                                      ▼
confirmPickup() ───────────── emits ce-type = ride.pickup-confirmed
                                      ▼
monitorTrip() ─────────────── emits ce-type = ride.in-progress
                                      ▼
completeRide() ────────────── emits ce-type = ride.completed
                                      ▼
settleFare() ──────────────── publishes to Kafka, ends chain
```

## Implementation Clues
- Extend `processEvent` with the ride-specific `ce-type` values.
- Keep each handler idempotent—Knative may redeliver events on failure.
- Store pricing breakdown in Kafka for billing or loyalty systems.

## Kickoff Event Example
```bash
NS=$(oc project -q)

oc exec -it curler -n "$NS" -- curl -v \
  "http://broker-ingress.knative-eventing.svc.cluster.local/${NS}/default" \
  -H "Ce-Id: ride-555" \
  -H "Ce-Specversion: 1.0" \
  -H "Ce-Type: ride.requested" \
  -H "Ce-Source: mobile-app" \
  -H "Content-Type: application/json" \
  -d '{"rideId":"R-555","passengerId":"P-201","pickup":"SFO","dropoff":"SJC"}'
```

Monitor the Knative service logs to watch each event hop across the workflow.
