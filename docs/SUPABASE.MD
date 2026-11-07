# SUPABASE.md — Supabase Implementation Specification

Companion document to `docs/PROJECT.MD`. `PROJECT.MD` defines **what** the platform must do; this document defines **how Supabase is wired** to do it: schema, RLS, Storage, Realtime, Edge Functions, client integration, migrations, and testing.

If the two documents ever disagree, `PROJECT.MD` wins. Update this document whenever the Supabase implementation changes.

---

## 1. Non-Negotiable Architecture

- **Supabase is the only backend.** No Express, FastAPI, standalone Node.js, or Python server.
- The React/Next.js frontend talks to Supabase **directly** through `@supabase/supabase-js` and `@supabase/ssr`.
- Authorization is enforced **in the database** with Row Level Security. Frontend route guards are UX only.
- Only the **publishable/anon key** may ever reach the browser. The service-role key lives **only** inside Edge Function secrets.
- Supabase Auth owns identity. `auth.users` is the identity table; `public.profiles` is the application profile.
- Supabase Storage owns files. Supabase Realtime is used only where live updates are a real requirement.
- Edge Functions are the exception, not the default: use them only for secrets, privileged admin operations, or heavy trusted processing.

### What this forbids in practice

- Creating `/api/*` route handlers to proxy Supabase calls.
- Duplicating Auth/Storage/Realtime behind custom wrappers.
- Reading `SUPABASE_SERVICE_ROLE_KEY` anywhere outside an Edge Function.
- Trusting `project_members` checks done only in React.

---

## 2. Stack Facts (This Repository)

| Item | Value |
|---|---|
| Framework | Next.js `16.4.3` (App Router) |
| UI | React `19.3.0`, Tailwind CSS `4` |
| Language | TypeScript `5`, `strict: true` |
| Path alias | `@/*` → repository root |
| Backend | Supabase only |
| Node modules | Not installed yet — run `npm install` before wiring the client |

### Packages to add

```bash
npm install @supabase/supabase-js @supabase/ssr zod
npm install -D supabase
```

- `@supabase/supabase-js` — browser client, database, storage, realtime.
- `@supabase/ssr` — cookie-based session handling for the App Router (uses `getAll`/`setAll` cookie accessors).
- `zod` — input validation before every mutation.
- `supabase` (CLI) — local stack, migrations, type generation.

Do not add a separate ORM, an auth library, or a file-upload service. Supabase already provides those.

### Next.js 16 breaking change that affects this document

Next.js 16 renamed **Middleware** to **Proxy**. Create `proxy.ts` at the repository root and export a function named `proxy` — not `middleware.ts`/`middleware`. Session refresh must run there, because server-rendered pages cannot reliably write cookies themselves.

---

## 3. Environment Configuration

`.env.local` (never committed — `.env*` is already git-ignored):

```bash
# Browser-safe (publishable key is the current name; anon key remains valid)
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

# Server-only: Edge Function runtime secrets ONLY. Never prefix with NEXT_PUBLIC_.
SUPABASE_SERVICE_ROLE_KEY=...
AI_PROVIDER_API_KEY=...
```

Rules:

1. `NEXT_PUBLIC_*` values are baked into the browser bundle. Treat them as public.
2. The service-role key must never appear in `.env.local` consumed by the Next.js runtime, only in `supabase secrets` for Edge Functions.
3. CI must fail if `SUPABASE_SERVICE_ROLE_KEY` is referenced outside `supabase/functions/**`.
4. Keep a checked-in `.env.example` with empty values and comments.

---

## 4. Client Architecture

Create exactly **one** Supabase client per execution context. Never instantiate inside components or rerender paths.

```
lib/supabase/client.ts        # browser  → createBrowserClient
lib/supabase/server.ts        # RSC/actions → createServerClient with cookies()
lib/supabase/proxy.ts         # session refresh helper for proxy.ts
lib/supabase/queries/*.ts     # domain query modules (typed, reusable)
lib/supabase/storage.ts       # upload/download/signed URL helpers
lib/supabase/realtime.ts      # subscription helpers
types/supabase.ts             # generated database types (do not hand-edit)
proxy.ts                      # Next.js 16 proxy entry point
```

### 4.1 Browser client

```ts
// lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function getSupabaseBrowserClient() {
  client ??= createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
  return client;
}
```

Only this module may read `NEXT_PUBLIC_SUPABASE_*`.

### 4.2 Server client (React Server Components, Server Actions)

```ts
// lib/supabase/server.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

export async function getSupabaseServerClient() {
  const cookieStore = await cookies(); // async in Next.js 15+/16

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from an RSC render: safe to ignore when proxy refreshes sessions.
          }
        },
      },
    },
  );
}
```

Never use the server client with the service-role key for ordinary feature code. It exists to carry the **caller's** identity and therefore the caller's RLS permissions.

### 4.3 Session refresh in `proxy.ts`

```ts
// proxy.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isProtected = !request.nextUrl.pathname.startsWith("/login");
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
```

This redirect is UX only. It is **not** security.

### 4.4 Query modules

Wrap repeated reads in small typed modules (`lib/supabase/queries/projects.ts`, etc.) so components never hand-build table names. Wrappers must not recreate REST semantics — they should return rows, throw typed errors, and let callers handle loading/empty/error states.

Every mutation must:

1. Validate input with `zod`.
2. Call the Supabase client.
3. Let RLS be the authorization decision.
4. Return a typed result and surface `error` to the UI.

---

## 5. Local Development, Migrations, and Types

### 5.1 Bootstrap

```bash
npx supabase init                 # creates supabase/config.toml
npx supabase start                # local stack (API, DB, Studio, Storage)
npx supabase db reset             # apply migrations + seed from scratch
```

Local ports are written to `.supabase/` output; keep the printed values in the repo's onboarding notes when they differ from defaults.

### 5.2 Migration rules

- Schema changes **only** through files in `supabase/migrations/`.
- Never edit an applied migration. Add a new one.
- Migrations must be idempotent where safe (`create table if not exists`, `create or replace function`, `drop policy if exists` before `create policy`).
- Every table that the client can reach gets RLS in the **same migration** that creates it.
- Every migration must pass `npx supabase db lint` and `npx supabase db reset`.

### 5.3 Proposed migration order

```
20260101000000_extensions_and_helpers.sql
20260101000100_enums.sql
20260101000200_identity.sql          # profiles, roles, permissions, user_roles
20260101000300_projects.sql
20260101000400_models.sql            # system_models, model_versions, requirements, components, interfaces, entities
20260101000500_generation.sql        # generated_artifacts
20260101000600_documents.sql         # templates, documents, versions
20260101000700_diagrams.sql
20260101000800_traceability.sql      # test_cases, traceability_links, views
20260101000900_reviews.sql
20260101001000_audit_integrations.sql
20260101001100_storage.sql
20260101001200_realtime.sql
20260101001300_seed_reference_data.sql
```

### 5.4 Type generation

```bash
npx supabase gen types typescript --local --schema public > types/supabase.ts
npx supabase gen types typescript --project-id <ref> --schema public > types/supabase.ts
```

Regenerate after every migration and commit the result. Never hand-edit `types/supabase.ts`.

### 5.5 Remote deployment

```bash
npx supabase link --project-ref <ref>
npx supabase db push              # apply pending migrations
npx supabase migration list       # verify local vs remote
```

Production migrations require a reviewed PR and a backup checkpoint.

---

## 6. Database Schema

All identifiers are `snake_case`, tables are plural, primary keys are `uuid` with `gen_random_uuid()`, timestamps are `timestamptz`.

### 6.1 Relationship overview

```
auth.users 1─1 profiles
profiles N─N roles                      (user_roles)
roles N─N permissions                   (role_permissions)

profiles 1─N projects (owner)
projects N─N profiles                   (project_members, project_role)

projects 1─N system_models
system_models 1─N model_versions
system_models 1─1 model_versions        (current_version_id)
model_versions 1─N requirements
model_versions 1─N system_components    (self-referencing parent)
model_versions 1─N system_interfaces
model_versions 1─N data_entities

projects 1─N generated_artifacts        (from a model_version)
document_templates 1─N generated_documents
generated_documents 1─N document_versions
generated_documents 1─1 document_versions (current_version_id)
projects 1─N diagrams

projects 1─N traceability_links         (polymorphic source/target)
projects 1─N test_cases
model_versions 1─N test_cases

projects 1─N review_requests
review_requests 1─N review_assignments
review_requests 1─N review_comments
review_requests 1─N approval_records

profiles 1─N audit_logs
projects 1─N integrations
```

### 6.2 Enums

```sql
create type public.project_status      as enum ('planning','active','on_hold','completed','archived');
create type public.system_mode         as enum ('standard','complex');
create type public.project_role        as enum ('manager','analyst','developer','documentation_manager','reviewer','viewer');
create type public.record_status       as enum ('draft','submitted','approved','rejected','superseded','outdated','archived');
create type public.requirement_type    as enum ('functional','non_functional','business','interface','data','constraint');
create type public.priority_level      as enum ('low','medium','high','critical');
create type public.artifact_type       as enum ('directory_structure','service_skeleton','component_skeleton','database_schema','configuration_template','infrastructure_as_code','other');
create type public.document_type       as enum ('technical','system','hospital_form','report','data_dictionary','user_manual','deployment_guide','operational');
create type public.file_format         as enum ('docx','pdf','html','markdown','svg','png','json','zip');
create type public.diagram_type        as enum ('context','component','sequence','data_flow');
create type public.interface_direction as enum ('inbound','outbound','bidirectional');
create type public.review_target_type  as enum ('system_model','model_version','generated_artifact','generated_document','diagram');
create type public.review_status       as enum ('pending','in_review','approved','rejected','revision_requested','cancelled');
create type public.review_decision     as enum ('pending','approved','rejected','revision_requested');
create type public.entity_type         as enum ('requirement','system_component','system_interface','data_entity','test_case','generated_artifact','generated_document','diagram');
create type public.link_type           as enum ('implements','realizes','verifies','documents','depends_on','derives_from');
```

### 6.3 Identity and access

```sql
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text not null,
  avatar_url  text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.roles (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  is_system   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.permissions (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  description text,
  created_at  timestamptz not null default now()
);

create table public.role_permissions (
  role_id       uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table public.user_roles (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role_id    uuid not null references public.roles(id) on delete cascade,
  granted_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key (user_id, role_id)
);
```

**Role model decision:** `user_roles` holds **global** roles only. Per-project roles live in `project_members.project_role`. This avoids nullable composite keys and keeps the access check unambiguous:

- Global role → system-wide capabilities (administration, audit, user management).
- Project role → what the user may do inside one project.

Seed roles: `super_admin`, `system_admin`, `project_manager`, `system_analyst`, `developer`, `documentation_manager`, `reviewer`, `viewer`.

Seed permissions: `project.create`, `project.manage`, `project.archive`, `model.edit`, `model.approve`, `artifact.generate`, `artifact.approve`, `artifact.review`, `document.generate`, `document.approve`, `document.review`, `document.template.manage`, `traceability.manage`, `review.request`, `review.assign`, `user.manage`, `audit.view`, `integration.manage`, `settings.manage`.

Standard System Mode uses `required_approvals = 1`. Complex System Mode uses `required_approvals >= 2`; enforce this when creating a `review_requests` row.

### 6.4 Projects

```sql
create table public.projects (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,
  name         text not null,
  description  text,
  objectives   text,
  status       public.project_status not null default 'planning',
  system_mode  public.system_mode not null default 'standard',
  owner_id     uuid not null references public.profiles(id),
  created_by   uuid not null references public.profiles(id),
  archived_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.project_members (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  project_role public.project_role not null default 'viewer',
  added_by     uuid references public.profiles(id),
  created_at   timestamptz not null default now(),
  unique (project_id, user_id)
);
```

### 6.5 System models and versioning

```sql
create table public.system_models (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  name        text not null,
  description text,
  status      public.record_status not null default 'draft',
  system_mode public.system_mode not null default 'standard',
  created_by  uuid not null references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (project_id, name)
);

create table public.model_versions (
  id              uuid primary key default gen_random_uuid(),
  system_model_id uuid not null references public.system_models(id) on delete cascade,
  version_no      integer not null check (version_no > 0),
  snapshot        jsonb not null default '{}'::jsonb,
  change_summary  text,
  status          public.record_status not null default 'draft',
  created_by      uuid not null references public.profiles(id),
  approved_by     uuid references public.profiles(id),
  approved_at     timestamptz,
  created_at      timestamptz not null default now(),
  unique (system_model_id, version_no)
);

alter table public.system_models
  add column current_version_id uuid;
alter table public.system_models
  add constraint system_models_current_version_fk
  foreign key (current_version_id) references public.model_versions(id)
  on delete set null;
```

`snapshot` keeps the complete structured model as submitted. Normalized child tables below provide queryable, diffable rows for the same version. Both are written in one transaction; the snapshot is the immutable record of what was approved.

### 6.6 Model detail tables

```sql
create table public.requirements (
  id                  uuid primary key default gen_random_uuid(),
  model_version_id    uuid not null references public.model_versions(id) on delete cascade,
  code                text not null,
  title               text not null,
  description         text,
  req_type            public.requirement_type not null default 'functional',
  priority            public.priority_level not null default 'medium',
  acceptance_criteria text,
  source              text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (model_version_id, code)
);

create table public.system_components (
  id                  uuid primary key default gen_random_uuid(),
  model_version_id    uuid not null references public.model_versions(id) on delete cascade,
  name                text not null,
  description         text,
  component_type      text,
  technology          text,
  parent_component_id uuid references public.system_components(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (model_version_id, name)
);

create table public.system_interfaces (
  id                    uuid primary key default gen_random_uuid(),
  model_version_id      uuid not null references public.model_versions(id) on delete cascade,
  name                  text not null,
  description           text,
  source_component_id   uuid references public.system_components(id) on delete set null,
  target_component_id   uuid references public.system_components(id) on delete set null,
  protocol              text,
  direction             public.interface_direction not null default 'bidirectional',
  payload_schema        jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (model_version_id, name)
);

create table public.data_entities (
  id               uuid primary key default gen_random_uuid(),
  model_version_id uuid not null references public.model_versions(id) on delete cascade,
  name             text not null,
  description      text,
  table_name       text,
  attributes       jsonb not null default '[]'::jsonb,
  primary_key      text[] not null default '{}',
  indexes          jsonb not null default '[]'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (model_version_id, name)
);
```

### 6.7 Generated artifacts

```sql
create table public.generated_artifacts (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references public.projects(id) on delete cascade,
  model_version_id uuid not null references public.model_versions(id) on delete restrict,
  artifact_type    public.artifact_type not null,
  name             text not null,
  storage_path     text not null,
  file_format      public.file_format not null default 'zip',
  version_no       integer not null default 1 check (version_no > 0),
  generator_version text not null,
  checksum         text,
  size_bytes       bigint check (size_bytes >= 0),
  status           public.record_status not null default 'draft',
  created_by       uuid not null references public.profiles(id),
  approved_by      uuid references public.profiles(id),
  approved_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (project_id, name, version_no)
);
```

### 6.8 Documents and templates

```sql
create table public.document_templates (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  description   text,
  doc_type      public.document_type not null,
  mode_scope    public.system_mode,            -- null = both modes
  template_path text,                          -- Storage object in templates bucket
  body          text,                          -- inline template when small
  variables     jsonb not null default '[]'::jsonb,
  version_no    integer not null default 1,
  is_active     boolean not null default true,
  created_by    uuid not null references public.profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (template_path is not null or body is not null)
);

create table public.generated_documents (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references public.projects(id) on delete cascade,
  model_version_id uuid not null references public.model_versions(id) on delete restrict,
  template_id      uuid not null references public.document_templates(id) on delete restrict,
  title            text not null,
  doc_type         public.document_type not null,
  status           public.record_status not null default 'draft',
  created_by       uuid not null references public.profiles(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.document_versions (
  id               uuid primary key default gen_random_uuid(),
  document_id      uuid not null references public.generated_documents(id) on delete cascade,
  version_no       integer not null check (version_no > 0),
  storage_path     text not null,
  file_format      public.file_format not null default 'markdown',
  content_markdown text,
  checksum         text,
  change_summary   text,
  status           public.record_status not null default 'draft',
  created_by       uuid not null references public.profiles(id),
  approved_by      uuid references public.profiles(id),
  approved_at      timestamptz,
  created_at       timestamptz not null default now(),
  unique (document_id, version_no)
);

alter table public.generated_documents
  add column current_version_id uuid;
alter table public.generated_documents
  add constraint generated_documents_current_version_fk
  foreign key (current_version_id) references public.document_versions(id)
  on delete set null;
```

`document_versions.storage_path` points to rendered output (`docx`, `pdf`, `html`). `content_markdown` is the editable source for authorized edits, so exports can be regenerated without re-reading binary files.

### 6.9 Diagrams

```sql
create table public.diagrams (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references public.projects(id) on delete cascade,
  model_version_id uuid not null references public.model_versions(id) on delete cascade,
  name             text not null,
  diagram_type     public.diagram_type not null,
  file_format      public.file_format not null default 'svg',
  storage_path     text not null,
  definition       jsonb not null default '{}'::jsonb,
  version_no       integer not null default 1 check (version_no > 0),
  status           public.record_status not null default 'draft',
  created_by       uuid not null references public.profiles(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (project_id, name, version_no)
);
```

### 6.10 Traceability

```sql
create table public.test_cases (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references public.projects(id) on delete cascade,
  model_version_id uuid references public.model_versions(id) on delete set null,
  requirement_id   uuid references public.requirements(id) on delete set null,
  code             text not null,
  title            text not null,
  preconditions    text,
  steps            jsonb not null default '[]'::jsonb,
  expected_result  text,
  status           public.record_status not null default 'draft',
  created_by       uuid not null references public.profiles(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (project_id, code)
);

create table public.traceability_links (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  source_type public.entity_type not null,
  source_id   uuid not null,
  target_type public.entity_type not null,
  target_id   uuid not null,
  link_type   public.link_type not null,
  created_by  uuid not null references public.profiles(id),
  created_at  timestamptz not null default now(),
  unique (project_id, source_type, source_id, target_type, target_id, link_type),
  check (source_type <> target_type or source_id <> target_id)
);
```

**Polymorphic integrity note:** `traceability_links` cannot use real foreign keys on `source_id`/`target_id`. Referential integrity is enforced by:

1. Application validation before insert (target exists, belongs to the same project).
2. A nightly `traceability_integrity_scan()` SQL function that returns orphaned links.
3. Deletion guard triggers on traceable tables that refuse deletion while links exist.

Do not add a graph database. PostgreSQL relationships satisfy the requirement until measured otherwise.

### 6.11 Review and approval

```sql
create table public.review_requests (
  id                 uuid primary key default gen_random_uuid(),
  project_id         uuid not null references public.projects(id) on delete cascade,
  target_type        public.review_target_type not null,
  target_id          uuid not null,
  requested_by       uuid not null references public.profiles(id),
  status             public.review_status not null default 'pending',
  required_approvals integer not null default 1 check (required_approvals > 0),
  due_at             timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table public.review_assignments (
  id                uuid primary key default gen_random_uuid(),
  review_request_id uuid not null references public.review_requests(id) on delete cascade,
  reviewer_id       uuid not null references public.profiles(id) on delete cascade,
  decision          public.review_decision not null default 'pending',
  decided_at        timestamptz,
  created_at        timestamptz not null default now(),
  unique (review_request_id, reviewer_id)
);

create table public.review_comments (
  id                uuid primary key default gen_random_uuid(),
  review_request_id uuid not null references public.review_requests(id) on delete cascade,
  author_id         uuid not null references public.profiles(id),
  body              text not null,
  visibility        text not null default 'reviewers' check (visibility in ('reviewers','project')),
  created_at        timestamptz not null default now()
);

create table public.approval_records (
  id                uuid primary key default gen_random_uuid(),
  review_request_id uuid not null references public.review_requests(id) on delete cascade,
  target_type       public.review_target_type not null,
  target_id         uuid not null,
  reviewer_id       uuid not null references public.profiles(id),
  decision          public.review_decision not null,
  comments          text,
  decided_at        timestamptz not null default now()
);
```

`approval_records` is append-only. It is written only by the Edge Function / RPC that also verifies the caller is an assigned reviewer, then flips `review_requests.status` and the target's `status`. Clients never insert approval rows directly.

### 6.12 Audit and integrations

```sql
create table public.audit_logs (
  id          bigint generated always as identity primary key,
  actor_id    uuid references public.profiles(id) on delete set null,
  project_id  uuid references public.projects(id) on delete set null,
  action      text not null,
  entity_type text not null,
  entity_id   uuid,
  before      jsonb,
  after       jsonb,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create table public.integrations (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  provider   text not null,
  name       text not null,
  config     jsonb not null default '{}'::jsonb,  -- non-secret settings ONLY
  status     text not null default 'inactive' check (status in ('inactive','active','error')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Provider API keys, tokens, and passwords **must not** be stored in `integrations.config`. They belong in Edge Function secrets or Supabase Vault, referenced there by name.

### 6.13 Shared triggers

```sql
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply per table:
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
-- repeat for projects, project_members (no updated_at), system_models, model_versions (no updated_at),
-- requirements, system_components, system_interfaces, data_entities, generated_artifacts,
-- document_templates, generated_documents, diagrams, test_cases, review_requests, integrations

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### 6.14 Indexes

```sql
create index idx_project_members_user        on public.project_members(user_id);
create index idx_project_members_project     on public.project_members(project_id);
create index idx_projects_status             on public.projects(status);
create index idx_projects_owner              on public.projects(owner_id);
create index idx_system_models_project       on public.system_models(project_id);
create index idx_system_models_status        on public.system_models(status);
create index idx_model_versions_model        on public.model_versions(system_model_id);
create index idx_model_versions_status       on public.model_versions(status);
create index idx_requirements_version        on public.requirements(model_version_id);
create index idx_components_version          on public.system_components(model_version_id);
create index idx_interfaces_version          on public.system_interfaces(model_version_id);
create index idx_entities_version            on public.data_entities(model_version_id);
create index idx_artifacts_project           on public.generated_artifacts(project_id);
create index idx_artifacts_version           on public.generated_artifacts(model_version_id);
create index idx_artifacts_status            on public.generated_artifacts(status);
create index idx_documents_project           on public.generated_documents(project_id);
create index idx_documents_status            on public.generated_documents(status);
create index idx_document_versions_document  on public.document_versions(document_id);
create index idx_diagrams_project            on public.diagrams(project_id);
create index idx_diagrams_version            on public.diagrams(model_version_id);
create index idx_test_cases_project          on public.test_cases(project_id);
create index idx_test_cases_requirement      on public.test_cases(requirement_id);
create index idx_trace_project               on public.traceability_links(project_id);
create index idx_trace_source                on public.traceability_links(source_type, source_id);
create index idx_trace_target                on public.traceability_links(target_type, target_id);
create index idx_review_project              on public.review_requests(project_id);
create index idx_review_target               on public.review_requests(target_type, target_id);
create index idx_review_status               on public.review_requests(status);
create index idx_review_assignments_reviewer on public.review_assignments(reviewer_id);
create index idx_review_comments_request     on public.review_comments(review_request_id);
create index idx_approvals_review            on public.approval_records(review_request_id);
create index idx_audit_project_created       on public.audit_logs(project_id, created_at desc);
create index idx_audit_actor_created         on public.audit_logs(actor_id, created_at desc);
create index idx_integrations_project        on public.integrations(project_id);
```

### 6.15 Traceability views

```sql
create or replace view public.v_requirement_coverage
with (security_invoker = true) as
select
  r.id                as requirement_id,
  r.model_version_id,
  r.code              as requirement_code,
  r.title,
  count(tl.id) filter (where tl.target_type = 'test_case') as test_case_links,
  count(tl.id) filter (where tl.target_type = 'generated_artifact') as artifact_links,
  count(tl.id) filter (where tl.target_type = 'generated_document') as document_links
from public.requirements r
left join public.traceability_links tl
  on tl.source_type = 'requirement' and tl.source_id = r.id
group by r.id, r.model_version_id, r.code, r.title;

create or replace view public.v_outdated_documents
with (security_invoker = true) as
select
  d.id as document_id,
  d.project_id,
  d.title,
  d.model_version_id as generated_from_version,
  m.current_version_id as current_model_version
from public.generated_documents d
join public.system_models m
  on m.id = (select mv.system_model_id from public.model_versions mv where mv.id = d.model_version_id)
where d.model_version_id <> m.current_version_id
  and d.status = 'approved';
```

Views use `security_invoker = true` so caller RLS still applies (PostgreSQL 15+, available on Supabase).

---

## 7. Row Level Security

### 7.1 Rules

1. RLS is enabled on **every** table in `public` that the client can reach.
2. Helper functions are `security definer` with a fixed `search_path`, owned by the migration role, so they can read membership tables without recursive policy evaluation.
3. Policies are written for `authenticated` only. `anon` gets no access to application data.
4. Service-role bypasses RLS by design — that is why it stays server-side.
5. Deny by default: no policy means no access.

### 7.2 Helper functions

```sql
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.slug in ('super_admin','system_admin')
  );
$$;

create or replace function public.has_role(p_slug text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid() and r.slug = p_slug
  );
$$;

create or replace function public.has_permission(p_slug text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1
    from public.user_roles ur
    join public.role_permissions rp on rp.role_id = ur.role_id
    join public.permissions p on p.id = rp.permission_id
    where ur.user_id = auth.uid() and p.slug = p_slug
  );
$$;

create or replace function public.has_project_role(p_project_id uuid, p_roles public.project_role[])
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.project_members pm
    where pm.project_id = p_project_id
      and pm.user_id = auth.uid()
      and pm.project_role = any (p_roles)
  );
$$;

create or replace function public.can_access_project(p_project_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from public.project_members pm
    where pm.project_id = p_project_id and pm.user_id = auth.uid()
  ) or exists (
    select 1 from public.projects p
    where p.id = p_project_id and p.owner_id = auth.uid()
  );
$$;

create or replace function public.can_manage_project(p_project_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.is_admin()
    or exists (
      select 1 from public.projects p
      where p.id = p_project_id and p.owner_id = auth.uid()
    )
    or public.has_project_role(p_project_id, array['manager']::public.project_role[]);
$$;

create or replace function public.can_edit_model(p_project_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.has_permission('model.edit')
    and (public.is_admin() or public.has_project_role(
      p_project_id, array['manager','analyst']::public.project_role[]
    ));
$$;

-- Resolve the owning project/mode from a model version (used by child tables).
create or replace function public.model_version_project(p_version_id uuid)
returns uuid
language sql stable security definer
set search_path = public
as $$
  select sm.project_id
  from public.model_versions mv
  join public.system_models sm on sm.id = mv.system_model_id
  where mv.id = p_version_id;
$$;

create or replace function public.can_edit_model_version(p_version_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.can_edit_model(public.model_version_project(p_version_id))
     and exists (
       select 1 from public.model_versions mv
       where mv.id = p_version_id and mv.status in ('draft','rejected')
     );
$$;

create or replace function public.can_access_document(p_document_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.generated_documents d
    where d.id = p_document_id and public.can_access_project(d.project_id)
  );
$$;

-- Safe uuid parsing for Storage object paths shaped `{project_id}/...`
create or replace function public.safe_uuid(p_text text)
returns uuid
language plpgsql immutable
as $$
begin
  return p_text::uuid;
exception when others then
  return null;
end;
$$;

create or replace function public.storage_project_id(p_object_name text)
returns uuid
language sql stable
as $$
  select public.safe_uuid((storage.foldername(p_object_name))[1]);
$$;
```

### 7.3 Policy matrix

Use this table as the review checklist. `access` = `can_access_project(project_id)`, `manage` = `can_manage_project(project_id)`.

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | authenticated | trigger only | self or `is_admin()` | none (deactivate) |
| `roles` / `permissions` / `role_permissions` | authenticated | `is_admin()` | `is_admin()` | `is_admin()` |
| `user_roles` | self or `is_admin()` | `is_admin()` | `is_admin()` | `is_admin()` |
| `projects` | `access` | `has_permission('project.create')` | `manage` | none (archive) |
| `project_members` | `access` | `manage` | `manage` | `manage` |
| `system_models` | `access` | `can_edit_model(project_id)` | `can_edit_model(project_id)` | `manage` and `status='draft'` |
| `model_versions` | `access` via model | `can_edit_model(project_id)` | `can_edit_model_version(id)` | none |
| `requirements` / `system_components` / `system_interfaces` / `data_entities` | `access` via version | `can_edit_model_version(model_version_id)` | same | same |
| `generated_artifacts` | `access` | `has_permission('artifact.generate')` and `access` | `access` and `status='draft'` and `created_by=auth.uid()` | creator draft or `manage` |
| `document_templates` | authenticated and `is_active` (or admin) | `has_permission('document.template.manage')` | same | same |
| `generated_documents` | `access` | `has_permission('document.generate')` and `access` | creator draft or `has_permission('document.approve')` | none (supersede) |
| `document_versions` | `can_access_document(document_id)` | `can_access_document` and creator | creator draft or approver | none |
| `diagrams` | `access` | `has_permission('artifact.generate')` and `access` | creator draft or `manage` | creator draft or `manage` |
| `test_cases` | `access` | `can_edit_model` or `has_permission('traceability.manage')` | same | same |
| `traceability_links` | `access` | `has_permission('traceability.manage')` or `can_edit_model(project_id)` | same | same |
| `review_requests` | `access` | `has_permission('review.request')` and `access` | requester, `manage`, or assigned reviewer | none |
| `review_assignments` | assigned reviewer, requester, or `manage` | `has_permission('review.assign')` | assigned reviewer (own row) or `manage` | `manage` |
| `review_comments` | `access` and (`visibility='project'` or reviewer/manager) | `access` and `author_id=auth.uid()` | author only | author or admin |
| `approval_records` | `access` | Edge Function / RPC only | none | none |
| `audit_logs` | `is_admin()` or `has_permission('audit.view')` | triggers/service only | none | none |
| `integrations` | `is_admin()` or (`access` and `manage`) | `has_permission('integration.manage')` | same | same |

### 7.4 Example policies (pattern for every table)

```sql
alter table public.projects enable row level security;

create policy "projects_select_members"
  on public.projects for select to authenticated
  using (public.can_access_project(id));

create policy "projects_insert_permitted"
  on public.projects for insert to authenticated
  with check (
    public.has_permission('project.create')
    and created_by = auth.uid()
  );

create policy "projects_update_managers"
  on public.projects for update to authenticated
  using (public.can_manage_project(id))
  with check (public.can_manage_project(id));

alter table public.traceability_links enable row level security;

create policy "trace_select"
  on public.traceability_links for select to authenticated
  using (public.can_access_project(project_id));

create policy "trace_insert"
  on public.traceability_links for insert to authenticated
  with check (
    public.can_access_project(project_id)
    and created_by = auth.uid()
    and (
      public.has_permission('traceability.manage')
      or public.can_edit_model(project_id)
    )
  );
```

Apply the same three-part shape everywhere: `for select` with an access predicate, `for insert` with `with check` + identity, `for update` with both `using` and `with check`.

### 7.5 RLS pitfalls to avoid

- Never write a policy that queries the same table it protects without a `security definer` helper — that recurses.
- Never use `auth.jwt() ->> 'role'` as the permission model; the JWT only says `authenticated`.
- Never mark a helper `security definer` without `set search_path`.
- Never enable RLS but forget the `authenticated` grant; check with a real user token, not the dashboard SQL editor (which runs as `postgres` and bypasses RLS).

---

## 8. Storage

### 8.1 Buckets

| Bucket | Public | Contents | Path convention |
|---|---|---|---|
| `avatars` | yes | profile images | `{user_id}/avatar.{ext}` |
| `project-files` | no | source uploads, attachments | `{project_id}/{folder}/{filename}` |
| `generated-artifacts` | no | generator output archives | `{project_id}/{artifact_id}/{filename}` |
| `generated-documents` | no | rendered DOCX/PDF/HTML | `{project_id}/{document_id}/{version}/{filename}` |
| `diagrams` | no | SVG/PNG exports | `{project_id}/{diagram_id}/{filename}` |
| `templates` | no | document templates | `{template_id}/{filename}` |

Create buckets through a migration so environments stay reproducible:

```sql
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('project-files', 'project-files', false),
  ('generated-artifacts', 'generated-artifacts', false),
  ('generated-documents', 'generated-documents', false),
  ('diagrams', 'diagrams', false),
  ('templates', 'templates', false)
on conflict (id) do nothing;
```

### 8.2 Storage policies

```sql
-- Private project files: members read, editors write.
create policy "project_files_read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'project-files'
    and public.can_access_project(public.storage_project_id(name))
  );

create policy "project_files_write"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'project-files'
    and public.can_edit_model(public.storage_project_id(name))
    and owner_id = auth.uid()::text
  );

create policy "project_files_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'project-files'
    and public.can_manage_project(public.storage_project_id(name))
  );

-- Generated documents are written by generators (client-side with the user token)
create policy "generated_documents_rw"
  on storage.objects for all to authenticated
  using (
    bucket_id = 'generated-documents'
    and public.can_access_project(public.storage_project_id(name))
  )
  with check (
    bucket_id = 'generated-documents'
    and public.can_edit_model(public.storage_project_id(name))
  );
```

Repeat with the matching predicate for `generated-artifacts`, `diagrams`, and `templates` (templates: read for all authenticated, write for `has_permission('document.template.manage')`). Avatars: read public, write only under the caller's own user id:

```sql
create policy "avatars_write_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

### 8.3 File handling rules

- Validate MIME type and size in the client **and** rely on bucket restrictions (`file_size_limit`, `allowed_mime_types`).
- Upload path must always start with a UUID the caller can prove access to.
- Download restricted files with `createSignedUrl(path, 60)` — short-lived links, never public URLs for private buckets.
- Never `remove()` another user's object without a `manage` policy.
- Generated files are always written **before** the metadata row, so a failed upload leaves no orphan record. Delete the object on rollback.

---

## 9. Realtime

Use Realtime only where live update changes behavior. Do not substitute polling for Supabase features that are already realtime, and do not subscribe to entire tables out of convenience.

```sql
alter publication supabase_realtime add table
  public.review_requests,
  public.review_comments,
  public.approval_records,
  public.generated_documents,
  public.generated_artifacts,
  public.diagrams;
```

Typical subscriptions:

| Feature | Channel | Event |
|---|---|---|
| Review inbox / status badge | `postgres_changes` on `review_requests` filtered by `project_id` | `*` |
| Review thread | `postgres_changes` on `review_comments` filtered by `review_request_id` | `INSERT` |
| Approval state | `postgres_changes` on `approval_records` | `INSERT` |
| Generation progress | `broadcast` private channel `project:{id}:generation` | custom payload |
| Document list badge | `postgres_changes` on `generated_documents` filtered by `project_id` | `INSERT`, `UPDATE` |

Client helper rules:

```ts
// lib/supabase/realtime.ts
supabase
  .channel(`project:${projectId}:reviews`)
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "review_requests", filter: `project_id=eq.${projectId}` },
    handler,
  )
  .subscribe();
```

- Always remove the channel on unmount (`supabase.removeChannel(channel)`).
- `postgres_changes` runs under the subscriber's RLS; verify with a restricted user, not only an admin.
- Use private channels (`realtime.messages` policies) for broadcast/presence that must be scoped by project membership.
- Never broadcast confidential document content; broadcast IDs and let the client fetch through RLS.

---

## 10. Edge Functions

Only these categories justify an Edge Function. Everything else uses the client SDK.

| Function | Purpose | Why it cannot be client-side |
|---|---|---|
| `admin-users` | create/deactivate users, assign global roles | requires service-role Admin API |
| `approve-item` | transactional approval: insert `approval_records`, update target + request status, write audit log | must be atomic and trusted; prevents self-approval bypass |
| `generate-document` | server-side DOCX/PDF rendering when browser output is insufficient or the template is large | trusted heavy processing (optional) |
| `ai-assist` | AI drafting/summarization | provider secret key |
| `integrity-scan` | traceability gaps, outdated documents, orphan detection | scheduled trusted job |
| `notify` | email/webhook notifications | provider secret |

### 10.1 Function rules

1. Verify the caller: `const { data: { user } } = await supabase.auth.getUser()` with the request's `Authorization` header. Reject anonymous.
2. Build a **user-scoped** client to check authorization through RLS, or re-check the same predicates explicitly.
3. Use the service-role client only for the privileged step, never to bypass a check you did not perform.
4. Validate input with `zod`. Reject unknown fields.
5. Never log secrets, tokens, or patient data.
6. Return `{ data }` or `{ error: { code, message } }`. No stack traces to the client.
7. Prefer one RPC (`create or replace function`) when the logic is pure SQL — Postgres functions are cheaper than a function invocation.

### 10.2 Approval function contract

```
approve-item(before: { review_request_id, decision, comments })

1. Auth: caller must have an assignment row on the request.
2. Reject if the caller is the requester (no self-approval).
3. Insert into approval_records.
4. Recompute approvals: if approvals needed met → request.status='approved', target.status='approved';
   if any rejection → 'rejected'; else 'in_review'.
5. Write audit_logs.
6. Return the updated request.
```

Store the transactional part in a Postgres function (`public.approve_review_item`) invoked by the Edge Function, so the operation is atomic even under retries.

### 10.3 Secrets

```bash
npx supabase secrets set AI_PROVIDER_API_KEY=...
npx supabase secrets list
```

`SUPABASE_SERVICE_ROLE_KEY` is injected automatically into the Edge Function runtime. It must never be copied into frontend env or returned in a response.

---

## 11. Error Handling Contract

Every data operation returns one of four UI states:

| State | Trigger | UI |
|---|---|---|
| Loading | request in flight | skeleton or spinner |
| Empty | zero rows, no error | empty state with next action |
| Success | rows or mutation result | data / toast |
| Error | `error` object | inline message + retry |

Rules:

- Map Postgres error codes to friendly messages. `23503` (FK) and `23505` (unique) are normal validation errors, not crashes.
- RLS denial returns **zero rows**, not an error. Distinguish "empty" from "not allowed" by checking membership before rendering a page (and still rely on RLS for the data).
- Never swallow errors. Never render `error.message` from Postgres verbatim to end users.
- Never retry mutations blindly; mutations are not idempotent unless the schema says so.

---

## 12. Feature → Supabase Mapping

| Module (`PROJECT.MD` §4) | Tables | Storage | Realtime | Edge Function |
|---|---|---|---|---|
| 4.1 Auth & users | `profiles`, `roles`, `permissions`, `role_permissions`, `user_roles` | `avatars` | — | `admin-users` |
| 4.2 Projects | `projects`, `project_members` | `project-files` | — | — |
| 4.3 System modeling | `system_models`, `model_versions`, model detail tables | `project-files` | optional | — |
| 4.4 System generator | `generated_artifacts` | `generated-artifacts` | broadcast progress | optional |
| 4.5 Documentation | `document_templates`, `generated_documents`, `document_versions` | `templates`, `generated-documents` | `generated_documents` | `generate-document` |
| 4.6 Diagrams | `diagrams` | `diagrams` | optional | — |
| 4.7 Versioning | `model_versions`, `document_versions`, artifact/diagram `version_no` | all versioned paths | — | — |
| 4.8 Traceability | `traceability_links`, `test_cases`, coverage views | — | — | `integrity-scan` |
| 4.9 Reviews | `review_requests`, `review_assignments`, `review_comments`, `approval_records` | — | review tables | `approve-item` |
| 4.10 Portal | `generated_documents`, `document_versions` | `generated-documents` | — | — |
| Audit | `audit_logs` | — | — | triggers + functions |
| AI assistance | — | — | — | `ai-assist` |

---

## 13. Security Checklist

- [ ] RLS enabled on every `public` table and every `storage.objects` policy path.
- [ ] `anon` has no policy granting application data.
- [ ] Public sign-up disabled; accounts provisioned by an administrator.
- [ ] Service-role key absent from all client bundles (verify with a production build grep).
- [ ] Every helper is `security definer` with a pinned `search_path`.
- [ ] Policies tested with: unauthenticated, viewer, member-editor, reviewer, project manager, system admin.
- [ ] Private buckets verified via signed URL only.
- [ ] Upload MIME/size validated server-side by bucket config.
- [ ] Audit rows written for create/update/approve/archive on critical entities.
- [ ] `approval_records` has no direct client insert policy.
- [ ] No real patient data in seeds, fixtures, or tests.
- [ ] Security-definer functions reviewed for privilege escalation.
- [ ] `supabase db lint` clean; migrations reviewed.

---

## 14. Testing

### 14.1 RLS test pattern

Run inside a transaction and reset with `rollback`, so the test never mutates data:

```sql
begin;

-- impersonate a user
set local role authenticated;
set local request.jwt.claims = '{"sub":"<user-uuid>","role":"authenticated"}';

select count(*) from public.projects;                       -- expect: only member projects
select * from public.generated_documents;                   -- expect: 0 rows for non-member
select public.can_manage_project('<project-uuid>');          -- expect: false for viewer

rollback;
```

Required cases for each table:

1. Non-member cannot `select`, `insert`, `update`, or `delete`.
2. Viewer can read, cannot write.
3. Analyst/manager can write model data within their project only.
4. Reviewer can read review targets and comment, cannot approve their own request.
5. System admin can administer; normal user cannot read `audit_logs`.
6. Storage: non-member cannot download another project's file; signed URL works for a member.

Automate with `pgTAP` (`supabase test db`) or a Vitest suite that runs the SQL above through `psql` in CI. A feature is not secure because its page is hidden.

### 14.2 Integration tests

- Auth: sign-in, sign-out, session refresh across a hard reload, password reset.
- CRUD: project → model → version → requirement → artifact → document → diagram.
- Generation: browser export produces a file, metadata row matches `storage_path` and checksum.
- Approval: standard mode completes with one reviewer; complex mode blocks until the required count is met.
- Traceability: coverage view reports a requirement without a test link; integrity scan finds it.
- Realtime: two clients see a review status change within the subscription.

### 14.3 Definition of Done for any Supabase change

- [ ] Migration added, `db reset` passes, types regenerated.
- [ ] RLS policies added and tested for at least three roles.
- [ ] Indexes added for every new FK and filter column.
- [ ] Storage policies added when a bucket path is introduced.
- [ ] Client code uses the shared client module and `zod` validation.
- [ ] Loading / empty / success / error states handled.
- [ ] Documentation (`PROJECT.MD` change log or this file) updated.
- [ ] `npm run lint` and `npm run build` pass.

---

## 15. Bootstrap Checklist (Phase 2 Start)

1. `npm install` — this repository currently has no `node_modules`.
2. Create the Supabase project; copy URL and publishable key into `.env.local`.
3. Add `@supabase/supabase-js`, `@supabase/ssr`, `zod`, and the `supabase` CLI.
4. `npx supabase init` and `npx supabase start`.
5. Add migrations in the order from §5.3, RLS included from the first table.
6. `npx supabase db reset` until clean.
7. `npx supabase gen types typescript --local > types/supabase.ts`.
8. Implement `lib/supabase/{client,server,proxy}.ts` and root `proxy.ts` (Next.js 16 naming).
9. Build `/login`, `/logout`, and the profile bootstrap flow; verify the `auth.users` trigger creates a `profiles` row.
10. Seed roles, permissions, and a single synthetic administrator. No real patient data.
11. Write the RLS test suite and wire it into CI before feature work expands.
12. Implement modules in `PROJECT.MD` order: projects → models → generation → documents → diagrams → traceability → reviews → portal → audit.

---

## 16. Change Control

- Any schema or policy change ships as a migration plus a type regeneration in the same PR.
- Any change to the access model updates §7 of this document.
- Any new bucket or path convention updates §8.
- Any new Edge Function updates §10 with its authorization contract.
- If a requirement cannot be met with Supabase primitives, document the gap here before adding anything outside the approved architecture. `PROJECT.MD` §16 remains the final authority.
