# SUPABASE.md — Hospital Management System Implementation Specification

**Project:** SPMC Hospital Management System (HMS)  
**Institution:** Southern Philippines Medical Center (SPMC)  
**Backend Platform:** Supabase  
**Database:** PostgreSQL  
**Frontend:** React + TypeScript + Tailwind CSS  
**Architecture:** Supabase Direct Client Integration

---

# 1. Document Purpose & Architecture Rules

## 1.1 Purpose

This document defines the complete Supabase implementation architecture for the Hospital Management System.

`PROJECT.md` defines the functional requirements, modules, workflows, and business rules.

`THEME.md` defines the interface design system, visual identity, and UI/UX standards.

`SUPABASE.md` defines the backend implementation, including:

- PostgreSQL database schema
- Table relationships
- Authentication
- Role-based access control
- Row Level Security (RLS)
- Storage buckets and policies
- Realtime subscriptions
- Database functions and triggers
- Edge Functions
- Migrations
- Type generation
- Security testing
- Deployment procedures

If the documents conflict:

1. `PROJECT.md` is the source of truth for system functionality.
2. `THEME.md` is the source of truth for visual presentation.
3. `SUPABASE.md` is the source of truth for Supabase implementation.

## 1.2 Non-Negotiable Architecture

**Supabase is the only backend.**

The frontend communicates directly with Supabase using:

- `@supabase/supabase-js`
- `@supabase/ssr`

Supabase provides:

- PostgreSQL database
- Authentication
- Row Level Security
- File storage
- Realtime subscriptions
- Database functions
- Edge Functions

Do not introduce another backend.

### Forbidden Architecture

Do not implement:

- Express.js REST API
- FastAPI backend
- Standalone Node.js API server
- Python backend server
- Separate authentication server
- Separate database server
- Custom REST API proxies for Supabase
- Separate ORM-based database layer
- Another file-upload service

Do not create `/api/*` route handlers simply to forward ordinary database requests to Supabase.

Next.js Server Components and Server Actions may be used for frontend rendering and application workflows, but they must not become a replacement backend or bypass Supabase authorization.

## 1.3 Database Security Principles

- Enable RLS on every application table exposed through Supabase.
- Use authenticated users for normal application access.
- Enforce authorization at the database level.
- Never trust frontend-only role checks.
- Never expose the service-role key in browser code.
- Never allow unauthorized users to access patient records by changing URLs or IDs.
- Keep clinical, financial, and administrative records protected.
- Maintain audit records for sensitive operations.
- Use database transactions for multi-step operations that must succeed or fail together.

## 1.4 Supabase Key Rules

Only the publishable key may be used in the browser.

The service-role key must never be included in:

- React components
- Browser JavaScript
- Client-side environment variables
- Public GitHub repositories
- Frontend bundles
- Browser network responses

Privileged operations must use authorized Edge Functions and properly protected secrets.

---

# 2. Technology Stack & Dependencies

## 2.1 Approved Stack

| Component | Technology |
|---|---|
| Frontend Framework | Next.js / React |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Backend Platform | Supabase |
| Database | PostgreSQL |
| Authentication | Supabase Auth |
| Authorization | PostgreSQL RLS |
| File Storage | Supabase Storage |
| Realtime | Supabase Realtime |
| Input Validation | Zod |
| Database Client | Supabase JavaScript SDK |
| SSR Integration | Supabase SSR |
| Database Migrations | Supabase CLI |
| Database Types | Supabase Type Generation |

Use the existing repository versions rather than arbitrarily upgrading dependencies.

## 2.2 Required Packages

```bash
npm install @supabase/supabase-js @supabase/ssr zod

npm install -D supabase
```

Package responsibilities:

- `@supabase/supabase-js` — Database queries, authentication, storage, and realtime.
- `@supabase/ssr` — Cookie-based authentication for server-rendered Next.js applications.
- `zod` — Input validation before database mutations.
- `supabase` — Supabase CLI for local development, migrations, and type generation.

Do not add a separate ORM or authentication provider.

---

# 3. Environment Configuration

## 3.1 Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co

NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Only the Supabase URL and publishable key belong in the frontend environment.

For privileged Edge Function operations, configure secrets separately:

```bash
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

Additional third-party provider secrets must also be stored through the appropriate secure secret-management mechanism.

## 3.2 Environment Rules

1. Never commit `.env.local`.
2. Never prefix secret keys with `NEXT_PUBLIC_`.
3. Never place the service-role key in the Next.js application environment.
4. Never hardcode Supabase credentials.
5. Keep `.env.example` with empty placeholder values.
6. Validate required public environment variables during application initialization.

Example `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

---

# 4. Supabase Client Architecture

## 4.1 Recommended Directory Structure

```text
src/
├── lib/
│   └── supabase/
│       ├── client.ts
│       ├── server.ts
│       ├── proxy.ts
│       ├── storage.ts
│       ├── realtime.ts
│       └── queries/
│           ├── patients.ts
│           ├── appointments.ts
│           ├── admissions.ts
│           ├── medical-records.ts
│           ├── staff.ts
│           ├── nursing.ts
│           ├── laboratory.ts
│           ├── radiology.ts
│           ├── pharmacy.ts
│           ├── billing.ts
│           ├── inventory.ts
│           ├── reports.ts
│           └── users.ts
│
├── types/
│   └── supabase.ts
│
└── proxy.ts
```

Keep the project’s existing directory convention if it differs. Do not duplicate Supabase clients.

## 4.2 Browser Client

File: `src/lib/supabase/client.ts`

```ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function getSupabaseBrowserClient() {
  client ??= createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  return client;
}
```

Rules:

- Reuse the browser client.
- Do not instantiate it inside frequently rendered components.
- Use generated database types.
- Never use the service-role key in the browser.

## 4.3 Server Client

File: `src/lib/supabase/server.ts`

```ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

export async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Cookie writes may not be available during Server Component rendering.
            // Session refresh is handled by the root proxy.
          }
        },
      },
    }
  );
}
```

The server client must retain the authenticated user's identity and RLS permissions.

Never replace the user's client with a service-role client for ordinary feature operations.

## 4.4 Authentication Session Refresh

Use the root `proxy.ts` file for Next.js versions that use the Proxy convention.

File: `src/lib/supabase/proxy.ts`

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/supabase";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  await supabase.auth.getUser();

  return response;
}
```

Root `proxy.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);

  const {
    data: { user },
  } = await (
    await import("@/lib/supabase/server")
  ).getSupabaseServerClient().then((client) => client.auth.getUser());

  const pathname = request.nextUrl.pathname;

  const isLogin = pathname.startsWith("/login");
  const isPublicAsset =
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico";

  if (!user && !isLogin && !isPublicAsset) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)",
  ],
};
```

Implementation note:

The root Proxy should use the same request-scoped session refresh pattern and must avoid creating conflicting cookie contexts. Follow the installed Next.js and Supabase SSR version's recommended implementation. If the project uses a different Next.js major version, adapt the filename and export convention accordingly.

**Route protection is only a UX layer. RLS remains the actual security boundary.**

---

# 5. Database Design Principles

## 5.1 Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Tables | Plural snake_case | `patients` |
| Columns | snake_case | `created_at` |
| Primary Keys | UUID | `id` |
| Foreign Keys | UUID with `_id` | `patient_id` |
| Timestamps | timestamptz | `updated_at` |
| Boolean Columns | is_/has_ | `is_active` |
| PostgreSQL Functions | snake_case | `create_admission` |
| Enums | snake_case | `appointment_status` |

The implementation in `supabase/schema.sql` promotes every fixed-value state column to a PostgreSQL enum type. Enum values are part of the API contract; append values with `ALTER TYPE ... ADD VALUE` in a new migration instead of editing an applied migration.

## 5.2 Common Column Standards

Most application tables should use:

```sql
id uuid primary key default gen_random_uuid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
```

Use `updated_at` only when the record is mutable.

Use `created_by` and `updated_by` where accountability is required. The `set_updated_at()` trigger stamps `updated_by` from `auth.uid()` when the column exists, and preserves the previous value for migrations, seeds, and privileged maintenance jobs.

Use `timestamptz` for dates and timestamps that represent actual moments in time.

Use `date` for calendar-only values such as date of birth.

## 5.3 Philippine Healthcare Data Considerations

- Store dates consistently using PostgreSQL date and timestamp types.
- Display local hospital dates and times using the `Asia/Manila` timezone.
- Store currency as `numeric`, never floating-point.
- Use explicit measurement units for clinical values.
- Use generated or controlled identifiers for medical record numbers.
- Do not use a patient's name as a unique identifier.
- Do not assume that every patient has an email address.
- Do not assume that every patient has a mobile number.
- Treat medical record numbers as identifiers, not authentication credentials.

---

# 6. Database Relationship Overview

The HMS database is organized into the following domains.

```text
AUTHENTICATION
    auth.users
        |
        | 1:1
        v
    profiles
        |
        +---- user_roles ---- roles
        |                       |
        |                       +---- role_permissions ---- permissions
        |
        +---- staff_profiles
                    |
                    +---- departments

PATIENT MANAGEMENT
    patients
        |
        +---- patient_contacts
        |
        +---- emergency_contacts
        |
        +---- patient_allergies
        |
        +---- medical_histories
        |
        +---- appointments
        |
        +---- admissions
        |       |
        |       +---- rooms
        |       |
        |       +---- beds
        |
        +---- encounters
                |
                +---- vital_signs
                |
                +---- diagnoses
                |
                +---- clinical_notes
                |
                +---- prescriptions
                |
                +---- laboratory_orders
                |
                +---- radiology_orders

LABORATORY
    laboratory_orders
        |
        +---- laboratory_order_items
        |
        +---- laboratory_results
        |
        +---- laboratory_specimens

PHARMACY
    prescriptions
        |
        +---- prescription_items
        |
        +---- medication_dispenses

INVENTORY
    inventory_items
        |
        +---- inventory_batches
        |
        +---- stock_transactions

BILLING
    patients
        |
        +---- invoices
                |
                +---- invoice_items
                |
                +---- payments
                |
                +---- payment_transactions

SYSTEM ACCOUNTABILITY
    profiles
        |
        +---- audit_logs
```

All relationships must be enforced using actual PostgreSQL foreign keys wherever possible.

### Foreign Key Delete Policy

- `on delete cascade` is limited to authentication identity rows, role join rows, staff-department assignment history, and notifications.
- Every patient, clinical, diagnostic, pharmacy, inventory, billing, and audit relationship uses `on delete restrict`.
- Patient and clinical records are never deleted as a side effect of deleting a parent row. Use status transitions and archive workflows instead.
- A direct `delete from public.patients` must fail while any dependent record exists.

---

# 7. Authentication, Profiles & Role-Based Access Control

## 7.1 Identity Architecture

Supabase Auth owns authentication.

Use:

- `auth.users` for authentication identity.
- `public.profiles` for application profile information.
- `public.roles` for system roles.
- `public.permissions` for individual permissions.
- `public.user_roles` for role assignments.
- `public.role_permissions` for role-to-permission relationships.

## 7.2 Profiles Table

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  email text not null,
  full_name text not null,

  avatar_path text,
  contact_number text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

The profile is not the authentication credential store.

Never store passwords in `profiles`.

## 7.3 Roles Table

```sql
create table public.roles (
  id uuid primary key default gen_random_uuid(),

  slug text not null unique,
  name text not null,
  description text,

  is_system boolean not null default true,

  created_at timestamptz not null default now()
);
```

## 7.4 Permissions Table

```sql
create table public.permissions (
  id uuid primary key default gen_random_uuid(),

  slug text not null unique,
  description text,

  created_at timestamptz not null default now()
);
```

## 7.5 Role Permissions

```sql
create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,

  primary key (role_id, permission_id)
);
```

## 7.6 User Roles

```sql
create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,

  granted_by uuid references public.profiles(id),

  created_at timestamptz not null default now(),

  primary key (user_id, role_id)
);
```

## 7.7 Approved System Roles

Seed these roles:

| Role Slug | Display Name |
|---|---|
| `super_admin` | Super Administrator |
| `hospital_admin` | Hospital Administrator |
| `receptionist` | Receptionist |
| `physician` | Physician / Doctor |
| `nurse` | Nurse |
| `laboratory_staff` | Laboratory Staff |
| `radiology_staff` | Radiology Staff |
| `pharmacist` | Pharmacist |
| `billing_staff` | Billing Staff |
| `inventory_staff` | Inventory Staff |

Do not grant every role to every authenticated user.

A staff account must receive an authorized role assignment.

## 7.8 Staff Profiles

```sql
create table public.staff_profiles (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null unique references public.profiles(id) on delete cascade,

  staff_number text not null unique,

  first_name text not null,
  middle_name text,
  last_name text not null,

  department_id uuid,

  employment_type text,
  professional_license_number text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Staff-specific professional information must only be accessible to authorized users.

---

# 8. Hospital Reference Tables

## 8.1 Departments

```sql
create table public.departments (
  id uuid primary key default gen_random_uuid(),

  code text not null unique,
  name text not null unique,
  description text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 8.2 Physicians

```sql
create table public.physicians (
  id uuid primary key default gen_random_uuid(),

  staff_id uuid not null unique references public.staff_profiles(id),

  specialty text,
  license_number text not null unique,

  is_available boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 8.3 Department Assignments

```sql
create table public.staff_department_assignments (
  id uuid primary key default gen_random_uuid(),

  staff_id uuid not null references public.staff_profiles(id) on delete cascade,
  department_id uuid not null references public.departments(id),

  assigned_at timestamptz not null default now(),
  ended_at timestamptz,

  created_at timestamptz not null default now()
);
```

## 8.4 Rooms

```sql
create table public.rooms (
  id uuid primary key default gen_random_uuid(),

  room_number text not null,
  department_id uuid not null references public.departments(id),

  room_type text,
  floor_number text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (department_id, room_number)
);
```

## 8.5 Beds

```sql
create table public.beds (
  id uuid primary key default gen_random_uuid(),

  room_id uuid not null references public.rooms(id),

  bed_number text not null,

  status text not null default 'available'
    check (status in ('available', 'occupied', 'maintenance', 'reserved')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (room_id, bed_number)
);
```

Bed occupancy must be controlled through admission transactions, not arbitrary frontend status updates.

---

# 9. Patient Management Schema

## 9.1 Patients

```sql
create table public.patients (
  id uuid primary key default gen_random_uuid(),

  medical_record_number text not null unique,

  first_name text not null,
  middle_name text,
  last_name text not null,
  suffix text,

  date_of_birth date,
  sex text,

  civil_status text,
  nationality text,

  contact_number text,
  email text,

  address_line text,
  barangay text,
  city text,
  province text,
  postal_code text,

  registration_date timestamptz not null default now(),

  registration_status text not null default 'active'
    check (registration_status in ('active', 'inactive', 'archived')),

  created_by uuid not null references public.profiles(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Medical record number generation must be handled by a database function or controlled registration transaction.

Do not generate unique medical record numbers solely through frontend timestamps or random strings.

## 9.2 Patient Emergency Contacts

```sql
create table public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),

  patient_id uuid not null references public.patients(id) on delete restrict,

  full_name text not null,
  relationship text,
  contact_number text not null,
  address text,

  is_primary boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 9.3 Patient Allergies

```sql
create table public.patient_allergies (
  id uuid primary key default gen_random_uuid(),

  patient_id uuid not null references public.patients(id) on delete restrict,

  allergen text not null,
  reaction text,
  severity text,

  notes text,

  recorded_by uuid not null references public.profiles(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 9.4 Medical Histories

```sql
create table public.medical_histories (
  id uuid primary key default gen_random_uuid(),

  patient_id uuid not null references public.patients(id) on delete restrict,

  history_type text not null,
  description text not null,

  recorded_by uuid not null references public.profiles(id),

  recorded_at timestamptz not null default now(),

  created_at timestamptz not null default now()
);
```

Medical history must not be silently overwritten.

Use additional records or controlled corrections with audit history.

---

# 10. Appointment Management Schema

## 10.1 Appointments

```sql
create table public.appointments (
  id uuid primary key default gen_random_uuid(),

  appointment_number text not null unique,

  patient_id uuid not null references public.patients(id),

  department_id uuid not null references public.departments(id),

  physician_id uuid references public.physicians(id),

  scheduled_at timestamptz not null,
  duration_minutes integer not null default 30
    check (duration_minutes > 0),

  appointment_type text,
  reason_for_visit text,

  status text not null default 'scheduled'
    check (
      status in (
        'scheduled',
        'confirmed',
        'waiting',
        'in_consultation',
        'completed',
        'cancelled',
        'no_show'
      )
    ),

  notes text,

  created_by uuid not null references public.profiles(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 10.2 Appointment Rules

- A patient may have multiple appointments.
- An appointment belongs to a department.
- An appointment may be assigned to a physician.
- Appointment scheduling must validate availability.
- Concurrent scheduling must not create conflicting physician schedules.
- Appointment status changes must be validated.
- Cancellation must retain historical appointment information.

Use a PostgreSQL transaction or database function when schedule validation and appointment creation must be atomic.

---

# 11. Admission, Discharge & Transfer Schema

## 11.1 Admissions

```sql
create table public.admissions (
  id uuid primary key default gen_random_uuid(),

  admission_number text not null unique,

  patient_id uuid not null references public.patients(id),

  attending_physician_id uuid references public.physicians(id),

  department_id uuid not null references public.departments(id),

  admission_date timestamptz not null default now(),
  discharge_date timestamptz,

  admission_type text,

  status text not null default 'admitted'
    check (
      status in (
        'admitted',
        'transferred',
        'discharged',
        'cancelled'
      )
    ),

  admission_notes text,
  discharge_notes text,

  admitted_by uuid not null references public.profiles(id),
  discharged_by uuid references public.profiles(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 11.2 Admission Bed Assignments

```sql
create table public.admission_bed_assignments (
  id uuid primary key default gen_random_uuid(),

  admission_id uuid not null references public.admissions(id),

  bed_id uuid not null references public.beds(id),

  assigned_at timestamptz not null default now(),
  released_at timestamptz,

  assigned_by uuid not null references public.profiles(id),

  created_at timestamptz not null default now()
);
```

## 11.3 Patient Transfers

```sql
create table public.patient_transfers (
  id uuid primary key default gen_random_uuid(),

  admission_id uuid not null references public.admissions(id),

  from_bed_id uuid references public.beds(id),
  to_bed_id uuid not null references public.beds(id),

  transfer_reason text,

  transferred_by uuid not null references public.profiles(id),

  transferred_at timestamptz not null default now(),

  created_at timestamptz not null default now()
);
```

## 11.4 Admission Transaction Rules

The following operations must be atomic:

1. Validate patient admission eligibility.
2. Lock the selected bed.
3. Verify that the bed is available.
4. Create the admission record.
5. Create the bed assignment.
6. Mark the bed as occupied.
7. Record the responsible staff member.
8. Commit the transaction.

Discharge must:

1. Validate that the admission is active.
2. Record the discharge date and authorized user.
3. Close the active bed assignment.
4. Release the bed.
5. Update admission status.
6. Record the operation in the audit log.

Use PostgreSQL functions for these operations.

Never implement bed allocation as unrelated frontend updates.

---

# 12. Electronic Medical Records Schema

## 12.1 Clinical Encounters

```sql
create table public.encounters (
  id uuid primary key default gen_random_uuid(),

  encounter_number text not null unique,

  patient_id uuid not null references public.patients(id),

  appointment_id uuid references public.appointments(id),
  admission_id uuid references public.admissions(id),

  physician_id uuid references public.physicians(id),

  department_id uuid not null references public.departments(id),

  encounter_type text not null,

  chief_complaint text,

  clinical_status text not null default 'open'
    check (
      clinical_status in (
        'open',
        'in_progress',
        'completed',
        'cancelled'
      )
    ),

  started_at timestamptz not null default now(),
  completed_at timestamptz,

  created_by uuid not null references public.profiles(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 12.2 Vital Signs

```sql
create table public.vital_signs (
  id uuid primary key default gen_random_uuid(),

  patient_id uuid not null references public.patients(id),
  encounter_id uuid not null references public.encounters(id),

  systolic_bp numeric,
  diastolic_bp numeric,

  heart_rate numeric,
  respiratory_rate numeric,

  temperature numeric,
  oxygen_saturation numeric,

  weight_kg numeric,
  height_cm numeric,

  recorded_by uuid not null references public.profiles(id),

  recorded_at timestamptz not null default now(),

  created_at timestamptz not null default now()
);
```

## 12.3 Diagnoses

```sql
create table public.diagnoses (
  id uuid primary key default gen_random_uuid(),

  patient_id uuid not null references public.patients(id),
  encounter_id uuid not null references public.encounters(id),

  diagnosis_code text,
  diagnosis_name text not null,

  diagnosis_type text,
  clinical_notes text,

  is_primary boolean not null default false,

  recorded_by uuid not null references public.profiles(id),

  recorded_at timestamptz not null default now(),

  created_at timestamptz not null default now()
);
```

## 12.4 Clinical Notes

```sql
create table public.clinical_notes (
  id uuid primary key default gen_random_uuid(),

  patient_id uuid not null references public.patients(id),
  encounter_id uuid not null references public.encounters(id),

  note_type text not null,
  content text not null,

  status text not null default 'draft'
    check (status in ('draft', 'finalized', 'amended')),

  authored_by uuid not null references public.profiles(id),

  finalized_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Clinical notes must support controlled finalization and amendment workflows.

Finalized clinical records must not be silently overwritten.

## 12.5 Clinical Documentation Rules

- Record the responsible staff member.
- Record timestamps.
- Maintain historical clinical information.
- Restrict access according to role and patient-care authorization.
- Do not allow unauthorized users to modify diagnoses.
- Do not automatically invent diagnoses or treatment plans.
- Do not expose clinical data through public Storage URLs.

---

# 13. Nursing Management Schema

## 13.1 Nursing Assessments

```sql
create table public.nursing_assessments (
  id uuid primary key default gen_random_uuid(),

  patient_id uuid not null references public.patients(id),
  encounter_id uuid not null references public.encounters(id),

  assessment_type text not null,
  assessment_data jsonb not null default '{}'::jsonb,

  notes text,

  assessed_by uuid not null references public.profiles(id),

  assessed_at timestamptz not null default now(),

  created_at timestamptz not null default now()
);
```

## 13.2 Nursing Care Notes

```sql
create table public.nursing_notes (
  id uuid primary key default gen_random_uuid(),

  patient_id uuid not null references public.patients(id),
  encounter_id uuid not null references public.encounters(id),

  note text not null,

  recorded_by uuid not null references public.profiles(id),

  recorded_at timestamptz not null default now(),

  created_at timestamptz not null default now()
);
```

Nursing assessments and nursing notes must be accessible only to appropriately authorized staff.

---

# 14. Laboratory Management Schema

## 14.1 Laboratory Tests

```sql
create table public.laboratory_tests (
  id uuid primary key default gen_random_uuid(),

  test_code text not null unique,
  test_name text not null,

  category text,
  description text,

  specimen_type text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 14.2 Laboratory Orders

```sql
create table public.laboratory_orders (
  id uuid primary key default gen_random_uuid(),

  order_number text not null unique,

  patient_id uuid not null references public.patients(id),
  encounter_id uuid not null references public.encounters(id),

  ordered_by uuid not null references public.profiles(id),

  priority text not null default 'routine'
    check (priority in ('routine', 'urgent', 'stat')),

  status text not null default 'pending'
    check (
      status in (
        'pending',
        'collection',
        'processing',
        'completed',
        'cancelled'
      )
    ),

  ordered_at timestamptz not null default now(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 14.3 Laboratory Order Items

```sql
create table public.laboratory_order_items (
  id uuid primary key default gen_random_uuid(),

  order_id uuid not null references public.laboratory_orders(id) on delete restrict,

  test_id uuid not null references public.laboratory_tests(id),

  status text not null default 'pending',

  created_at timestamptz not null default now()
);
```

## 14.4 Laboratory Specimens

```sql
create table public.laboratory_specimens (
  id uuid primary key default gen_random_uuid(),

  order_id uuid not null references public.laboratory_orders(id),

  specimen_type text not null,

  collection_status text not null default 'pending'
    check (
      collection_status in (
        'pending',
        'collected',
        'rejected'
      )
    ),

  collected_by uuid references public.profiles(id),

  collected_at timestamptz,

  notes text,

  created_at timestamptz not null default now()
);
```

## 14.5 Laboratory Results

```sql
create table public.laboratory_results (
  id uuid primary key default gen_random_uuid(),

  order_item_id uuid not null references public.laboratory_order_items(id),

  result_value text,
  result_unit text,
  reference_range text,

  interpretation text,

  verification_status text not null default 'pending'
    check (
      verification_status in (
        'pending',
        'verified',
        'rejected'
      )
    ),

  performed_by uuid references public.profiles(id),
  verified_by uuid references public.profiles(id),

  performed_at timestamptz,
  verified_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Only authorized laboratory personnel may enter and verify results.

Result verification must be a controlled workflow.

---

# 15. Radiology Management Schema

## 15.1 Radiology Orders

```sql
create table public.radiology_orders (
  id uuid primary key default gen_random_uuid(),

  order_number text not null unique,

  patient_id uuid not null references public.patients(id),
  encounter_id uuid not null references public.encounters(id),

  examination_type text not null,
  body_part text,

  ordered_by uuid not null references public.profiles(id),

  scheduled_at timestamptz,

  status text not null default 'pending'
    check (
      status in (
        'pending',
        'scheduled',
        'in_progress',
        'completed',
        'cancelled'
      )
    ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 15.2 Radiology Reports

```sql
create table public.radiology_reports (
  id uuid primary key default gen_random_uuid(),

  order_id uuid not null references public.radiology_orders(id),

  report_content text,

  report_status text not null default 'draft'
    check (
      report_status in (
        'draft',
        'verified',
        'amended'
      )
    ),

  reported_by uuid references public.profiles(id),
  verified_by uuid references public.profiles(id),

  reported_at timestamptz,
  verified_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Radiology reports and related files must be protected by patient-level access policies.

---

# 16. Pharmacy & Prescription Schema

## 16.1 Medications

```sql
create table public.medications (
  id uuid primary key default gen_random_uuid(),

  medication_code text not null unique,

  generic_name text not null,
  brand_name text,

  strength text,
  dosage_form text,

  unit text,

  description text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 16.2 Prescriptions

```sql
create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),

  prescription_number text not null unique,

  patient_id uuid not null references public.patients(id),
  encounter_id uuid not null references public.encounters(id),

  prescribed_by uuid not null references public.profiles(id),

  prescription_date timestamptz not null default now(),

  status text not null default 'pending'
    check (
      status in (
        'pending',
        'partially_dispensed',
        'dispensed',
        'cancelled'
      )
    ),

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 16.3 Prescription Items

```sql
create table public.prescription_items (
  id uuid primary key default gen_random_uuid(),

  prescription_id uuid not null references public.prescriptions(id) on delete restrict,

  medication_id uuid not null references public.medications(id),

  dosage text not null,
  frequency text not null,

  duration_days integer,
  quantity numeric not null check (quantity > 0),

  instructions text,

  created_at timestamptz not null default now()
);
```

## 16.4 Medication Dispensing

```sql
create table public.medication_dispenses (
  id uuid primary key default gen_random_uuid(),

  prescription_item_id uuid not null references public.prescription_items(id),

  quantity_dispensed numeric not null check (quantity_dispensed > 0),

  dispensed_by uuid not null references public.profiles(id),

  dispensed_at timestamptz not null default now(),

  notes text,

  created_at timestamptz not null default now()
);
```

Dispensing must be recorded transactionally with the appropriate inventory movement.

Do not mark a prescription as fully dispensed unless its required dispensing conditions are satisfied.

---

# 17. Inventory Management Schema

## 17.1 Inventory Categories

```sql
create table public.inventory_categories (
  id uuid primary key default gen_random_uuid(),

  name text not null unique,
  description text,

  created_at timestamptz not null default now()
);
```

## 17.2 Inventory Items

```sql
create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),

  item_code text not null unique,

  name text not null,
  description text,

  category_id uuid references public.inventory_categories(id),

  unit text not null,

  reorder_level numeric not null default 0,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 17.3 Inventory Batches

```sql
create table public.inventory_batches (
  id uuid primary key default gen_random_uuid(),

  item_id uuid not null references public.inventory_items(id),

  batch_number text,

  quantity_received numeric not null default 0,
  quantity_remaining numeric not null default 0,

  expiration_date date,

  unit_cost numeric(12,2),

  received_at timestamptz not null default now(),

  created_at timestamptz not null default now(),

  check (quantity_received >= 0),
  check (quantity_remaining >= 0),
  check (quantity_remaining <= quantity_received)
);
```

## 17.4 Stock Transactions

```sql
create table public.stock_transactions (
  id uuid primary key default gen_random_uuid(),

  item_id uuid not null references public.inventory_items(id),

  batch_id uuid references public.inventory_batches(id),

  transaction_type text not null
    check (
      transaction_type in (
        'stock_in',
        'stock_out',
        'adjustment',
        'transfer',
        'dispensing'
      )
    ),

  quantity numeric not null check (quantity > 0),

  reference_type text,
  reference_id uuid,

  reason text,

  performed_by uuid not null references public.profiles(id),

  performed_at timestamptz not null default now(),

  created_at timestamptz not null default now()
);
```

## 17.5 Inventory Rules

- Do not allow negative stock.
- Record every stock movement.
- Track batches and expiration dates where applicable.
- Use transactions for stock changes.
- Maintain a complete stock history.
- Never directly overwrite historical stock transactions.
- Medication dispensing must be linked to the corresponding prescription.

---

# 18. Billing & Payment Schema

## 18.1 Invoices

```sql
create table public.invoices (
  id uuid primary key default gen_random_uuid(),

  invoice_number text not null unique,

  patient_id uuid not null references public.patients(id),

  admission_id uuid references public.admissions(id),
  encounter_id uuid references public.encounters(id),

  invoice_date timestamptz not null default now(),

  subtotal numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,

  amount_paid numeric(12,2) not null default 0,
  balance numeric(12,2) not null default 0,

  status text not null default 'unpaid'
    check (
      status in (
        'unpaid',
        'partially_paid',
        'paid',
        'cancelled',
        'refunded'
      )
    ),

  created_by uuid not null references public.profiles(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (subtotal >= 0),
  check (discount_amount >= 0),
  check (total_amount >= 0),
  check (amount_paid >= 0),
  check (balance >= 0)
);
```

## 18.2 Invoice Items

```sql
create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),

  invoice_id uuid not null references public.invoices(id) on delete restrict,

  description text not null,

  quantity numeric not null check (quantity > 0),

  unit_price numeric(12,2) not null check (unit_price >= 0),

  line_total numeric(12,2) not null check (line_total >= 0),

  created_at timestamptz not null default now()
);
```

## 18.3 Payments

```sql
create table public.payments (
  id uuid primary key default gen_random_uuid(),

  payment_reference text not null unique,

  invoice_id uuid not null references public.invoices(id),

  amount numeric(12,2) not null check (amount > 0),

  payment_method text not null,

  payment_status text not null default 'completed'
    check (
      payment_status in (
        'pending',
        'completed',
        'failed',
        'refunded',
        'cancelled'
      )
    ),

  received_by uuid not null references public.profiles(id),

  received_at timestamptz not null default now(),

  notes text,

  created_at timestamptz not null default now()
);
```

## 18.4 Billing Rules

- Store monetary amounts using `numeric`, not `float`.
- Validate invoice totals inside the database.
- Payment recording must be transactional.
- Prevent duplicate payment processing.
- Never delete completed payment records.
- Refunds must retain the original payment history.
- Maintain a complete audit trail.
- Recalculate invoice balance using trusted database logic.

---

# 19. Notifications & Audit Logs

## 19.1 Notifications

```sql
create table public.notifications (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references public.profiles(id) on delete cascade,

  title text not null,
  message text not null,

  notification_type text not null,

  related_entity_type text,
  related_entity_id uuid,

  is_read boolean not null default false,

  created_at timestamptz not null default now(),
  read_at timestamptz
);
```

Do not include sensitive clinical details in notification messages.

Notifications should use references to records rather than reproducing confidential patient information.

## 19.2 Audit Logs

```sql
create table public.audit_logs (
  id bigint generated always as identity primary key,

  actor_id uuid references public.profiles(id),

  action text not null,

  entity_type text not null,
  entity_id uuid,

  description text,

  metadata jsonb not null default '{}'::jsonb,

  ip_address inet,

  created_at timestamptz not null default now()
);
```

Audit logs should capture important operations, including:

- Patient registration
- Patient record updates
- Clinical note creation and amendments
- Diagnosis creation and corrections
- Admission and discharge
- Bed transfers
- Laboratory result entry and verification
- Prescription creation and dispensing
- Invoice creation
- Payment recording
- Refund operations
- Inventory adjustments
- User role changes
- Account deactivation
- Sensitive file access where required

Audit records must not be editable by ordinary users.

Avoid copying entire medical records into audit metadata. Record only the minimum information required to establish accountability.

---

# 20. Updated Timestamps & Profile Bootstrap Triggers

## 20.1 Updated Timestamp Function

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
```

Apply this trigger to mutable tables that contain `updated_at`.

Examples:

- profiles
- patients
- departments
- staff_profiles
- rooms
- beds
- appointments
- admissions
- encounters
- clinical_notes
- laboratory_orders
- laboratory_results
- prescriptions
- medications
- inventory_items
- invoices

## 20.2 New User Profile Trigger

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      split_part(coalesce(new.email, ''), '@', 1)
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();
```

This trigger creates the application profile when a Supabase Auth account is created.

It must not automatically grant privileged hospital roles.

---

# 21. Database Functions & Transactional Operations

Operations that require atomic database changes must use PostgreSQL functions.

The frontend may invoke these functions using the Supabase SDK's `rpc()` method.

This is not a separate REST backend.

## 21.1 Required Transactional Functions

| Function | Purpose |
|---|---|
| `register_patient` | Create patient and assign medical record number |
| `create_appointment` | Validate schedule and create appointment |
| `create_admission` | Create admission and allocate an available bed |
| `transfer_patient` | Transfer patient between beds |
| `discharge_patient` | Complete discharge and release bed |
| `finalize_clinical_note` | Finalize an authorized clinical note |
| `verify_laboratory_result` | Verify an authorized laboratory result |
| `dispense_prescription` | Record dispensing and update inventory |
| `record_payment` | Record payment and update invoice balance |
| `refund_payment` | Process an authorized refund |
| `adjust_inventory` | Record controlled stock adjustment |
| `generate_reference_number` | Generate controlled unique identifiers |

`generate_reference_number(p_prefix text)` returns `PREFIX-YYYY-NNNN` (for example `MRN-2026-0001`). It uses the `Asia/Manila` year and an atomic per-prefix counter in `public.reference_sequences`. Supported prefixes include `MRN`, `APT`, `ADM`, `ENC`, `LAB`, `RAD`, `RX`, `INV`, and `PAY`. Callers must not generate identifiers from frontend timestamps or random strings.

## 21.2 Function Requirements

Every transactional function must:

1. Identify the authenticated caller using `auth.uid()`.
2. Verify the required permission.
3. Validate the requested record.
4. Lock affected rows where concurrent changes are possible.
5. Perform the operation inside one transaction.
6. Maintain data consistency.
7. Write appropriate audit records.
8. Return a clear result.
9. Reject unauthorized operations.

## 21.3 Example: Secure Payment Recording

```sql
create or replace function public.record_payment(
  p_invoice_id uuid,
  p_amount numeric,
  p_payment_method text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_payment_id uuid;
  v_invoice public.invoices%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Invalid payment amount';
  end if;

  select *
  into v_invoice
  from public.invoices
  where id = p_invoice_id
  for update;

  if not found then
    raise exception 'Invoice not found';
  end if;

  if not public.has_permission('billing.payment.create') then
    raise exception 'Insufficient permission';
  end if;

  if v_invoice.status in ('cancelled', 'refunded') then
    raise exception 'Invoice cannot accept payments';
  end if;

  if p_amount > v_invoice.balance then
    raise exception 'Payment exceeds outstanding balance';
  end if;

  insert into public.payments (
    payment_reference,
    invoice_id,
    amount,
    payment_method,
    payment_status,
    received_by
  )
  values (
    public.generate_reference_number('PAY'),
    p_invoice_id,
    p_amount,
    p_payment_method,
    'completed',
    auth.uid()
  )
  returning id into v_payment_id;

  update public.invoices
  set
    amount_paid = amount_paid + p_amount,
    balance = balance - p_amount,
    status = case
      when balance - p_amount = 0 then 'paid'
      else 'partially_paid'
    end,
    updated_at = now()
  where id = p_invoice_id;

  return v_payment_id;
end;
$$;
```

Important:

The example is a reference implementation. The final production function must additionally enforce the hospital's billing authorization model, patient access rules, payment idempotency, and audit requirements.

Test function ownership, execution grants, and RLS behavior before deployment.

---

# 22. Role-Based Permissions

## 22.1 Permission Catalog

Seed the following permissions.

### Administration

```text
system.admin
system.settings.manage
user.view
user.create
user.update
user.deactivate
role.manage
audit.view
```

### Patient Management

```text
patient.view
patient.create
patient.update
patient.archive
patient.search
patient.export
```

### Appointments

```text
appointment.view
appointment.create
appointment.update
appointment.cancel
appointment.manage_schedule
```

### Admissions

```text
admission.view
admission.create
admission.update
admission.transfer
admission.discharge
bed.view
bed.manage
```

### Medical Records

```text
medical_record.view
medical_record.create
medical_record.update
medical_record.finalize
medical_record.amend
diagnosis.view
diagnosis.create
diagnosis.update
vital_signs.view
vital_signs.record
```

### Nursing

```text
nursing.view
nursing.assessment.create
nursing.notes.create
nursing.notes.view
```

### Laboratory

```text
laboratory.view
laboratory.order.view
laboratory.order.create
laboratory.specimen.manage
laboratory.result.create
laboratory.result.verify
```

### Radiology

```text
radiology.view
radiology.order.manage
radiology.report.create
radiology.report.verify
```

### Pharmacy

```text
pharmacy.view
prescription.view
prescription.create
prescription.dispense
medication.manage
```

### Billing

```text
billing.view
billing.invoice.create
billing.invoice.update
billing.payment.create
billing.refund
billing.report.view
```

### Inventory

```text
inventory.view
inventory.item.manage
inventory.stock.in
inventory.stock.out
inventory.stock.adjust
inventory.report.view
```

### Reports

```text
reports.patient.view
reports.admission.view
reports.appointment.view
reports.financial.view
reports.inventory.view
reports.laboratory.view
```

## 22.2 Role Permission Matrix

This matrix is the initial proposed access model. Final permissions must be approved by hospital stakeholders.

| Module | Admin | Receptionist | Physician | Nurse | Laboratory | Radiology | Pharmacist | Billing | Inventory |
|---|---|---|---|---|---|---|---|---|---|
| Dashboard | Full | Limited | Clinical | Clinical | Department | Department | Department | Financial | Stock |
| Patients | Full | Register / Update | Authorized View | Assigned View | Necessary View | Necessary View | Necessary View | Necessary View | None |
| Appointments | Full | Manage | Own Schedule | View | None | None | None | None | None |
| Admissions | Full | Register | Clinical View | Assigned View | Necessary View | Necessary View | Necessary View | Billing View | None |
| Medical Records | Full | Restricted | Clinical | Assigned Clinical | Necessary | Necessary | Medication Context | Billing Context | None |
| Nursing | Full | None | Clinical View | Full Nursing | None | None | None | None | None |
| Laboratory | Full | None | Order / View | Authorized View | Full Lab | None | None | None | None |
| Radiology | Full | None | Order / View | Authorized View | None | Full Radiology | None | None | None |
| Pharmacy | Full | None | Prescribe / View | Authorized View | None | None | Full Pharmacy | None | None |
| Billing | Full | Limited | View Relevant | None | None | None | None | Full Billing | None |
| Inventory | Full | None | None | None | Department Items | Department Items | Medication Stock | None | Full Inventory |
| Reports | Full | Limited | Clinical | Nursing | Laboratory | Radiology | Pharmacy | Financial | Inventory |
| User Management | Full | None | None | None | None | None | None | None | None |

**Important:** A role matrix is not sufficient security by itself. The actual database policies must enforce access at the row and operation level.

A user with multiple roles receives only the combined permissions explicitly assigned to those roles.

Clinical access must also consider the hospital's authorized patient-care relationship and applicable privacy rules.

---

# 23. Row Level Security (RLS)

## 23.1 Mandatory RLS Rules

1. Enable RLS on every application table in the `public` schema.
2. Do not grant anonymous users access to patient information.
3. Write policies for authenticated users only.
4. Use permission helper functions.
5. Restrict sensitive clinical data.
6. Restrict financial records.
7. Restrict audit logs.
8. Use deny-by-default policies.
9. Do not rely on frontend route guards.
10. Test policies using actual authenticated user tokens.

### Owner Bypass and FORCE RLS

Supabase clients connect as `anon` or `authenticated`; they never connect as the table owner. Enabling RLS is therefore the client security boundary.

`FORCE ROW LEVEL SECURITY` is intentionally not enabled while the table owner is the trusted migration/superuser role. It only constrains owner sessions, and it would break `SECURITY DEFINER` helpers unless those functions are owned by a role with `BYPASSRLS`. Revisit this decision only if the table owner becomes a non-superuser application role.

## 23.2 Permission Helper Functions

### Check User Role

```sql
create or replace function public.has_role(p_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.slug = p_role
  );
$$;
```

### Check Administrator

```sql
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.has_role('super_admin')
    or public.has_role('hospital_admin');
$$;
```

### Check Permission

```sql
create or replace function public.has_permission(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.user_roles ur
      join public.role_permissions rp
        on rp.role_id = ur.role_id
      join public.permissions p
        on p.id = rp.permission_id
      where ur.user_id = auth.uid()
        and p.slug = p_permission
    );
$$;
```

Security-definer helpers must:

- Use a fixed search path.
- Be owned by an appropriate trusted database role.
- Have explicit execution grants.
- Avoid exposing privileged operations.
- Be tested against privilege escalation.

## 23.3 Patient Access Helper

Patient access must be controlled through explicit permission and authorized care relationships.

A patient-care assignment table should be used where the hospital requires staff-to-patient assignment.

Example:

```sql
create table public.patient_care_assignments (
  id uuid primary key default gen_random_uuid(),

  patient_id uuid not null references public.patients(id),
  staff_id uuid not null references public.staff_profiles(id),

  assignment_type text not null,

  assigned_by uuid not null references public.profiles(id),

  assigned_at timestamptz not null default now(),
  ended_at timestamptz
);
```

Example helper:

```sql
create or replace function public.can_access_patient(p_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.is_admin()
    or (
      public.has_permission('patient.view')
      and exists (
        select 1
        from public.patient_care_assignments pca
        join public.staff_profiles sp
          on sp.id = pca.staff_id
        where pca.patient_id = p_patient_id
          and sp.user_id = auth.uid()
          and pca.ended_at is null
      )
    );
$$;
```

The final helper must be adapted to the approved hospital access policy. For example, receptionists may need access to registration information without access to full clinical records.

Do not use a broad patient-access helper as the only policy for every clinical table.

## 23.4 Example Patient Policies

```sql
alter table public.patients enable row level security;

create policy "patients_select_authorized"
on public.patients
for select
to authenticated
using (
  public.has_permission('patient.view')
);

create policy "patients_insert_authorized"
on public.patients
for insert
to authenticated
with check (
  public.has_permission('patient.create')
  and created_by = auth.uid()
);

create policy "patients_update_authorized"
on public.patients
for update
to authenticated
using (
  public.has_permission('patient.update')
)
with check (
  public.has_permission('patient.update')
);
```

This is a basic policy pattern. In production, patient visibility must also enforce the appropriate department, assignment, and field-level privacy rules.

## 23.5 Example Clinical Record Policies

```sql
alter table public.clinical_notes enable row level security;

create policy "clinical_notes_select_authorized"
on public.clinical_notes
for select
to authenticated
using (
  public.has_permission('medical_record.view')
  and public.can_access_patient(patient_id)
);

create policy "clinical_notes_insert_authorized"
on public.clinical_notes
for insert
to authenticated
with check (
  public.has_permission('medical_record.create')
  and public.can_access_patient(patient_id)
  and authored_by = auth.uid()
);
```

Finalized clinical records require additional restrictions against unauthorized editing and deletion.

## 23.6 RLS Implementation Requirements

Every table must have a documented access policy.

The following are not acceptable:

- Unrestricted patient table access.
- Public medical records.
- Public invoices.
- Public prescriptions.
- Public laboratory results.
- User-controlled role assignments.
- Client-side-only permission checks.
- Unrestricted audit log access.

---

# 24. Supabase Storage

## 24.1 Storage Buckets

Use private buckets for patient-related and hospital documents.

| Bucket | Public | Contents |
|---|---|---|
| `avatars` | No | Staff profile images |
| `patient-documents` | No | Authorized patient attachments |
| `medical-record-files` | No | Clinical documents |
| `laboratory-files` | No | Laboratory attachments |
| `radiology-files` | No | Radiology documents and authorized images |
| `prescription-files` | No | Prescription-related attachments |
| `billing-documents` | No | Invoices and payment documents |
| `hospital-documents` | No | Internal administrative documents |

All buckets must have explicit file-size and MIME-type restrictions appropriate to their contents.

## 24.2 Bucket Creation

Create buckets through SQL migrations.

Example:

```sql
insert into storage.buckets (
  id,
  name,
  public
)
values
  ('avatars', 'avatars', false),
  ('patient-documents', 'patient-documents', false),
  ('medical-record-files', 'medical-record-files', false),
  ('laboratory-files', 'laboratory-files', false),
  ('radiology-files', 'radiology-files', false),
  ('prescription-files', 'prescription-files', false),
  ('billing-documents', 'billing-documents', false),
  ('hospital-documents', 'hospital-documents', false)
on conflict (id) do nothing;
```

## 24.3 Storage Path Convention

Use predictable, access-controlled paths.

```text
avatars/
  {user_id}/
    profile-image.png

patient-documents/
  {patient_id}/
    {document_id}/
      document.pdf

medical-record-files/
  {patient_id}/
    {encounter_id}/
      document.pdf

laboratory-files/
  {patient_id}/
    {order_id}/
      attachment.pdf

radiology-files/
  {patient_id}/
    {order_id}/
      image.dcm

prescription-files/
  {patient_id}/
    {prescription_id}/
      prescription.pdf

billing-documents/
  {patient_id}/
    {invoice_id}/
      invoice.pdf
```

Object paths are not authorization. Storage policies must validate access against the related patient record and authorized user.

## 24.4 Storage Security

- Do not make patient documents public.
- Use signed URLs with short expiration periods.
- Verify patient authorization before downloads.
- Validate MIME types and file sizes.
- Do not trust the file extension alone.
- Restrict uploads to authorized roles.
- Prevent unauthorized object deletion.
- Record sensitive file operations when required.
- Do not expose confidential documents through permanent public links.

Example signed URL:

```ts
const { data, error } = await supabase.storage
  .from("patient-documents")
  .createSignedUrl(filePath, 60);

if (error) {
  throw error;
}

const signedUrl = data.signedUrl;
```

The frontend must first retrieve an authorized object path through RLS-protected records.

---

# 25. Supabase Realtime

Realtime must only be enabled for features that benefit from immediate updates.

## 25.1 Recommended Realtime Features

| Feature | Table | Event |
|---|---|---|
| Appointment Updates | `appointments` | INSERT / UPDATE |
| Admission Updates | `admissions` | INSERT / UPDATE |
| Bed Availability | `beds` | UPDATE |
| Laboratory Queue | `laboratory_orders` | INSERT / UPDATE |
| Laboratory Results | `laboratory_results` | INSERT / UPDATE |
| Pharmacy Queue | `prescriptions` | INSERT / UPDATE |
| Notifications | `notifications` | INSERT / UPDATE |
| Payment Updates | `payments` | INSERT |
| Inventory Changes | `stock_transactions` | INSERT |

## 25.2 Enable Publication

Only publish tables that require Realtime.

Example:

```sql
alter publication supabase_realtime
add table
  public.appointments,
  public.admissions,
  public.beds,
  public.laboratory_orders,
  public.laboratory_results,
  public.prescriptions,
  public.notifications,
  public.payments,
  public.stock_transactions;
```

Check existing publication membership before applying migrations.

## 25.3 Client Subscription Example

```ts
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function subscribeToAppointments(
  handler: (payload: unknown) => void
) {
  const supabase = getSupabaseBrowserClient();

  const channel = supabase
    .channel("hospital-appointments")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "appointments",
      },
      handler
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
```

## 25.4 Realtime Security

- Always enforce RLS.
- Do not subscribe to confidential records unnecessarily.
- Avoid broadcasting clinical notes or patient details.
- Send record identifiers and retrieve authorized data separately.
- Remove subscriptions when components unmount.
- Test subscriptions using restricted user accounts.

---

# 26. Supabase Edge Functions

Edge Functions are reserved for operations requiring trusted execution, secrets, or privileged administrative capabilities.

They are not the default way to access PostgreSQL.

## 26.1 Approved Edge Functions

| Function | Purpose |
|---|---|
| `admin-users` | Create, deactivate, and manage authentication accounts |
| `admin-role-assignment` | Privileged role administration |
| `send-notification` | External email or notification provider integration |
| `generate-document` | Trusted document rendering when browser processing is insufficient |
| `ai-assist` | Optional AI-based drafting or summarization using a protected provider key |
| `scheduled-maintenance` | Trusted scheduled maintenance tasks |

Do not create an Edge Function for ordinary patient CRUD, appointments CRUD, or other operations already supported by the Supabase SDK and PostgreSQL.

## 26.2 Function Security Rules

Every Edge Function must:

1. Authenticate the caller.
2. Reject anonymous requests where authentication is required.
3. Validate request input.
4. Check authorization.
5. Use service-role access only for the exact privileged operation.
6. Avoid returning sensitive secrets.
7. Avoid logging patient information unnecessarily.
8. Return structured errors.
9. Handle retries safely.
10. Record sensitive administrative operations.

## 26.3 Example Function Directory

```text
supabase/
└── functions/
    ├── admin-users/
    │   └── index.ts
    ├── admin-role-assignment/
    │   └── index.ts
    ├── send-notification/
    │   └── index.ts
    ├── generate-document/
    │   └── index.ts
    └── ai-assist/
        └── index.ts
```

## 26.4 Secrets

Configure secrets using:

```bash
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_KEY

npx supabase secrets set AI_PROVIDER_API_KEY=YOUR_KEY
```

Never copy secrets into frontend environment variables.

---

# 27. Supabase Query Implementation

## 27.1 Query Module Rules

Organize queries by hospital domain.

Example:

`src/lib/supabase/queries/patients.ts`

```ts
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export async function getPatients() {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("patients")
    .select(`
      id,
      medical_record_number,
      first_name,
      middle_name,
      last_name,
      date_of_birth,
      registration_date,
      registration_status
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}
```

## 27.2 Patient Registration Example

```ts
import { z } from "zod";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const patientSchema = z.object({
  first_name: z.string().min(1),
  middle_name: z.string().optional(),
  last_name: z.string().min(1),
  date_of_birth: z.string().optional(),
  sex: z.string().optional(),
  contact_number: z.string().optional(),
  address_line: z.string().optional(),
});

export async function registerPatient(input: unknown) {
  const validated = patientSchema.parse(input);

  const supabase = getSupabaseBrowserClient();

  const { data: authData, error: authError } =
    await supabase.auth.getUser();

  if (authError || !authData.user) {
    throw new Error("Authentication required.");
  }

  const { data, error } = await supabase
    .from("patients")
    .insert({
      ...validated,
      created_by: authData.user.id,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
```

In production, medical record number assignment must be generated securely by the database, not by this frontend function.

## 27.3 Mutation Rules

Every mutation must:

1. Validate input with Zod.
2. Use the shared Supabase client.
3. Allow RLS to enforce authorization.
4. Handle database errors.
5. Return typed results.
6. Update the interface only after confirmed success.
7. Prevent duplicate submissions.
8. Maintain auditability for sensitive operations.

Do not duplicate business rules in multiple unrelated components.

---

# 28. Database Indexes & Performance

Create indexes for frequently filtered columns, foreign keys, and operational queries.

Recommended indexes:

```sql
create index idx_patients_mrn
on public.patients(medical_record_number);

create index idx_patients_name
on public.patients(last_name, first_name);

create index idx_appointments_patient
on public.appointments(patient_id);

create index idx_appointments_physician_schedule
on public.appointments(physician_id, scheduled_at);

create index idx_appointments_status
on public.appointments(status);

create index idx_admissions_patient
on public.admissions(patient_id);

create index idx_admissions_status
on public.admissions(status);

create index idx_beds_room
on public.beds(room_id);

create index idx_beds_status
on public.beds(status);

create index idx_encounters_patient
on public.encounters(patient_id);

create index idx_vital_signs_encounter
on public.vital_signs(encounter_id);

create index idx_diagnoses_patient
on public.diagnoses(patient_id);

create index idx_laboratory_orders_patient
on public.laboratory_orders(patient_id);

create index idx_laboratory_orders_status
on public.laboratory_orders(status);

create index idx_prescriptions_patient
on public.prescriptions(patient_id);

create index idx_prescriptions_status
on public.prescriptions(status);

create index idx_inventory_batches_item
on public.inventory_batches(item_id);

create index idx_stock_transactions_item
on public.stock_transactions(item_id);

create index idx_invoices_patient
on public.invoices(patient_id);

create index idx_invoices_status
on public.invoices(status);

create index idx_payments_invoice
on public.payments(invoice_id);

create index idx_notifications_user
on public.notifications(user_id, created_at desc);

create index idx_audit_logs_actor
on public.audit_logs(actor_id, created_at desc);
```

Additional indexes must be added based on actual query plans and workload.

Avoid indexing every column without justification.

## 28.1 Query Performance Rules

- Use pagination for large tables.
- Avoid retrieving every patient record at once.
- Select only required columns.
- Avoid unnecessarily nested joins.
- Use database views for appropriate reporting queries.
- Use indexed filters.
- Avoid repeated database requests from the same component.
- Cache only data that can safely be reused under the current user's authorization context.

---

# 29. Views & Reporting Queries

Create database views for reusable reporting logic.

Examples:

- `v_patient_summary`
- `v_appointment_summary`
- `v_admission_census`
- `v_bed_availability`
- `v_laboratory_summary`
- `v_pharmacy_summary`
- `v_billing_summary`
- `v_inventory_summary`

Example:

```sql
create or replace view public.v_bed_availability
with (security_invoker = true)
as
select
  b.id as bed_id,
  b.bed_number,
  b.status,
  r.room_number,
  d.name as department_name
from public.beds b
join public.rooms r on r.id = b.room_id
join public.departments d on d.id = r.department_id;
```

Views must preserve the caller's RLS behavior.

Never expose patient or financial information through an unrestricted reporting view.

---

# 30. Error Handling Contract

All Supabase operations must support four interface states.

| State | Trigger | UI Behavior |
|---|---|---|
| Loading | Request in progress | Skeleton or spinner |
| Empty | Successful query with zero rows | Empty state with relevant action |
| Success | Successful query or mutation | Render data or success notification |
| Error | Supabase returns an error | Friendly error message and retry option |

## 30.1 PostgreSQL Error Mapping

| Code | Meaning | User-Facing Message |
|---|---|---|
| 23505 | Unique violation | This record already exists. |
| 23503 | Foreign key violation | This record is linked to another record and cannot be removed. |
| 23502 | Not-null violation | A required field is missing. |
| 42501 | Insufficient privilege | You do not have permission to perform this action. |
| 23514 | Check constraint violation | The provided information does not meet the required rules. |
| 22P02 | Invalid input syntax | One or more values are invalid. |

Rules:

- Never silently swallow errors.
- Never display raw SQL errors to ordinary users.
- Never retry financial or inventory mutations blindly.
- Preserve form input after recoverable errors.
- Provide appropriate retry behavior for safe reads.
- Distinguish empty results from authorization failures.

---

# 31. Migration Architecture

## 31.1 Initialize Supabase

```bash
npx supabase init

npx supabase start

npx supabase status
```

## 31.2 Migration Rules

- All database changes must use SQL migrations.
- Never manually modify production tables outside the migration process.
- Never edit an already-applied migration.
- Create a new migration for every schema change.
- Enable RLS in the same migration that creates an application table.
- Include indexes and relevant policies.
- Test migration execution using a clean local database.
- Regenerate TypeScript types after schema changes.

## 31.3 Proposed Migration Order

```text
supabase/
└── migrations/
    ├── 20261110000100_extensions_and_helpers.sql
    ├── 20261110000200_enums_and_reference_types.sql
    ├── 20261110000300_identity_and_roles.sql
    ├── 20261110000400_departments_and_staff.sql
    ├── 20261110000500_patient_management.sql
    ├── 20261110000600_appointments.sql
    ├── 20261110000700_rooms_and_beds.sql
    ├── 20261110000800_admissions_and_transfers.sql
    ├── 20261110000900_medical_records.sql
    ├── 20261110001000_nursing.sql
    ├── 20261110001100_laboratory.sql
    ├── 20261110001200_radiology.sql
    ├── 20261110001300_pharmacy.sql
    ├── 20261110001400_inventory.sql
    ├── 20261110001500_billing_and_payments.sql
    ├── 20261110001600_notifications_and_audit.sql
    ├── 20261110001700_database_functions.sql
    ├── 20261110001800_row_level_security.sql
    ├── 20261110001900_storage.sql
    ├── 20261110002000_realtime.sql
    ├── 20261110002100_indexes_and_views.sql
    └── 20261110002200_seed_reference_data.sql
```

Migration timestamps are examples. Generate unique timestamps using the Supabase CLI when creating actual migration files.

## 31.4 Create Migration

```bash
npx supabase migration new patient_management
```

## 31.5 Apply Migrations Locally

```bash
npx supabase db reset
```

## 31.6 Validate Database

```bash
npx supabase db lint
```

---

# 32. Type Generation

Generated TypeScript types must match the actual Supabase database schema.

## 32.1 Generate Local Types

```bash
npx supabase gen types typescript --local --schema public > src/types/supabase.ts
```

## 32.2 Generate Remote Types

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_REF --schema public > src/types/supabase.ts
```

Rules:

- Never manually edit generated types.
- Regenerate after schema migrations.
- Commit updated generated types.
- Use `Database` when initializing Supabase clients.
- Avoid using `any` for database results.

---

# 33. Testing & Security Validation

## 33.1 Authentication Tests

Test:

- Login
- Logout
- Session refresh
- Password reset
- Invalid credentials
- Disabled account handling
- Unauthorized route access
- Profile creation after signup
- Role assignment

## 33.2 Role Tests

Test every approved system role.

Minimum test users:

1. Super Administrator
2. Hospital Administrator
3. Receptionist
4. Physician
5. Nurse
6. Laboratory Staff
7. Radiology Staff
8. Pharmacist
9. Billing Staff
10. Inventory Staff

## 33.3 RLS Tests

Required scenarios:

- Anonymous user cannot access patient records.
- Receptionist cannot access restricted clinical notes.
- Physician cannot access unauthorized administrative functions.
- Nurse cannot modify finalized physician documentation.
- Laboratory staff cannot access billing administration.
- Pharmacist cannot assign administrator roles.
- Billing staff cannot modify clinical diagnoses.
- Inventory staff cannot read unrestricted patient medical records.
- Ordinary users cannot read audit logs.
- Unauthorized users cannot access another patient's files.
- Users cannot change their own roles.
- Users cannot bypass authorization by changing record IDs.

## 33.4 Clinical Integrity Tests

Test:

- Duplicate patient registration.
- Invalid appointment scheduling.
- Concurrent bed allocation.
- Discharge and bed release.
- Patient transfer.
- Clinical note finalization.
- Laboratory result verification.
- Prescription dispensing.
- Inventory quantity validation.
- Payment recording.
- Duplicate payment submission.
- Refund processing.

## 33.5 Storage Tests

Verify:

- Private buckets cannot be accessed publicly.
- Authorized users can access permitted files.
- Unauthorized users cannot download patient documents.
- Signed URLs expire.
- Unauthorized uploads are rejected.
- Unauthorized deletions are rejected.

## 33.6 Test Data Rules

Never use actual patient information in:

- Development databases
- Seed files
- Unit tests
- Integration tests
- Public repositories
- Screenshots
- AI prompts

Use synthetic patient records only.

---

# 34. Initial Reference Data

Seed only non-sensitive reference information.

Recommended department examples:

```sql
insert into public.departments (code, name)
values
  ('ER', 'Emergency Department'),
  ('OPD', 'Outpatient Department'),
  ('IPD', 'Inpatient Department'),
  ('LAB', 'Laboratory'),
  ('RAD', 'Radiology'),
  ('PHARM', 'Pharmacy'),
  ('BILL', 'Billing'),
  ('ADMIN', 'Administration')
on conflict do nothing;
```

Role and permission records must be seeded separately.

Do not automatically create privileged user accounts through a public signup flow.

Create the initial administrator through a controlled, documented provisioning process.

---

# 35. Development Bootstrap Checklist

Follow this sequence before building the hospital modules.

1. Install project dependencies.
2. Create or connect the Supabase project.
3. Configure the project URL and publishable key.
4. Initialize the Supabase CLI.
5. Start the local Supabase environment.
6. Create database migrations.
7. Create authentication and profile tables.
8. Create roles and permissions.
9. Implement profile creation triggers.
10. Implement RLS helper functions.
11. Implement RLS policies.
12. Create hospital reference tables.
13. Create patient management tables.
14. Create appointment tables.
15. Create admission and bed management tables.
16. Create medical records tables.
17. Create laboratory and radiology tables.
18. Create pharmacy and inventory tables.
19. Create billing and payment tables.
20. Create audit and notification tables.
21. Configure Storage buckets.
22. Configure Realtime.
23. Generate TypeScript database types.
24. Implement shared Supabase clients.
25. Implement authentication and profile bootstrap.
26. Build role-based frontend navigation.
27. Test RLS before exposing hospital modules.
28. Implement transactional database functions.
29. Connect the frontend modules to Supabase.
30. Run integration, security, and build tests.

---

# 36. Recommended Implementation Order

Build the system in the following order:

| Phase | Module | Dependencies |
|---|---|---|
| 1 | Authentication & User Management | Supabase Auth, profiles, roles |
| 2 | Hospital Reference Data | Departments, staff |
| 3 | Patient Management | Profiles, patients |
| 4 | Appointment Management | Patients, physicians, departments |
| 5 | Room & Bed Management | Departments, rooms, beds |
| 6 | Admission & Discharge | Patients, beds, physicians |
| 7 | Electronic Medical Records | Patients, encounters, staff |
| 8 | Nursing Management | Patients, encounters, staff |
| 9 | Laboratory Management | Patients, encounters, laboratory tests |
| 10 | Radiology Management | Patients, encounters, staff |
| 11 | Pharmacy Management | Prescriptions, medications, inventory |
| 12 | Inventory Management | Inventory items, batches, transactions |
| 13 | Billing & Payments | Patients, encounters, admissions |
| 14 | Notifications & Audit Logs | All relevant modules |
| 15 | Reports & Analytics | Operational database views |

Do not implement all modules as disconnected mock interfaces.

Each completed module must use the actual Supabase schema and appropriate permissions.

---

# 37. Definition of Done for Supabase Changes

A Supabase implementation change is complete only when:

- [ ] Database migration is created.
- [ ] Migration applies successfully.
- [ ] RLS is enabled.
- [ ] Policies are implemented.
- [ ] Permissions are tested.
- [ ] Foreign keys are valid.
- [ ] Required indexes are present.
- [ ] Database functions are tested where applicable.
- [ ] Storage policies are tested when files are involved.
- [ ] Realtime policies are tested when subscriptions are involved.
- [ ] TypeScript types are regenerated.
- [ ] Frontend query modules use the shared Supabase client.
- [ ] Zod validation is implemented for mutations.
- [ ] Loading, empty, success, and error states are implemented.
- [ ] Sensitive operations are audited.
- [ ] No secret is exposed in the frontend.
- [ ] No actual patient data is used in test fixtures.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] Database security tests pass.

---

# 38. Change Control & Final Engineering Rules

1. `PROJECT.md` remains the authority for hospital functionality and business rules.
2. `THEME.md` remains the authority for UI/UX and visual styling.
3. `SUPABASE.md` remains the authority for database and Supabase implementation.
4. Every database schema change requires a migration.
5. Every role or permission change requires RLS policy review.
6. Every new file bucket requires Storage policy review.
7. Every new Realtime subscription requires access-control review.
8. Every new Edge Function requires an authorization contract.
9. Every clinical or financial transaction must preserve database consistency.
10. Every sensitive operation must have an appropriate audit record.
11. Never introduce a separate backend without an explicitly approved architecture change.
12. Never expose the service-role key.
13. Never use frontend-only authorization.
14. Never expose confidential patient records through public URLs.
15. Never use real patient data in development or testing.
16. Never silently overwrite finalized clinical or financial records.
17. Never implement fake operational data as though it came from the hospital database.
18. Prefer PostgreSQL transactions and functions for atomic business operations.
19. Keep database queries typed, reusable, and domain-organized.
20. Keep the implementation consistent with the approved Hospital Management System requirements.

**FINAL ARCHITECTURE:**

```text
+------------------------------------------------------+
|                  HMS FRONTEND                        |
|                                                      |
|            React + TypeScript + Tailwind             |
|                                                      |
|  Dashboard | Patients | EMR | Pharmacy | Billing     |
|                                                      |
+---------------------------+--------------------------+
                            |
                            |
                   Supabase SDK / SSR
                            |
                            v
+------------------------------------------------------+
|                    SUPABASE                          |
|                                                      |
|  +----------------+    +--------------------------+  |
|  | Supabase Auth  |    | PostgreSQL Database      |  |
|  +----------------+    |                          |  |
|                        | Patients                 |  |
|  +----------------+    | Appointments             |  |
|  | Row Level      |    | Admissions               |  |
|  | Security       |    | Medical Records          |  |
|  +----------------+    | Laboratory               |  |
|                        | Pharmacy                 |  |
|  +----------------+    | Billing                  |  |
|  | Storage        |    | Inventory                |  |
|  +----------------+    | Audit Logs               |  |
|                        +--------------------------+  |
|  +----------------+                                  |
|  | Realtime       |    +--------------------------+  |
|  +----------------+    | Database Functions       |  |
|                        +--------------------------+  |
|  +----------------+                                  |
|  | Edge Functions |    Privileged Operations       |
|  +----------------+                                  |
|                                                      |
+------------------------------------------------------+
```

**The final system must use Supabase as its single backend platform, with PostgreSQL as the source of truth, RLS as the authorization boundary, and the React frontend communicating directly through the Supabase SDK.**