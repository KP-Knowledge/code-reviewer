# **Governance Standards Library**

## **1\. Enterprise Technology Standards & Patterns**

Document ID: STD-TECH-01  
Version: 1.0  
Owner: Architecture Review Board (ARB)

### **1\. Technology Standards Registry (The "Tech Radar")**

This registry classifies technologies into three categories:

* 🟢 **Standard:** The default, approved choice. No waiver needed.  
* 🟡 **Restricted:** Allowed for specific use cases or legacy support. Requires justification in KDD.  
* 🔴 **Prohibited:** Banned for new development. Requires a severe exception waiver.

#### **1.1 Integration & API**

| Category | 🟢 Standard (Preferred) | 🟡 Restricted (Justify) | 🔴 Prohibited |
| :---- | :---- | :---- | :---- |
| **API Protocol** | REST (over HTTP/2), gRPC (Internal only) | SOAP, GraphQL (BFF only) | RMI, CORBA, DCOM |
| **API Contract** | OpenAPI 3.0+ (YAML) | RAML, Blueprint | Word/PDF Docs, Wiki pages |
| **Event Bus** | Kafka, AWS SNS/SQS | RabbitMQ, ActiveMQ | TCP Sockets, DB Polling |
| **Event Schema** | Avro (with Schema Registry) | JSON Schema | Unstructured Text/XML |
| **File Transfer** | SFTP (with SSH Keys) | FTPs | Unencrypted FTP |

#### **1.2 Data & Storage**

| Category | 🟢 Standard (Preferred) | 🟡 Restricted (Justify) | 🔴 Prohibited |
| :---- | :---- | :---- | :---- |
| **Relational DB** | PostgreSQL, MySQL (Managed) | Oracle, SQL Server | Access, FoxPro |
| **NoSQL / Doc** | MongoDB, DynamoDB | Cassandra | CouchDB |
| **Caching** | Redis (Cluster Mode) | Memcached | In-Memory (Heap) Maps |
| **Bulk Data** | Apache Parquet (Snappy) | CSV, JSON Lines | Excel (.xlsx), Fixed Width |
| **Storage** | Object Storage (S3-compatible) | Block Storage (EBS) | Local Disk (Ephemeral) |

#### **1.3 Security & Identity**

| Category | 🟢 Standard (Preferred) | 🟡 Restricted (Justify) | 🔴 Prohibited |
| :---- | :---- | :---- | :---- |
| **Authentication** | OAuth 2.0 \+ OIDC (JWT) | SAML 2.0 | LDAP, Basic Auth, Custom Cookies |
| **Secret Mgmt** | Cloud Secrets Manager / Vault | Encrypted Env Vars | Hardcoded in Code/Config |
| **Encryption** | TLS 1.3, AES-256-GCM | TLS 1.2 | SSL v3, TLS 1.0/1.1, DES/3DES |

#### **1.4 Operations & DevOps**

| Category | 🟢 Standard (Preferred) | 🟡 Restricted (Justify) | 🔴 Prohibited |
| :---- | :---- | :---- | :---- |
| **Container** | Docker (OCI Compliant), Containerd | Vagrant | VirtualBox |
| **Orchestration** | Kubernetes (K8s) | Docker Swarm, ECS | Bare Metal Scripts |
| **IaC** | Terraform, Helm | CloudFormation, Ansible | Manual Console ClickOps |
| **Observability** | OpenTelemetry (OTel) | Vendor Agents (Datadog/NewRelic) | System.out.println |

### **2\. Mandatory Architecture Patterns (The "Blueprints")**

These are the approved design patterns for solving common architectural problems.

#### **Pattern 2.1: The "Transactional Outbox" (Reliability)**

* **Context:** When a service needs to save data to its DB and publish an event (e.g., "Order Created") without losing either if the network fails.  
* **Standard:**  
  1. Service saves the business data AND the event payload to a local database table (outbox\_table) in the same ACID transaction.  
  2. A separate "CDC Connector" (e.g., Debezium) reads the outbox\_table and publishes to Kafka.  
* **Constraint:** Do not dual-write (save to DB, then call Kafka API) in code, as this leads to data inconsistencies.

#### **Pattern 2.2: The "Strangler Fig" (Legacy Migration)**

* **Context:** Migrating a monolithic legacy system to microservices.  
* **Standard:**  
  1. Place an API Gateway / Proxy in front of the legacy system.  
  2. Route new functionality to the new microservice.  
  3. Slowly route existing endpoints to new services one by one.  
  4. Retire the legacy system only when all traffic has been strangled off.  
* **Constraint:** Do not attempt a "Big Bang" rewrite.

#### **Pattern 2.3: The "CQRS Lite" (Performance)**

* **Context:** Solving complex joins in a Microservices architecture (where joins are impossible).  
* **Standard:**  
  1. **Command Side:** Services write to their own private databases.  
  2. **Event Stream:** Changes are published to the Event Bus.  
  3. **Query Side:** A dedicated "Read Model" service consumes events and builds a denormalized view (e.g., Elasticsearch or a wide-column store) optimized for the specific UI query.  
* **Constraint:** The Read Model is "Eventually Consistent." UI designs must account for slight delays in data freshness.

#### **Pattern 2.4: The "Circuit Breaker" (Resilience)**

* **Context:** Preventing a slow downstream service from exhausting the connection pool of the upstream caller.  
* **Standard:**  
  1. Wrap all synchronous external calls (HTTP/gRPC) in a Circuit Breaker.  
  2. **State Open:** If error rate \> 50%, stop calling the downstream service immediately and return a fallback/error.  
  3. **Half-Open:** After a timeout, let one request through to test if the service has recovered.  
* **Constraint:** Must implement a "Fallback" (e.g., return cached data or empty list) rather than just crashing.

## **2\. Mandatory SAD Artifacts**

Document ID: STD-ARC-01  
Version: 1.0  
Owner: Architecture Review Board (ARB)  
Applicability: Tier 1 & 2 Projects (Tier 3 may use a simplified subset).

### **Section I: Mandatory SAD Artifacts (The Deliverables)**

These key documents and models must be created, included, and officially reviewed as part of the SAD submission package for all high and medium-complexity projects.

| Artifact | Purpose | Standard Guidance |
| :---- | :---- | :---- |
| **Non-Functional Requirements (NFRs)** | Defines the essential quality attributes of the solution. | NFRs must be quantifiable and measurable. Must include specific targets for Performance, Security, Reliability (RTO/RPO), Scalability, and Availability. |
| **Technology Stack & Justification** | Provides technical clarity and validates strategic alignment. | Must list all major technologies, frameworks, and versions. Each choice must include a clear **Rationale** justifying its selection against alternatives and adherence to the organization's approved technology roadmap. |
| **Data Model (Conceptual/Logical)** | Describes the structure and relationships of data. | Must include a high-level Logical Data Model showing key entities, attributes, and relationships necessary for the solution's core functionality. Must comply with organizational data governance policies. |
| **Risk & Mitigation Log** | Manages technical and architectural risk proactively. | Must be a living document that identifies key **Architectural Risks** and defines specific, actionable **Mitigation Strategies** (technical and procedural). |

### **Section II: Mandatory Architectural Views (The Diagrams)**

The SAD must include visual representations covering the core system structure, boundaries, and deployment. (Aligned with the C4 Model for clarity).

| Viewpoint / Diagram Type | Stakeholder Focus | Mandatory Content |
| :---- | :---- | :---- |
| **Context View** | Business Stakeholders, External Teams | Shows the solution as a single system and its high-level interactions with all external systems (users, external services, upstream/downstream dependencies). |
| **Container/Logical View** | Developers, Architects | Illustrates the high-level components ("Containers" like services, databases, web applications) and how they communicate. Maps to the logical components from the 4+1 View Model. |
| **Physical (Deployment) View** | Operations, Infrastructure Team | Maps the software components onto the physical/cloud infrastructure (e.g., specific cloud regions, server types, network zones, container orchestration platform). |
| **Data Flow View** | Security, Data Governance | Details the step-by-step movement of sensitive or critical data, including data-in-transit encryption points, across the system and through integration points. |
| **Scenario View (+1)** | QA, Project Management | Includes at least one Sequence Diagram or use case description illustrating a critical, complex, or high-risk end-to-end user journey or transaction. |

### **Section III: Cross-Cutting Compliance Concerns**

This section must demonstrate how the design meets mandatory organizational compliance policies.

| Concern | Standard Requirement |
| :---- | :---- |
| **Security Design** | Must detail the implementation of Authentication (who you are), Authorization (what you can do), and Data Encryption (in-transit and at-rest methods). Must cite adherence to minimum required standards (e.g., TLS 1.2+). |
| **Reliability & Availability** | Must specify the High-Availability (HA) / Disaster Recovery (DR) strategy, including defined Recovery Time Objective (RTO) and Recovery Point Objective (RPO) targets. Must outline backup and restore procedures. |
| **Integration Points** | Must detail the communication protocols, data formats, and mechanism (e.g., API, Message Queue, File Transfer) for connecting with all external/legacy systems. |

