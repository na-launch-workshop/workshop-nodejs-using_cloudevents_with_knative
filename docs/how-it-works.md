## ⚙️ Behind the Scenes

### 1. 🟦 Node.js CloudEvent Handler
- The service is a single Express app (`src/server.js`).
- It inspects `ce-type`, `ce-id`, and payload from the incoming request.
- Business logic lives in `src/transaction-chain.js`, returning the next `ce-type` + payload.
- Responses are HTTP 200 + CloudEvent headers so Knative can forward the chain.

### 2. ☁️ Knative Eventing
- A **Broker** (`k8s/broker.yaml`) receives all events.
- Four **Triggers** (`k8s/triggers.yaml`) filter on `ce-type` values.
- Every time the service replies with a new CloudEvent, Knative routes it to the same service using the matching trigger.
- This forms a loop where the service processes one step per delivery.

### 3. 🔁 Event Chaining
- Step 1 (`defaultChain`) → responds with `fraudCheck`
- Step 2 (`fraudCheck`) → responds with `annotated`
- Step 3 (`annotated`) → responds with `lastChainLink`
- Step 4 (`lastChainLink`) → publishes to Kafka and ends the HTTP response with `204`

There are no in-memory calls between steps. Each response becomes the next request via Knative.

### 4. 🎷 Kafka Integration
- `src/kafka.js` uses **kafkajs** to lazily create a producer.
- Topic name defaults to `<username>--transactions-completed` (override with `KAFKA_TOPIC_COMPLETED`).
- Set `KAFKA_ENABLED=false` for local development without Kafka.
- JSON payloads are published when the chain reaches the settlement step.

### 5. 🚀 Deployment on OpenShift
- `deploy.sh` builds the container with `podman`/`docker`, pushes it to the internal registry, and applies the Knative manifests.
- `k8s/service.yaml` defines the Knative Service (scales to zero when idle).
- The `curler` pod is included to help you craft CloudEvents inside the cluster.

## 🌟 Key Features
- ✅ Pure CloudEvents workflow—no Funqy or framework-specific annotations
- ✅ Stateless Node.js handlers that rely on Knative for routing and scaling
- ✅ Kafka integration for event persistence and downstream consumers
- ✅ Configurable via environment variables and ready for OpenShift Serverless
