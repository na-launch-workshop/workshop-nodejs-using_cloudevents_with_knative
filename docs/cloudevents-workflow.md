# Module 4: CloudEvents Workflow Examples

Welcome to the **CloudEvents workflow gallery** for this workshop. These scenarios illustrate how a plain Node.js service plus Knative Eventing can orchestrate real business flows. Every hop is triggered by the `ce-type` header—no framework-specific annotations required.

Use these examples to extend the reference application, or to craft an event-driven pipeline for your own domain.

---

## Available Workflows

- [✈️ Baggage Handling (Airline)](./baggage-README.md)  
  Tag, scan, load, and deliver luggage with CloudEvents.

- [👩‍💻 Employee Onboarding](./employeeOnoboarding-README.md)  
  Collect documents, provision access, and schedule orientation.

- [📦 Package Delivery](./packageDelivery-README.md)  
  Coordinate warehouse prep, courier assignment, and confirmation.

- [🚗 Ride Matching](./rideMatching-README.md)  
  Pair passengers with drivers, track the trip, and settle the fare.

- [🛒 Supermarket Layaway](./supermarketLayaway-README.md)  
  Reserve items, accept installments, and release inventory.

- [🏥 Insurance Claim](./insuranceClaim-README.md)  
  Validate, assess, approve, and pay insurance claims.

- [🏠 Mortgage Application](./mortageApplication-README.md)  
  Gather borrower data, run credit, underwrite, and close the loan.

---

## How to Use the Examples

Each README provides:

- **ASCII sequence diagram** – visualises how `ce-type` values move through the chain
- **Step descriptions** – what each Node.js handler does
- **curl snippets** – Fire CloudEvents into the broker to walk the flow
- **Trigger hints** – Which `ce-type` value each Knative Trigger should watch for

Pick a scenario, update the handler logic or trigger configuration, and send a CloudEvent to start the chain.
