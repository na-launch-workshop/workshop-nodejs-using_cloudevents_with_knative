# ✈️ Baggage Handler Workflow

This workflow shows how a **Node.js CloudEvents service** plus **Knative Triggers** can orchestrate airline baggage handling.

## Diagram
```
┌──────────────────────────────┐
│ CloudEvent arrives           │
│ ce-type = checkInBaggage     │
└──────────┬───────────────────┘
           │ delivered via Knative Trigger
           ▼
┌──────────────────────────────┐
│ checkInBaggage()             │
│ - Tag + scan bag             │
│ - Assign destination         │
└──────────┬───────────────────┘
           │ responds with
           ▼
┌───────────────────────────────────────────┐
│ CloudEvent response                        │
│ ce-type = checkInBaggage.output           │
│ ce-source = baggage/check-in              │
└──────────┬────────────────────────────────┘
           ▼
┌──────────────────────────────┐
│ securityScan()               │
│ - X-ray scan                 │
│ - Flag suspicious items      │
└──────────┬───────────────────┘
           │ responds with
           ▼
┌───────────────────────────────────────────┐
│ CloudEvent response                        │
│ ce-type = scanned                         │
│ ce-source = baggage/security              │
└──────────┬────────────────────────────────┘
           │ routed by Trigger (filter ce-type=scanned)
           ▼
┌──────────────────────────────┐
│ loadToAircraft()             │
│ - Sort bags to correct plane │
│ - Mark "Loaded"              │
└──────────┬───────────────────┘
           │ responds with
           ▼
┌───────────────────────────────────────────┐
│ CloudEvent response                        │
│ ce-type = loaded                          │
│ ce-source = baggage/load                  │
└──────────┬────────────────────────────────┘
           │ final trigger filters ce-type=loaded
           ▼
┌──────────────────────────────┐
│ finalDelivery()              │
│ - Update "Bag onboard"       │
│ - Notify passenger app       │
└──────────────────────────────┘
```

## Event Flow Highlights
- Every handler is a stateless function inside the Node.js service.
- Each response sets the next `ce-type`, allowing Knative Triggers to route the event.
- The chain terminates when the final handler returns `204` (no response event).

## Sample CloudEvent

```bash
NS=$(oc project -q)

oc exec -it curler -n "$NS" -- curl -v \
  "http://broker-ingress.knative-eventing.svc.cluster.local/${NS}/default" \
  -H "Ce-Id: bag-001" \
  -H "Ce-Specversion: 1.0" \
  -H "Ce-Type: checkInBaggage" \
  -H "Ce-Source: baggage/check-in" \
  -H "Content-Type: application/json" \
  -d '{"bagId":"BG-221","flight":"RH404","destination":"JFK"}'
```

Update the Node.js handlers to enrich the payload (status, location, timestamps) at each step.
