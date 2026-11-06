# PROJECT.md — Development Specification

# Integrated System & Documentation Generation Platform

## 1. Project Overview

Develop a web-based Integrated System & Documentation Generation Platform for Southern Philippines Medical Center (SPMC).

The application will provide a centralized workspace for managing projects, defining system models, generating software artifacts, producing documentation, tracking changes, and maintaining traceability.

**Supabase is the application's backend platform and communication layer.** The frontend communicates directly with Supabase using the official Supabase client and Supabase services. Do not create a separate Node.js, Python, Express, FastAPI, or custom REST API backend.

The approved system model is the source of truth for generated artifacts and documentation.

## 2. Technology Stack

### Frontend
- React
- TypeScript
- Tailwind CSS
- Reusable component architecture
- Responsive web application

### Backend Platform — Supabase Only
Use Supabase as the only backend platform:

- **Supabase Auth:** user authentication and session management.
- **Supabase PostgreSQL Database:** persistent application data.
- **Supabase Row Level Security (RLS):** authorization and data access control.
- **Supabase Storage:** uploaded files, generated documents, and project artifacts.
- **Supabase Realtime:** live updates and notifications where needed.
- **Supabase Edge Functions:** only for server-side operations that cannot safely or reasonably run in the client, such as protected integrations, secret-dependent operations, or generation tasks requiring a secure execution environment.

Do not build a separate application server or custom REST API layer. Use Supabase's generated client APIs and SDK for database, authentication, storage, and realtime communication.

Do not expose the Supabase service-role key or any privileged secret in frontend code. Use the publishable/anon key in the client and enforce access with RLS. Use Edge Functions for privileged operations when necessary.

### Generation and Document Processing
- Client-side processing where practical.
- Reusable document and code-generation templates.
- Browser-compatible diagram rendering.
- Supabase Storage for generated output.
- Edge Functions only when processing requires a trusted server environment.

Choose libraries for DOCX, PDF, HTML, Markdown, and diagram generation based on browser compatibility and output quality. Avoid introducing a separate backend solely for file generation.

## 3. Core Architecture Rules

1. The React application communicates directly with Supabase through the official Supabase client.
2. Supabase Auth manages authentication and sessions.
3. PostgreSQL stores structured application data.
4. RLS policies enforce access permissions at the database level.
5. Supabase Storage stores uploaded and generated files.
6. Supabase Realtime is used only for features that need live updates.
7. Edge Functions are optional and limited to operations requiring trusted server-side execution.
8. Do not create a separate REST API, Express server, FastAPI server, Node.js backend, or Python backend.
9. Do not duplicate functionality already provided by Supabase.
10. Never place privileged keys, database passwords, or third-party secrets in frontend code.

## 4. Main Application Modules

### 4.1 Authentication and User Management

Use Supabase Auth.

Features:
- Sign in and sign out.
- Password reset.
- Session persistence.
- User profile management.
- User activation and deactivation policies.
- Role and permission management.

Suggested roles, subject to stakeholder approval:
- Super Administrator
- System Administrator
- Project Manager
- System Analyst
- Developer
- Documentation Manager
- Reviewer
- Viewer

Store application profiles and role assignments in PostgreSQL. Enforce access using RLS policies. Do not rely only on frontend route guards for security.

### 4.2 Project Management

Features:
- Create, view, update, and archive projects.
- Assign project members.
- Define project descriptions and objectives.
- Manage project status.
- View project activities and history.
- Organize models, artifacts, and documents by project.

All project data must be stored in Supabase PostgreSQL and protected by RLS.

### 4.3 System Modeling Workspace

Provide a structured interface for defining:

- System requirements.
- Functional requirements.
- Non-functional requirements.
- System components.
- System interfaces.
- Data entities.
- Database structures.
- System architecture.

Features:
- Create and edit system models.
- Organize models by project.
- Validate required fields.
- Maintain model versions.
- Submit models for approval.
- View model history.
- Compare model versions.

Approved models serve as the source of truth for generation.

### 4.4 System Generation Engine

Generate supported software artifacts from approved system models.

Possible outputs:
- Project directory structures.
- Service and component skeletons.
- Database schema definitions.
- Configuration templates.
- Infrastructure-as-code templates.
- Other approved artifacts.

Generation should use reusable templates and validated model data.

Prefer browser-side generation when practical. Use Supabase Edge Functions only if generation requires protected secrets, trusted execution, or server-side processing. Generated files should be saved to Supabase Storage, with metadata and version records stored in PostgreSQL.

All generated artifacts must be reviewable before acceptance.

### 4.5 Documentation Generation Engine

Generate documentation from approved system models.

Supported document types:
- Technical documentation.
- System documentation.
- Hospital forms.
- Reports.
- Data dictionaries.
- User manuals.
- Deployment guides.
- Operational documentation.

Features:
- Select document templates.
- Generate documents from approved models.
- Preview generated documents.
- Edit generated content where authorized.
- Submit documents for review.
- Approve or reject documents.
- Maintain document versions.
- Regenerate documents when source models change.

Supported export formats:
- DOCX
- PDF
- HTML
- Markdown

Use browser-compatible libraries where possible. Store generated files in Supabase Storage and their metadata in PostgreSQL.

### 4.6 Diagram Generation

Support:
- Context diagrams.
- Component diagrams.
- Sequence diagrams.
- Data-flow diagrams.

Requirements:
- Generate diagrams from structured system models.
- Preview diagrams in the application.
- Export diagrams.
- Keep diagrams traceable to their source model.
- Support regeneration after approved model changes.

Prefer browser-compatible diagram libraries. Do not introduce a separate backend for diagram rendering unless a confirmed technical requirement makes it necessary.

### 4.7 Version Control and Change Management

Track versions of:
- System models.
- Generated artifacts.
- Documentation.
- Diagrams.

Features:
- Version history.
- Change descriptions.
- User attribution.
- Timestamps.
- Version comparison.
- Change detection.
- Rollback where supported.
- Identification of potentially outdated documents.

Store version metadata and structured content in PostgreSQL. Store file versions in Supabase Storage.

### 4.8 Traceability Engine

Maintain relationships between:
- Requirements.
- System architecture.
- Components.
- Generated artifacts.
- Test cases.
- Documentation.

Features:
- Traceability matrix.
- Requirement coverage.
- Missing relationship detection.
- Inconsistency detection.
- Outdated document identification.
- Traceability reports.

Use PostgreSQL relationships and queries. Add specialized graph infrastructure only if actual requirements demonstrate that PostgreSQL relationships are insufficient.

### 4.9 Review and Approval Workflow

Features:
- Submit an item for review.
- Assign reviewers.
- Approve documents and models.
- Reject submissions.
- Request revisions.
- Add review comments.
- Track approval history.
- Record reviewer identity and timestamps.

Standard System Mode may use one authorized reviewer. Complex System Mode may require multiple reviewers.

Persist workflow data in Supabase PostgreSQL and enforce permissions through RLS.

### 4.10 Documentation Portal

Features:
- Browse published documentation.
- Search documents.
- Filter by project.
- Filter by document type.
- View document versions.
- Download approved documents.
- Enforce document access permissions.

Store files in Supabase Storage. Use private buckets by default for confidential or restricted documents. Use authorized access and signed URLs where appropriate.

## 5. System Modes

### Standard System Mode

Designed for relatively simple systems.

- Basic system models.
- Simple requirements.
- Standard templates.
- Basic document generation.
- Basic traceability.
- Single-reviewer approval workflow.

### Complex System Mode

Designed for systems involving multiple components or departments.

- Detailed system models.
- Interconnected components.
- Advanced document generation.
- Cross-component traceability.
- Change impact analysis.
- Multi-reviewer approval workflow.
- Detailed version management.

The selected mode must influence modeling depth, templates, traceability, and approval workflow.

## 6. AI and Automation

AI may assist with:
- Drafting technical documentation.
- Summarizing system models.
- Identifying potentially inconsistent documentation.
- Suggesting missing requirements.
- Assisting with documentation updates.

Rules:
- AI-generated content must be reviewable.
- Never automatically approve AI-generated content.
- Keep generated content traceable to its source.
- Do not expose API keys in the frontend.
- Use an Edge Function for AI provider calls when a secret API key is required.
- Do not send confidential patient information to external AI services without explicit authorization and an approved privacy and security arrangement.

AI is an assisting capability, not a replacement for authorized personnel.

## 7. Proposed Supabase Data Model

Design a normalized PostgreSQL schema. The following are proposed entities and must be refined during requirements discovery:

- profiles
- roles
- permissions
- user_roles
- projects
- project_members
- system_models
- model_versions
- requirements
- system_components
- system_interfaces
- data_entities
- generated_artifacts
- document_templates
- generated_documents
- document_versions
- diagrams
- traceability_links
- test_cases
- review_requests
- review_comments
- approval_records
- audit_logs
- integrations

Database requirements:
- Define primary and foreign keys.
- Establish appropriate relationships.
- Add created_at and updated_at timestamps where applicable.
- Add indexes for frequently queried fields.
- Enforce referential integrity.
- Define RLS policies for every table exposed to the client.
- Use database constraints for important invariants.
- Use migrations to manage schema changes.
- Never rely on frontend-only authorization.

## 8. Supabase Client Integration

Create one reusable Supabase client configuration using the official Supabase JavaScript SDK.

The frontend should use the SDK for:
- Authentication.
- Database queries and mutations.
- File uploads and downloads.
- Realtime subscriptions where required.
- Calling Edge Functions when necessary.

Implementation rules:
- Keep Supabase configuration in environment variables.
- Use only the publishable/anon key in browser code.
- Never expose the service-role key.
- Handle loading, empty, success, and error states.
- Validate user input before database mutations.
- Apply RLS policies as the authoritative data-access control.
- Avoid creating redundant API wrappers that simply recreate Supabase functionality.

## 9. Security Requirements

- Use Supabase Auth for identity and sessions.
- Enforce RLS on all client-accessible tables.
- Apply least-privilege access.
- Keep Storage buckets private by default where documents are confidential.
- Use signed URLs or authenticated downloads for restricted files.
- Validate uploads and file types.
- Protect privileged operations with Edge Functions.
- Store secrets only in secure server-side configuration.
- Maintain audit records for important actions.
- Use synthetic or approved de-identified information during development and testing unless production-data use is formally authorized.

## 10. Frontend Design Guidelines

Build a professional enterprise-level hospital information platform.

Design direction:
- Modern enterprise interface.
- Clean and organized layouts.
- Professional typography.
- Consistent spacing.
- Accessible contrast.
- Responsive layouts.
- Clear navigation.
- Reusable components.
- Useful empty, loading, and error states.

Suggested navigation:
1. Dashboard
2. Projects
3. System Models
4. System Generator
5. Documentation Generator
6. Diagrams
7. Traceability
8. Reviews and Approvals
9. Documentation Portal
10. User Management
11. Settings
12. Audit Logs

Dashboard metrics:
- Total projects.
- Active projects.
- Total system models.
- Generated documents.
- Pending approvals.
- Recent activities.
- Generation status.

## 11. Testing Requirements

Test:
- Authentication and session handling.
- RLS policies and access boundaries.
- Project management.
- Model creation and versioning.
- Generation output validation.
- Document rendering and export.
- Storage upload and download permissions.
- Realtime behavior where implemented.
- Review and approval workflows.
- Traceability and change detection.
- Edge Functions, if implemented.
- Security and performance.
- User acceptance.

Test RLS policies using users with different roles and project memberships. A feature is not secure merely because its frontend page is hidden.

## 12. Development Phases

### Phase 1 — Discovery and Requirements (Months 1–3)
- Confirm pilot hospital system.
- Consult stakeholders.
- Gather requirements.
- Define roles and permissions.
- Finalize architecture and Supabase data model.
- Approve requirements baseline.

**Deliverable:** Approved requirements and architecture.

### Phase 2 — Core Platform (Months 4–6)
- Configure Supabase project.
- Implement database migrations and RLS.
- Implement Supabase Auth.
- Develop user and project management.
- Develop system modeling workspace.
- Implement model versioning.
- Demonstrate system generator alpha.

**Deliverable:** Working modeling workspace and system generator alpha.

### Phase 3 — Documentation Engine (Months 7–9)
- Develop document templates.
- Implement document generation.
- Implement diagram generation.
- Implement document exports.
- Implement initial traceability.
- Develop documentation portal.

**Deliverable:** Documentation generation beta.

### Phase 4 — Integration and Completion
- Implement approved integrations.
- Complete change management.
- Complete approval workflows.
- Complete security controls.

### Phase 5 — Testing and Validation (Month 11)
- Functional testing.
- RLS and security testing.
- Performance testing.
- User acceptance testing.
- Resolve critical issues.

**Deliverable:** Release candidate.

### Phase 6 — Deployment and Handover (Month 12)
- Deploy the application.
- Configure production Supabase environment.
- Conduct user training.
- Prepare technical and operational documentation.
- Complete handover.

**Deliverable:** Pilot deployment and production release.

## 13. Development Standards

1. Use modular, maintainable React and TypeScript code.
2. Use the official Supabase client.
3. Use Supabase as the only backend platform.
4. Do not create a separate REST API or application server.
5. Do not duplicate Supabase Auth, database, Storage, or Realtime functionality.
6. Keep database schema changes in migrations.
7. Apply and test RLS policies.
8. Keep privileged secrets out of frontend code.
9. Use Edge Functions only when trusted server-side execution is necessary.
10. Prefer client-side processing for suitable generation tasks.
11. Validate user input.
12. Implement proper loading and error handling.
13. Reuse components and services.
14. Avoid unnecessary dependencies.
15. Use Git for source control.
16. Write tests for critical functionality.
17. Keep generated outputs traceable to approved models.
18. Update documentation when implementation changes.

## 14. Instructions for AI Coding Agents

When working on this repository:

- Inspect the existing project structure before modifying files.
- Read existing documentation and configuration.
- Preserve working implementations.
- Do not introduce Express, FastAPI, a custom Node.js backend, or a Python backend.
- Do not create custom REST endpoints for operations already supported by Supabase.
- Use Supabase client methods for database, Auth, Storage, and Realtime operations.
- Use Edge Functions only for operations that genuinely require trusted server-side execution.
- Never expose service-role keys or provider secrets.
- Do not invent hospital data.
- Do not use real patient information in development fixtures.
- Implement features incrementally.
- Validate RLS policies, not just frontend access controls.
- Run relevant tests after changes.
- Report incomplete functionality honestly.
- Update documentation when implementation changes.

Before implementing a feature:

1. Inspect the existing code and relevant Supabase schema.
2. Identify required tables, relationships, and Storage buckets.
3. Define the required RLS policies.
4. Implement database migrations.
5. Implement frontend integration using the Supabase client.
6. Add an Edge Function only if a trusted server-side operation is necessary.
7. Implement validation and error handling.
8. Test using appropriate user roles.
9. Update documentation.

## 15. Definition of Done

A feature is complete only when:
- Its requirements are implemented.
- Its frontend is functional.
- Its Supabase integration works.
- Its database changes are versioned through migrations.
- Its RLS policies are implemented and tested.
- Its Storage permissions are correct, if applicable.
- Its error and loading states are handled.
- Relevant tests pass.
- Documentation is updated.

The platform is ready for handover when the approved pilot scope has passed security, performance, and user acceptance testing and the required training and documentation have been delivered.

## 16. Non-Negotiable Architecture Decision

**Supabase is the backend. The React frontend communicates directly with Supabase through the official Supabase client.**

- No separate REST API backend.
- No Express backend.
- No FastAPI backend.
- No standalone Node.js or Python application server.
- Supabase PostgreSQL is the primary database.
- Supabase Auth handles authentication.
- Supabase RLS enforces authorization.
- Supabase Storage handles files.
- Supabase Realtime handles required live updates.
- Supabase Edge Functions are reserved for trusted server-side operations that cannot safely run in the browser.

Do not add another backend layer unless the project owner explicitly changes this architecture decision.
