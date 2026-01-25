# **Governance Guidelines Library**

## **1\. Enterprise Development Guidelines**

Document ID: DEV-GL-01  
Target Audience: Developers, Tech Leads  
Purpose: To provide specific "How-To" instructions for implementing the Enterprise Principles.

### **1\. API Design Guidelines (REST)**

*(Implements Policy 1.1: Contract-First)*

1.1 Resource Naming  
Use plural nouns for resources, never verbs.

* ✅ GET /customers  
* ❌ GET /getAllCustomers  
* ✅ POST /orders/{id}/cancel (Use verbs only for remote procedure calls/actions that aren't CRUD)

1.2 Versioning  
Versioning must be in the URL Path, not headers.

* ✅ /api/v1/products  
* ❌ /api/products?v=1

1.3 Filtering & Pagination  
Large collections must support pagination.

* **Standard:** ?limit=20\&offset=0 or ?page=1\&size=20.

1.4 Status Codes  
Don't just return 200 for everything.

* **201 Created:** Result of a successful POST.  
* **202 Accepted:** Request received for background processing (Async).  
* **400 Bad Request:** Validation error (Client fault).  
* **401 Unauthorized:** Missing/Invalid Token.  
* **403 Forbidden:** Valid Token, but not allowed to access this specific resource.

### **2\. Event Messaging Guidelines**

*(Implements Policy 1.2: Async Default)*

2.1 Topic Naming Convention  
Use dot-notation: domain.entity.event\_type.

* *Example:* logistics.shipment.created, billing.invoice.paid.

2.2 Payload Structure  
Every event must include a standard "Envelope" header.  
{  
    "event\_id": "uuid-1234",  
    "event\_type": "billing.invoice.paid",  
    "timestamp": "2025-10-01T12:00:00Z",  
    "source": "service-billing",  
    "trace\_id": "trace-abc-999",  // Crucial for observability  
    "data": { ...business logic... }  
}

2.3 Consumer Idempotency  
Consumers must assume they might receive the same message twice. Use event\_id to deduplicate processing.

### **3\. Caching & State Guidelines**

*(Implements Policy 1.3: Statelessness)*

3.1 Key Names  
Use colon-separated namespaces to prevent collisions in shared Redis.

* *Format:* service:entity:id \-\> inventory:product:105.

3.2 Time-To-Live (TTL)  
Every cache key must have an expiration (TTL). Never set keys to persist forever unless explicitly architected as a permanent store.  
**3.3 Cache-Aside Pattern**

1. Check Cache.  
2. If Miss \-\> Query DB.  
3. Populate Cache (with TTL).  
4. Return Data.

## **2\. Enterprise Observability Guidelines**

Document ID: OPS-GL-02  
Purpose: To ensure all services are observable by default, enabling rapid debugging and automated recovery.

### **1\. Logs: Events & Contextual Data**

*Logs tell the story of "Why" something happened.*

1.1 Strict Log Level Definitions  
Developers often misuse log levels (e.g., logging errors as warnings). You must adhere to this matrix:

| Level | Definition | When to use | Alerting Behavior |
| :---- | :---- | :---- | :---- |
| **FATAL** | System is unusable. | Application cannot start; Database is unreachable. | Wake up the On-Call Engineer (PagerDuty). |
| **ERROR** | A specific request failed, but the system is running. | NPE (NullPointer), 5xx API response, Transaction rollback. | Create a Ticket (Jira). Review next morning. |
| **WARN** | Something unexpected happened, but auto-recovered. | 4xx API response, Retry triggered, Deprecated API usage. | No alert. Used for trend analysis. |
| **INFO** | Key business or lifecycle events. | "Order Placed," "User Logged In," "Job Started." | No alert. Used for Audit/Analytics. |
| **DEBUG** | Granular developer details. | Payload content, variable state, loop steps. | DISABLED in Production. (Enable dynamically for troubleshooting). |

1.2 The "Structured Log" Standard  
Do not log text strings like Log.info("User " \+ id \+ " failed"). You must use structured logging libraries (e.g., Zap, Logback, Serilog).  
*Mandatory JSON Schema:*

{  
  "timestamp": "2023-10-25T10:00:00Z",  
  "level": "ERROR",  
  "service": "payment-service",  
  "trace\_id": "a1b2c3d4",       // Crucial for correlation  
  "span\_id": "99887766",  
  "message": "Payment gateway timeout",  
  "context": {                  // Put dynamic data here  
    "user\_id": "u-12345",  
    "order\_id": "o-98765",  
    "gateway": "stripe",  
    "attempt": 3  
  },  
  "error": {  
    "type": "TimeoutException",  
    "stack": "..."              // Stack trace goes here  
  }  
}

### **2\. Metrics: Performance & Health**

*Metrics tell the story of "What" is happening right now.*

2.1 Metric Cardinality (High Risk Warning)  
Rule: Never use high-cardinality data (values that change infinitely) as Metric Tags/Labels.

* ✅ **Good Tag:** status\_code="500", region="us-east-1", payment\_method="visa" (Limited distinct values).  
* ❌ **Bad Tag:** user\_id="u-12345", order\_id="o-98765", url="/api/users/12345".  
* *Reason:* High cardinality explodes the metrics database size and crashes the monitoring system.

2.2 Application Runtime Metrics  
Beyond the "Golden Signals," every service must export runtime internals:

* **JVM/Node/Go Runtime:** Garbage Collection (GC) pause times, Heap memory usage, Goroutine/Thread counts.  
* **Connection Pools:** Database pool utilization (Active vs. Idle connections). If this hits 100%, your app freezes.

### **3\. Traces: Distributed Context**

*Traces tell the story of "Where" the time went.*

3.1 Trace Context Propagation (The "Glue")  
It is not enough to just generate a Trace ID. You must propagate it to the next service.

* **Standard:** Use W3C Trace Context headers (traceparent, tracestate).  
* **Requirement:** If Service A calls Service B (HTTP) or publishes to Kafka, it must inject these headers. Service B must extract them and use them as the parent span.

3.2 Sampling Strategy  
Tracing every single request in high-volume systems is too expensive.

* **Dev/QA:** 100% Sampling (Trace everything).  
* **Production:** Use Head-Based Sampling (e.g., sample 1% or 5% of traffic).  
* **Exception:** Always force-sample requests that result in an ERROR, if your framework supports "Tail-Based Sampling."

### **4\. Health Checks (Kubernetes Mandate)**

Your application must tell the platform if it is alive. Every service must expose two distinct HTTP endpoints:

**4.1 Liveness Probe (GET /health/live)**

* **Question:** "Did the process crash or deadlock?"  
* **Logic:** Return 200 OK if the app is running. Do NOT check database connections here.  
* **Action if Fail:** Kubernetes will Restart the pod.

**4.2 Readiness Probe (GET /health/ready)**

* **Question:** "Can I handle traffic right now?"  
* **Logic:** Check downstream dependencies (Database, Cache). Return 200 OK only if connections are healthy.  
* **Action if Fail:** Kubernetes will Stop sending traffic to this pod (remove from Load Balancer) until it recovers.

### **5\. Alerting Philosophy**

*Alerts are for Action, not Information.*

5.1 Symptom-Based Alerting  
Alert on the User Pain, not the technical cause.

* ❌ **Bad Alert:** "CPU is at 90%." (Who cares? Maybe it's efficient processing).  
* ✅ **Good Alert:** "API Latency p99 \> 2 seconds" or "Error Rate \> 1%". (The user is suffering).  
* *Note:* Use CPU/Memory metrics to investigate the alert, not to trigger it.

5.2 The "Golden Signal" Dashboard  
Every service repository must contain a "Dashboard-as-Code" (e.g., Grafana JSON) that visualizes:

1. Request Rate (RPS)  
2. Error Rate (%)  
3. Latency (p50, p95, p99)  
4. Resource Saturation (CPU/RAM/DB Connections)