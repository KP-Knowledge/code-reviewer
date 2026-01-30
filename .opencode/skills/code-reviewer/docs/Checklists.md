# **Governance Checklists**

## **1\. The "Definition of Done" (DoD) Checklist**

**Usage:** This checklist must be included in the Pull Request (PR) Template or Release Ticket. Engineers must check these boxes before requesting a code review.

### **✅ Part 1: Architecture & Integration**

* \[ \] **API Contract:** I have updated the openapi.yaml or asyncapi.yaml to match my code changes.  
* \[ \] **Idempotency:** If this is a POST or Event Consumer, I have verified that running it twice won't corrupt data.  
* \[ \] **Validation:** I am validating all inputs (API payload) and returning 400 Bad Request for invalid data, not letting it crash the server with a 500 error.  
* \[ \] **Pagination:** If returning a list, I have implemented limits/pagination to prevent Out-Of-Memory errors on large datasets.

### **✅ Part 2: Security & Data**

* \[ \] **No Secrets:** I have scanned my code to ensure no passwords, keys, or tokens are hardcoded. (They are in Environment Variables).  
* \[ \] **Authorization:** I am checking "Scopes" or "Roles" on the endpoint. (Not just "Is the user logged in?", but "Can this user do THIS action?").  
* \[ \] **SQL Injection:** I am using ORM methods or Parameterized Queries. No string concatenation for SQL.  
* \[ \] **Data Privacy:** I am not logging full PII (e.g., Credit Card, National ID) in the application logs.

### **✅ Part 3: Operations & Reliability**

* \[ \] **Observability:** I have included trace\_id in logs/events.  
* \[ \] **Error Handling:** I am catching exceptions and logging them with a stack trace (internally), but returning a generic JSON error to the user.  
* \[ \] **Config:** I have added default values for any new Environment Variables (or documented them for DevOps).  
* \[ \] **Database Migrations:** If I changed the schema, I have included a versioned migration script (e.g., Flyway/Liquibase).

### **✅ Part 4: Observability**

* \[ \] **Logs:** Am I passing trace\_id to the logger MDC?  
* \[ \] **Logs:** Are secrets (passwords, tokens) masked in the log payload?  
* \[ \] **Metrics:** Did I avoid putting user\_id or uuid in the metric tags?  
* \[ \] **Health:** Does /health/live return 200 instantly without checking the DB?  
* \[ \] **Health:** Does /health/ready fail if the DB connection is lost?  
* \[ \] **Tracing:** If I make an async call, am I passing the traceparent header?  
* \[ \] **Alert:** Do I have all Golden signal metrics?

## **2\. Solution Architecture Review Checklist (The "Pre-Flight" Check)**

**Usage:** For Architects reviewing a KDD or High-Level Design.

* \[ \] **Tier Alignment:** Is the design complexity proportional to the Application Tier? (e.g., Don't build a Kubernetes Cluster for a Tier 3 Survey App).  
* \[ \] **Legacy Impact:** Does this design require changes to a Legacy System? If so, is the Legacy Team aware and resourced?  
* \[ \] **Data Ownership:** Is this service reading/writing its OWN data? (Verify no direct connections to other domains' DBs).  
* \[ \] **Failure Mode:** What happens if the Database or downstream API is down? Does the system fail gracefully (Circuit Breaker) or hang?  
* \[ \] **Recovery:** If the data becomes corrupted, is there a way to re-run the events or restore from Snapshot?

## **3\. SAD Submission Checklist**

**Usage:** To verify completeness of the Solution Architecture Document (SAD) before submission to the ARB.

* \[ \] **NFRs:** Are metrics quantified? (e.g., numbers, not adjectives).  
* \[ \] **Rationale:** Did I explain *why* I chose this tech stack?  
* \[ \] **Diagrams:** Do I have all 4 mandatory C4 views?  
* \[ \] **Data:** Is the Logical Data Model included?  
* \[ \] **Security:** Is the Data Flow diagram showing encryption points?  
* \[ \] **Risk:** Is the Risk Log populated with at least one risk or explicitly stated as "None"?