# 👩‍💻 Employee Onboarding Workflow

Model the onboarding process as a sequence of CloudEvents handled by the Node.js transaction service.

## Flow Snapshot
```
ce-type = onboarding.start ──▶ collectDocuments()
                               └─ emits ce-type = onboarding.docs
                                     ▼
onboardProvisioning() ── emits ──▶ ce-type = onboarding.accounts
                                     ▼
scheduleOrientation() ── emits ──▶ ce-type = onboarding.schedule
                                     ▼
welcomeKit() ──▶ publishes to Kafka and ends chain
```

## Tips
- Use Knative Triggers to map each `ce-type` (`onboarding.start`, `onboarding.docs`, `onboarding.accounts`, ...).
- Enrich the payload with `status` such as `DOCUMENTS_COLLECTED`, `ACCOUNTS_READY`, etc.
- Final step can notify Kafka topic `employees-onboarded`.

## Sample Kickoff Event
```bash
NS=$(oc project -q)

oc exec -it curler -n "$NS" -- curl -v \
  "http://broker-ingress.knative-eventing.svc.cluster.local/${NS}/default" \
  -H "Ce-Id: emp-100" \
  -H "Ce-Specversion: 1.0" \
  -H "Ce-Type: onboarding.start" \
  -H "Ce-Source: hr-portal" \
  -H "Content-Type: application/json" \
  -d '{"employeeId":"E-90210","name":"Alex Doe","role":"Platform Engineer"}'
```

Extend `transaction-chain.js` with additional `case` statements or create a new module—Knative just needs matching `ce-type` values.
