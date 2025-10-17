# 🏥 Insurance Claim Workflow

Transform a traditional claims pipeline into an event-driven sequence using CloudEvents.

## Event Path
```
ce-type = claim.submitted ─▶ validateClaim()
                               └ emits ce-type = claim.validated
                                       ▼
assessDamage() ────────────── emits ce-type = claim.assessed
                                       ▼
approveOrReject() ─────────── emits ce-type = claim.decision
                                       ▼
payout() ──────────────────── emits ce-type = claim.settled
                                       ▼
notifyCustomer() ──────────── publishes to Kafka, ends chain
```

## Ideas
- Keep a running audit trail in the payload (`history` array).
- Use `status` values like `VALIDATED`, `ASSESSED`, `APPROVED`, `REJECTED`.
- Kafka topic `claims-completed` can feed analytics or notifications.

## Seed Event
```bash
NS=$(oc project -q)

oc exec -it curler -n "$NS" -- curl -v \
  "http://broker-ingress.knative-eventing.svc.cluster.local/${NS}/default" \
  -H "Ce-Id: claim-900" \
  -H "Ce-Specversion: 1.0" \
  -H "Ce-Type: claim.submitted" \
  -H "Ce-Source: customer-portal" \
  -H "Content-Type: application/json" \
  -d '{"claimId":"CL-900","policyId":"POL-1","amount":4000,"incident":"Hail damage"}'
```

Handle retries gracefully—if a handler fails, Knative will redeliver the event.
