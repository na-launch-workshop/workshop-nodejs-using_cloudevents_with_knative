# 🏠 Mortgage Application Workflow

Illustrate multi-step mortgage approval with CloudEvents and Node.js.

## Chain Overview
```
ce-type = mortgage.started ─▶ collectApplication()
                                └ emits ce-type = mortgage.submitted
                                        ▼
runCreditCheck() ───────────── emits ce-type = mortgage.credit-assessed
                                        ▼
underwriteRisk() ───────────── emits ce-type = mortgage.underwritten
                                        ▼
finalApproval() ────────────── emits ce-type = mortgage.approved
                                        ▼
fundLoan() ─────────────────── publishes to Kafka, terminates chain
```

## Guidance
- Maintain applicant data, risk score, and decision notes within the payload.
- Consider storing a `workflowStep` field for observability dashboards.
- Kafka topic `mortgages-funded` can alert downstream servicing systems.

## Sample Starter Event
```bash
NS=$(oc project -q)

oc exec -it curler -n "$NS" -- curl -v \
  "http://broker-ingress.knative-eventing.svc.cluster.local/${NS}/default" \
  -H "Ce-Id: mort-300" \
  -H "Ce-Specversion: 1.0" \
  -H "Ce-Type: mortgage.started" \
  -H "Ce-Source: loan-portal" \
  -H "Content-Type: application/json" \
  -d '{"applicationId":"M-300","customerId":"C-88","propertyValue":450000,"loanAmount":360000}'
```

Extend or branch the flow by returning alternative `ce-type` values based on underwriting decisions.
