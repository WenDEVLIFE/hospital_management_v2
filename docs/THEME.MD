# THEME.md — Hospital Management System Design System & UI/UX Specification

# SPMC Hospital Management System (HMS)

**Southern Philippines Medical Center (SPMC)**  
Department of Health (DOH) • Republic of the Philippines

---

## 1. Platform Purpose, Workflows & User Personas

### 1.1 True System Purpose

This application is a web-based **Hospital Management System (HMS)** designed to centralize hospital operations, patient information, clinical workflows, appointments, admissions, billing, pharmacy, laboratory services, and administrative management.

The platform serves as an integrated operational workspace for hospital personnel.

Its primary responsibilities include:

1. **Patient Management:** Registering patients, maintaining demographic information, assigning medical record numbers, and accessing patient profiles.
2. **Appointment Management:** Scheduling consultations, managing physician availability, and tracking appointment status.
3. **Admission Management:** Processing patient admissions, assigning beds and rooms, managing transfers, and handling discharge workflows.
4. **Electronic Medical Records:** Maintaining patient medical history, clinical encounters, vital signs, diagnoses, allergies, treatment plans, and physician notes.
5. **Doctor & Staff Management:** Managing staff accounts, physician profiles, department assignments, and work schedules.
6. **Nursing Management:** Managing nursing assessments, patient monitoring, vital signs, and nursing documentation.
7. **Laboratory Management:** Processing laboratory requests, tracking specimens, entering test results, and managing result verification.
8. **Pharmacy Management:** Managing prescriptions, medication dispensing, medicine inventory, and stock monitoring.
9. **Billing & Payments:** Generating patient invoices, recording payments, managing service charges, and tracking outstanding balances.
10. **Inventory Management:** Managing medical supplies, equipment, stock movements, and inventory transactions.
11. **Reports & Analytics:** Presenting hospital statistics, patient census, financial summaries, and departmental performance.
12. **System Administration:** Managing user accounts, permissions, system settings, and audit records.

### 1.2 User Personas & Interface Requirements

The UI must accommodate the following hospital personnel:

| Persona | Primary Tasks | UI & Density Needs |
|---|---|---|
| System Administrators | Manage accounts, permissions, departments, settings, and audit logs | Administrative dashboards, data tables, permission controls |
| Hospital Administrators | Monitor hospital operations, patient census, financial summaries, and reports | KPI cards, charts, operational dashboards |
| Receptionists / Registration Staff | Register patients, search patient records, and schedule appointments | Searchable patient tables, registration forms, appointment calendar |
| Physicians / Doctors | Review patient records, document consultations, record diagnoses, and create prescriptions | Patient charts, clinical forms, encounter summaries |
| Nurses | Monitor assigned patients, record vital signs, and document nursing assessments | Patient lists, vital signs forms, monitoring panels |
| Laboratory Staff | Manage laboratory requests, specimens, and test results | Order queues, specimen status indicators, result-entry forms |
| Pharmacists | Review prescriptions, dispense medications, and manage medicine inventory | Prescription queues, medication tables, stock indicators |
| Billing Staff | Prepare invoices, record payments, and monitor outstanding balances | Billing tables, invoice summaries, payment forms |
| Inventory Staff | Manage medical supplies, stock movements, and equipment | Inventory tables, stock alerts, transaction history |

### 1.3 Core Interface Principles

- **Patient-Centered Navigation:** Patient identity and relevant patient context should remain visible throughout clinical workflows.
- **Operational Clarity:** Every screen must communicate its purpose and available actions clearly.
- **Role-Based Visibility:** Users should only see navigation items and actions relevant to their assigned permissions.
- **Data Accuracy:** Forms must provide validation, clear error messages, and confirmation for sensitive operations.
- **Workflow Efficiency:** Frequently used actions should be accessible without unnecessary navigation.
- **Privacy by Design:** Sensitive patient information must not be unnecessarily exposed in dashboards, notifications, or shared workspaces.
- **Consistency:** Shared components must use consistent typography, spacing, colors, and interaction patterns.
- **Clinical Safety:** The interface must not imply that a system-generated status or visual indicator replaces professional clinical judgment.

---

## 2. Core Visual Identity: Green & White Healthcare Information System

The visual identity reflects a professional, clean, high-trust, and operational healthcare information platform.

### 2.1 Visual Direction

- **Primary Identity:** Healthcare Green (#007A55) and Pure Hospital White (#FFFFFF).
- **Supporting Colors:** Cool slate neutrals for backgrounds, borders, and secondary text.
- **Clinical Daylighting:** The interface must remain bright, readable, and high-contrast for hospital workstations.
- **Professional Character:** The interface should feel like an enterprise healthcare application, not a promotional hospital website.
- **Precision over Decoration:** Prioritize readable tables, structured forms, patient information, and operational workflows.

### 2.2 Anti-AI-Slop Healthcare Standards

- No decorative gradients, glowing backgrounds, or unnecessary glassmorphism.
- No floating decorative illustrations or cartoon-style interface elements.
- Use flat, opaque surfaces with clear 1px borders.
- Use modest functional corner radii.
- Avoid excessive pill-shaped buttons and oversized rounded containers.
- Pill geometry is reserved for compact status badges.
- Avoid excessive empty space in information-dense clinical screens.
- Use consistent 4px-based spacing.
- Do not use color as the only communicator of status.
- Every status badge must include readable text and, where appropriate, an icon.
- Avoid unnecessary animations in clinical workflows.
- Monospace typography is reserved for identifiers, codes, and technical values.
- Do not use oversized dashboard headings that consume valuable workspace.

### 2.3 Typeface Restrictions

Do not use:

- Geist
- Inter
- Space Grotesk
- Poppins

Recommended interface font:

- Plus Jakarta Sans
- Clean system sans-serif fallback

Recommended monospace font:

- ui-monospace
- SFMono-Regular
- Menlo
- Monaco
- Consolas

---

## 3. Color Palette & Semantic Token Architecture

All styling must be centralized through semantic CSS variables in `app/globals.css`.

### 3.1 Primary Healthcare Green Tokens

| Token | Hex Value | Semantic Usage |
|---|---|---|
| `--hospital-green` | #007A55 | Primary action buttons, navigation surface, active navigation, selected controls |
| `--hospital-green-hover` | #006345 | Primary button hover |
| `--hospital-green-dark` | #064E3B | Page headings, emphasized labels |
| `--hospital-green-light` | #F0FDF4 | Selected rows, active navigation backgrounds |
| `--hospital-green-border` | #BBF7D0 | Green borders, selected states |
| `--hospital-green-foreground` | #FFFFFF | Text on primary green backgrounds |

### 3.2 Neutral Surfaces & Architectural Borders

| Token | Hex Value | Semantic Usage |
|---|---|---|
| `--hospital-white` | #FFFFFF | Cards, dialogs, tables, and form fields |
| `--hospital-surface` | #F8FAFC | Main application background |
| `--hospital-surface-muted` | #F1F5F9 | Table headers, secondary panels, disabled backgrounds |
| `--hospital-border` | #E2E8F0 | Standard component borders |
| `--hospital-border-subtle` | #F1F5F9 | Internal separators |

### 3.3 High-Contrast Typography

| Token | Hex Value | Semantic Usage |
|---|---|---|
| `--hospital-text` | #0F172A | Primary text, headings, and table content |
| `--hospital-text-muted` | #475569 | Secondary text, descriptions, and timestamps |
| `--hospital-text-subtle` | #64748B | Supporting metadata |
| `--hospital-text-inverse` | #FFFFFF | Text on dark and green backgrounds |

### 3.4 Multi-Cue Status System

| Status | Background | Border | Text | Icon |
|---|---|---|---|---|
| Success / Completed | #ECFDF5 | #A7F3D0 | #065F46 | CheckCircle2 |
| Warning / Pending | #FFFBEB | #FDE68A | #92400E | Clock |
| Danger / Critical | #FEF2F2 | #FECACA | #991B1B | AlertCircle |
| Information / Processing | #F0F9FF | #BAE6FD | #075985 | Info |
| Neutral / Inactive | #F1F5F9 | #E2E8F0 | #475569 | Circle |

### 3.5 Hospital Workflow Status Colors

Use consistent status colors across all hospital modules.

| Workflow Status | Color | Example Usage |
|---|---|---|
| Registered | Blue | Newly registered patients |
| Scheduled | Blue | Upcoming appointments |
| Waiting | Amber | Patients waiting for consultation |
| In Consultation | Purple | Active physician consultation |
| Admitted | Green | Currently admitted patients |
| Transferred | Cyan | Patients transferred to another unit |
| Discharged | Slate | Completed hospital admission |
| Pending | Amber | Unprocessed requests |
| Processing | Blue | Active laboratory or pharmacy processing |
| Completed | Green | Completed requests and procedures |
| Cancelled | Red | Cancelled appointments or requests |
| Critical | Red | Clinically critical indicators requiring authorized review |

**Important:** Clinical severity must be based on authorized clinical data and hospital-approved rules. Never invent a diagnosis or determine patient severity using visual styling alone.

### 3.6 Department Identity Colors

Department colors may be used for small navigation indicators, charts, and department labels. They must not override the primary green identity.

| Department | Accent Color |
|---|---|
| Emergency Department | #DC2626 |
| Outpatient Department | #2563EB |
| Inpatient Department | #059669 |
| Laboratory | #7C3AED |
| Pharmacy | #D97706 |
| Radiology | #0891B2 |
| Billing | #475569 |
| Administration | #007A55 |

---

## 4. Typography & Readability Standards

### 4.1 Typeface Families

**Primary Interface Font**

Use Plus Jakarta Sans or a clean system sans-serif stack.

```css
font-family:
  "Plus Jakarta Sans",
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  Roboto,
  sans-serif;
```

**Monospace Code Font**

Use only for:

- Medical record numbers
- Patient identifiers
- Transaction references
- Laboratory request codes
- Prescription references
- Technical identifiers

```css
font-family:
  ui-monospace,
  SFMono-Regular,
  Menlo,
  Monaco,
  Consolas,
  "Liberation Mono",
  monospace;
```

### 4.2 Type Scale & Hierarchy

| Level | Font Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| Display / H1 | 20px | 1.25 | Bold (700) | Page titles |
| Section / H2 | 16px | 1.35 | Semibold (600) | Section headings |
| Card Title / H3 | 14px | 1.40 | Semibold (600) | Card headings |
| Body / Standard | 13px | 1.50 | Regular (400) | Descriptions and table data |
| Metadata / Caption | 11px | 1.40 | Medium (500) | Timestamps and helper notes |
| Compact Data | 12px | 1.40 | Regular (400) | Dense tables and lists |
| Identifier | 11px | 1.60 | Regular (400) | Medical record and reference numbers |

### 4.3 Readability Requirements

- Maintain readable contrast between text and background.
- Do not use extremely small text for critical patient information.
- Use consistent date and time formatting.
- Display measurement units beside clinical values.
- Use explicit labels for clinical measurements.
- Distinguish editable fields from read-only information.
- Do not truncate patient names or important identifiers without a way to view their complete values.
- Make validation messages easy to identify.
- Use readable labels and descriptions in all forms.

---

## 5. Spacing, Sizing, Layout & Responsive Behavior

### 5.1 Base 4px Spatial Grid

All margins, paddings, heights, and gaps follow a 4px scale.

| Spacing | Tailwind | Usage |
|---|---|---|
| 4px | `p-1` | Inner icon gaps and compact badge padding |
| 8px | `p-2` | Button internal spacing and compact rows |
| 12px | `p-3` | Form groups and search filters |
| 16px | `p-4` | Standard card padding |
| 20px | `p-5` | Card header and dialog padding |
| 24px | `p-6` | Main content padding |
| 32px | `p-8` | Major section separation |

### 5.2 Application Shell Layout

Recommended desktop application layout:

```text
+----------------------------------------------------------------+
| HEADER                                                         |
| Logo | Hospital Name | Current Module | Notifications | User  |
+---------------------+------------------------------------------+
|                     |                                          |
| SIDEBAR             | MAIN CONTENT                             |
|                     |                                          |
| Dashboard           | Page Title                               |
| Patients            | Breadcrumbs                              |
| Appointments        |                                          |
| Admissions          | KPI Cards / Summary                      |
| Medical Records     |                                          |
| Doctors & Staff     | Tables / Forms / Charts                  |
| Nursing             |                                          |
| Laboratory          |                                          |
| Pharmacy            |                                          |
| Billing             |                                          |
| Inventory           |                                          |
| Reports             |                                          |
| Settings            |                                          |
|                     |                                          |
+---------------------+------------------------------------------+
```

### 5.3 Responsive Breakpoints & Viewport Behavior

**Mobile (< 640px)**

- Sidebar collapses into an off-canvas drawer.
- Header displays a compact logo and mobile navigation trigger.
- Metric cards stack into a single column.
- Forms use a single-column layout.
- Tables support horizontal scrolling or mobile-friendly list layouts.
- Primary actions remain accessible.
- Patient information must remain readable without horizontal overflow.

**Tablet (640px–1023px)**

- Sidebar may collapse into icon navigation.
- Metric cards display in two-column grids.
- Forms may use two columns where appropriate.
- Tables support horizontal scrolling.
- Patient profile sections use compact layouts.

**Desktop (1024px–1439px)**

- Full persistent 256px sidebar.
- Main content uses flexible width.
- Dashboard metrics use three or four columns.
- Patient profiles use structured multi-column layouts.
- Tables use the available workspace.

**Wide Workstation (>= 1440px)**

- Maintain consistent maximum content widths for forms and detail pages.
- Allow operational tables to use available horizontal space.
- Use split layouts for patient information and related activity.
- Avoid excessively stretched form fields.

### 5.4 Standard Layout Dimensions

| Element | Recommended Dimension |
|---|---|
| Header | 64px |
| Sidebar | 256px |
| Collapsed Sidebar | 72px |
| Main Content Padding | 24px |
| Standard Button | 36px height |
| Standard Input | 36px height |
| Standard Table Row | 48–56px |
| Compact Table Row | 40px |
| Card Radius | 6px |
| Input Radius | 6px |
| Modal Radius | 6px |

---

## 6. Component Style Specifications

Every component must follow a consistent design system and support loading, empty, success, error, and disabled states where applicable.

### 6.1 Buttons

**Primary**

```tsx
"bg-hospital-green hover:bg-hospital-green-hover text-white rounded-md shadow-xs h-9 px-3.5 text-sm font-medium transition-colors cursor-pointer"
```

**Secondary**

```tsx
"bg-hospital-surface-muted hover:bg-slate-200 text-hospital-text border border-hospital-border rounded-md h-9 px-3.5 text-sm"
```

**Outline**

```tsx
"bg-white hover:bg-hospital-green-light text-hospital-green border border-hospital-green-border rounded-md h-9 px-3.5 text-sm"
```

**Destructive**

```tsx
"bg-red-600 hover:bg-red-700 text-white rounded-md h-9 px-3.5 text-sm font-medium"
```

**Focus Ring**

```tsx
"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hospital-green focus-visible:ring-offset-1"
```

**Disabled**

```tsx
"disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
```

Button requirements:

- Use descriptive action labels such as Save Patient, Schedule Appointment, and Record Payment.
- Avoid vague labels such as Submit when a more descriptive label is possible.
- Destructive actions must require confirmation when they can affect important records.
- Do not use multiple primary buttons in the same action group without a clear reason.
- Provide loading indicators during asynchronous operations.
- Prevent duplicate submissions while an operation is processing.

### 6.2 Form Inputs, Selects & Textareas

**Field**

```tsx
"w-full h-9 rounded-md border border-hospital-border bg-white px-3 py-1 text-sm text-hospital-text placeholder:text-slate-400 transition-colors"
```

**Focus**

```tsx
"focus:outline-none focus:border-hospital-green focus:ring-1 focus:ring-hospital-green"
```

**Label**

```tsx
"text-xs font-medium text-hospital-text mb-1 block"
```

**Error**

```tsx
"border-red-500 text-red-700"
```

Form requirements:

- Every input must have a visible label.
- Required fields must be clearly marked.
- Validation errors must appear near the affected field.
- Use appropriate input types for dates, times, numbers, and email addresses.
- Do not use placeholder text as a replacement for labels.
- Display measurement units where applicable.
- Distinguish required fields from optional fields.
- Use appropriate confirmation for sensitive operations.
- Preserve entered data when validation fails.
- Provide accessible keyboard navigation.

### 6.3 Data Tables

**Container**

```tsx
"rounded-md border border-hospital-border bg-white overflow-hidden"
```

**Header**

```tsx
"bg-hospital-surface-muted border-b border-hospital-border h-10 px-4 text-left text-xs font-semibold text-hospital-text-muted"
```

**Row**

```tsx
"border-b border-hospital-border hover:bg-hospital-surface transition-colors"
```

**Cell**

```tsx
"px-4 py-3 align-middle text-sm text-hospital-text"
```

Table requirements:

- Support pagination.
- Support search and filtering where applicable.
- Provide clear empty states.
- Use consistent date formatting.
- Display status badges.
- Keep important identifiers visible.
- Provide sorting for relevant columns.
- Avoid placing too many actions inside a single row.
- Confirm before deleting or modifying sensitive records.
- Provide responsive behavior for smaller screens.
- Use loading skeletons while retrieving records.

### 6.4 Cards

**Container**

```tsx
"bg-white border border-hospital-border rounded-md shadow-xs"
```

**Header**

```tsx
"p-5 border-b border-hospital-border-subtle"
```

**Title**

```tsx
"text-sm font-semibold text-hospital-text"
```

**Description**

```tsx
"text-xs text-hospital-text-muted mt-1"
```

**Content**

```tsx
"p-5"
```

Cards should organize related information rather than serve as decorative elements.

### 6.5 Status Badges

**Base**

```tsx
"inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border select-none"
```

**Completed**

```tsx
"bg-emerald-50 text-emerald-800 border-emerald-200"
```

**Pending**

```tsx
"bg-amber-50 text-amber-800 border-amber-200"
```

**Critical**

```tsx
"bg-red-50 text-red-800 border-red-200"
```

**Processing**

```tsx
"bg-sky-50 text-sky-800 border-sky-200"
```

**Inactive**

```tsx
"bg-slate-100 text-slate-700 border-slate-200"
```

Every badge must include a readable status label. Never communicate status using color alone.

### 6.6 Modal Dialogs

**Backdrop**

```tsx
"fixed inset-0 bg-slate-900/40 z-50"
```

**Dialog**

```tsx
"relative w-full max-w-lg rounded-md bg-white border border-hospital-border shadow-lg max-h-[90vh] overflow-y-auto"
```

**Header**

```tsx
"p-5 border-b border-hospital-border flex items-center justify-between"
```

Modal requirements:

- Use clear titles and descriptions.
- Provide explicit Cancel and Confirm actions.
- Prevent accidental dismissal during critical workflows where appropriate.
- Ensure keyboard accessibility.
- Maintain readable content within the viewport.
- Use confirmation dialogs for irreversible or sensitive operations.

### 6.7 Alerts

**Container**

```tsx
"flex items-start gap-3 p-3.5 rounded-md border text-xs leading-relaxed"
```

**Information**

```tsx
"bg-sky-50 border-sky-200 text-sky-900"
```

**Success**

```tsx
"bg-emerald-50 border-emerald-200 text-emerald-900"
```

**Warning**

```tsx
"bg-amber-50 border-amber-200 text-amber-900"
```

**Danger**

```tsx
"bg-red-50 border-red-200 text-red-900"
```

Alerts must provide actionable information whenever possible.

### 6.8 Dropdown Menus

- Use white backgrounds.
- Apply subtle borders and shadows.
- Maintain consistent item height.
- Provide visible hover and focus states.
- Use icons only when they improve recognition.
- Keep destructive actions visually separated.
- Ensure keyboard navigation works.

### 6.9 Tabs

- Use a clean horizontal tab layout.
- Active tabs use hospital green text and a green bottom border.
- Inactive tabs use muted slate text.
- Avoid oversized rounded tab containers.
- Ensure tab labels remain readable on smaller screens.

### 6.10 Pagination

- Use compact previous and next controls.
- Highlight the current page using the primary green.
- Display total records and current page information.
- Disable navigation controls when unavailable.
- Keep pagination consistent across all data tables.

### 6.11 Search Bars

```tsx
"flex h-9 w-full items-center gap-2 rounded-md border border-hospital-border bg-white px-3 text-sm"
```

Search requirements:

- Provide a descriptive placeholder.
- Use a search icon.
- Support clear-search actions.
- Avoid excessive search animations.
- Provide loading feedback when retrieving results.
- Do not expose unauthorized patient records in search results.

### 6.12 Loading Skeletons

- Match the shape of the content being loaded.
- Use subtle animation.
- Avoid large distracting animated blocks.
- Maintain the intended page layout while loading.

Example:

```tsx
"animate-pulse rounded-md bg-hospital-surface-muted"
```

### 6.13 Empty States

Empty states should contain:

- A simple relevant icon.
- A concise title.
- A short explanation.
- A relevant primary action when appropriate.

Example:

```text
No patients found

There are currently no patient records matching your search.

[Register Patient]
```

---

## 7. Layout & Navigation Styles

### 7.1 Hospital Header

Recommended component:

`components/layout/hospital-header.tsx`

**Height and Position**

```tsx
"sticky top-0 z-40 h-16 w-full border-b border-hospital-green-hover bg-hospital-green px-6"
```

**Brand Identity**

- White brand tile with the green hospital mark.
- Hospital name in white.
- Supporting line in white/90.
- Compact logo and name presentation.
- Do not fabricate or imitate an official government seal.
- Use an authorized logo asset only when available.

The header and sidebar share the primary healthcare green surface. Header controls use white/80 icons and white/10 hover fills; the account menu remains a white dropdown for readability.

**Header Elements**

1. Hospital logo and name.
2. Current module or page context.
3. Optional department or facility selector.
4. Notification center.
5. User profile.
6. Session controls.

**User Profile**

- Display the authenticated user's name.
- Display their assigned role.
- Provide profile settings.
- Provide a dedicated Sign Out action.

Do not hardcode fictional users or use sample names as actual authenticated user information.

### 7.2 Sidebar

Recommended component:

`components/layout/hospital-sidebar.tsx`

**Width**

```tsx
"w-64 shrink-0 border-r border-hospital-green-hover bg-hospital-green flex flex-col h-[calc(100vh-4rem)]"
```

**Section Headers**

```tsx
"px-3 text-[11px] font-bold uppercase tracking-wider text-white/90"
```

**Navigation Item — Default**

```tsx
"px-3 py-2 text-xs font-medium text-white/90 hover:bg-white/10 hover:text-white rounded-md transition-colors"
```

**Navigation Item — Active**

```tsx
"bg-hospital-green-light text-hospital-green-dark font-semibold border-l-2 border-white"
```

The sidebar uses the primary healthcare green surface. Active items keep the light-green token and a white left marker for contrast against the green panel.

**Navigation Structure**

```text
OVERVIEW
  Dashboard

PATIENT SERVICES
  Patients
  Appointments
  Admissions
  Discharges

CLINICAL SERVICES
  Medical Records
  Nursing
  Doctors & Staff

DIAGNOSTIC SERVICES
  Laboratory
  Radiology

MEDICATION SERVICES
  Pharmacy
  Prescriptions

FINANCIAL SERVICES
  Billing
  Payments

OPERATIONS
  Inventory
  Departments
  Rooms & Beds

MANAGEMENT
  Reports & Analytics
  User Management
  Audit Logs
  Settings
```

Navigation must be filtered according to the authenticated user's role and permissions.

### 7.3 Breadcrumbs

- Display the current page hierarchy.
- Use muted text for parent pages.
- Use darker text for the active page.
- Keep breadcrumbs compact.
- Avoid excessively long breadcrumb labels.

### 7.4 Page Header

Every module page should have:

- Page title.
- Short description.
- Breadcrumbs when applicable.
- Primary action aligned to the right.
- Optional filters or secondary actions.

Example:

```text
Patients

Manage patient registrations and hospital records.

[Search Patients...]                    [+ Register Patient]
```

### 7.5 User Profile Menu

The profile dropdown should contain:

- Authenticated user's name.
- Assigned role.
- Account settings.
- Profile information.
- Sign Out.

Do not expose password information, sensitive authentication tokens, or other private account credentials.

---

## 8. Specific Hospital Management UI Patterns

### 8.1 Hospital Dashboard

Route:

`/dashboard`

The dashboard provides a high-level overview of hospital operations.

**Metric Cards**

Recommended metrics:

- Total Registered Patients
- Today's Appointments
- Currently Admitted Patients
- Available Beds
- Pending Laboratory Requests
- Pending Prescriptions
- Outstanding Billing

**Dashboard Layout**

```text
+------------------------------------------------------------+
| Dashboard                                                  |
| Hospital operations overview                               |
+------------------------------------------------------------+
| Total Patients | Appointments | Admissions | Available Beds|
+------------------------------------------------------------+
|                                                            |
| Patient Admission Trends       Appointment Overview        |
|                                                            |
+------------------------------------------------------------+
| Recent Patient Registrations   Pending Activities          |
|                                                            |
+------------------------------------------------------------+
```

**Visual Requirements**

- Use clean white metric cards.
- Use green for primary indicators.
- Use other semantic colors only when relevant.
- Avoid excessive charts.
- Use readable chart legends.
- Include meaningful date ranges.
- Display loading and empty states.

Dashboard statistics must be retrieved from actual authorized Supabase data. Never hardcode operational metrics.

### 8.2 Patient Management

Route:

`/patients`

**Patient List**

Recommended columns:

| Column | Description |
|---|---|
| Medical Record Number | Unique patient identifier |
| Patient Name | Full patient name |
| Sex | Registered demographic information |
| Date of Birth | Patient birth date |
| Contact Number | Registered contact information |
| Registration Date | Date registered |
| Status | Current registration status |
| Actions | View, Edit, and other authorized actions |

**Patient Registration**

Route:

`/patients/new`

The registration interface should use organized sections:

1. Personal Information
2. Contact Information
3. Address Information
4. Emergency Contact
5. Additional Registration Information

**Patient Profile**

Route:

`/patients/[id]`

Recommended sections:

- Patient Overview
- Demographic Information
- Contact Information
- Medical History
- Allergies
- Appointments
- Admissions
- Clinical Encounters
- Laboratory Results
- Prescriptions
- Billing History

**Visual Requirements**

- Display the medical record number prominently.
- Display patient identity consistently.
- Separate demographic information from clinical information.
- Use clear section headings.
- Avoid showing unnecessary sensitive information.
- Apply role-based visibility to sensitive records.

### 8.3 Appointment Management

Route:

`/appointments`

**Appointment Views**

- Calendar View
- Daily Schedule
- Appointment List

**Appointment Form**

Fields may include:

- Patient
- Department
- Physician
- Appointment Date
- Appointment Time
- Appointment Type
- Reason for Visit
- Appointment Status

**Appointment Statuses**

- Scheduled
- Confirmed
- Waiting
- In Consultation
- Completed
- Cancelled
- No Show

**Visual Requirements**

- Use clear calendar navigation.
- Display appointment status using consistent badges.
- Make available time slots easy to identify.
- Prevent selection of unavailable schedules based on validated scheduling data.
- Provide appointment details in a readable dialog or detail page.

### 8.4 Admission, Discharge & Transfer

Route:

`/admissions`

**Admission Dashboard**

Display:

- Current Admissions
- Available Beds
- Occupied Beds
- Pending Discharges
- Recent Transfers

**Admission Form**

Fields may include:

- Patient
- Attending Physician
- Department
- Room
- Bed
- Admission Date
- Admission Type
- Admission Notes

**Bed Management**

Use a structured bed availability interface.

```text
+-----------------------------------------------+
| Ward / Department                             |
+-----------------------------------------------+
| Bed 01 | Occupied                              |
| Bed 02 | Available                             |
| Bed 03 | Occupied                              |
| Bed 04 | Maintenance                           |
+-----------------------------------------------+
```

**Discharge Workflow**

- Display patient admission details.
- Display discharge date.
- Provide authorized discharge documentation.
- Show outstanding billing information where appropriate.
- Require confirmation before finalizing discharge.

Never treat a visually available bed as available unless its actual database status confirms availability.

### 8.5 Electronic Medical Records

Route:

`/medical-records`

**Patient Encounter Workspace**

The EMR interface must prioritize readability and clear clinical organization.

Recommended sections:

- Patient Information
- Vital Signs
- Chief Complaint
- Medical History
- Allergies
- Diagnoses
- Clinical Notes
- Treatment Plan
- Prescriptions
- Encounter History

**Vital Signs Presentation**

| Measurement | Display |
|---|---|
| Blood Pressure | Value with mmHg |
| Heart Rate | Value with bpm |
| Respiratory Rate | Value with breaths/min |
| Temperature | Value with °C |
| Oxygen Saturation | Value with % |
| Weight | Value with kg |
| Height | Value with cm |

**Visual Requirements**

- Display measurement units.
- Show recording timestamps.
- Identify the staff member who recorded the information.
- Distinguish historical records from current encounters.
- Use clear labels and readable values.
- Preserve clinical documentation history according to the system's record-management rules.

Clinical records must only be created, edited, or finalized by authorized personnel. The interface must not automatically generate diagnoses or treatment decisions.

### 8.6 Doctor & Staff Management

Route:

`/staff`

**Staff List**

Recommended columns:

- Employee or Staff ID
- Name
- Role
- Department
- Contact Information
- Account Status
- Actions

**Staff Profile**

Recommended sections:

- Personal Information
- Professional Information
- Department Assignment
- Work Schedule
- Account Status

**Visual Requirements**

- Use role labels and department labels.
- Use consistent profile layouts.
- Separate employment information from authentication details.
- Restrict administrative actions according to permissions.

### 8.7 Nursing Management

Route:

`/nursing`

**Nursing Dashboard**

Display:

- Assigned Patients
- Pending Assessments
- Recent Vital Signs
- Active Nursing Tasks

**Nursing Workspace**

Recommended sections:

- Assigned Patient List
- Patient Overview
- Vital Signs Recording
- Nursing Assessment
- Nursing Notes
- Care Documentation

**Visual Requirements**

- Prioritize patient identification.
- Provide clear patient assignment indicators.
- Display timestamps for recorded observations.
- Use structured forms.
- Avoid excessive navigation between assigned patients and their records.

### 8.8 Laboratory Management

Route:

`/laboratory`

**Laboratory Dashboard**

Display:

- Pending Requests
- Specimens Collected
- Processing Requests
- Completed Results

**Laboratory Request List**

Recommended columns:

- Request Number
- Patient
- Requested Test
- Request Date
- Specimen Status
- Processing Status
- Actions

**Laboratory Workflow**

```text
Request Created
      |
      v
Pending Collection
      |
      v
Specimen Collected
      |
      v
Processing
      |
      v
Result Entered
      |
      v
Result Verified
      |
      v
Completed
```

**Visual Requirements**

- Use clearly labeled request statuses.
- Distinguish specimen status from result status.
- Display request and collection timestamps.
- Display result units and reference ranges only when supplied by the authorized laboratory configuration.
- Provide result verification actions only to authorized personnel.

### 8.9 Radiology Management

Route:

`/radiology`

**Radiology Dashboard**

Display:

- Pending Requests
- Scheduled Examinations
- Examinations in Progress
- Completed Reports

**Radiology Request List**

Recommended columns:

- Request Number
- Patient
- Examination Type
- Requesting Physician
- Schedule
- Status
- Actions

**Visual Requirements**

- Display examination details clearly.
- Distinguish scheduled examinations from completed examinations.
- Provide report access according to permissions.
- Do not display diagnostic interpretations as verified unless the authorized workflow confirms verification.

### 8.10 Pharmacy Management

Route:

`/pharmacy`

**Pharmacy Dashboard**

Display:

- Pending Prescriptions
- Prescriptions Ready for Dispensing
- Dispensed Prescriptions
- Low Stock Medicines
- Expiring Medicines

**Prescription Queue**

Recommended columns:

- Prescription Number
- Patient
- Prescribing Physician
- Prescription Date
- Dispensing Status
- Actions

**Medication Inventory**

Recommended columns:

- Medicine Name
- Generic Name
- Strength
- Dosage Form
- Available Quantity
- Unit
- Expiration Date
- Stock Status

**Visual Requirements**

- Clearly distinguish available, low-stock, and out-of-stock items.
- Display expiration information.
- Provide confirmation before dispensing.
- Display dispensing history.
- Ensure medication records are accessible only to authorized users.

### 8.11 Billing & Payments

Route:

`/billing`

**Billing Dashboard**

Display:

- Total Billing
- Paid Transactions
- Unpaid Invoices
- Outstanding Balances
- Recent Payments

**Invoice List**

Recommended columns:

- Invoice Number
- Patient
- Admission or Encounter Reference
- Invoice Date
- Total Amount
- Payment Status
- Actions

**Invoice Detail**

Display:

- Hospital Information
- Patient Information
- Invoice Reference
- Itemized Charges
- Discounts, when authorized
- Total Amount
- Amount Paid
- Outstanding Balance
- Payment History

**Payment Statuses**

- Unpaid
- Partially Paid
- Paid
- Cancelled
- Refunded

**Visual Requirements**

- Use readable currency formatting.
- Highlight outstanding balances.
- Provide transaction references.
- Require confirmation for payment recording and refund operations.
- Do not modify finalized financial records without the appropriate authorized workflow.

### 8.12 Inventory Management

Route:

`/inventory`

**Inventory Dashboard**

Display:

- Total Inventory Items
- Available Stock
- Low Stock Items
- Out-of-Stock Items
- Expiring Items

**Inventory List**

Recommended columns:

- Item Code
- Item Name
- Category
- Current Quantity
- Unit
- Reorder Level
- Expiration Date
- Stock Status
- Actions

**Inventory Operations**

- Stock In
- Stock Out
- Stock Adjustment
- Stock Transfer
- Inventory History

**Visual Requirements**

- Clearly display quantity and units.
- Use consistent stock status indicators.
- Display transaction timestamps.
- Provide transaction history.
- Require confirmation for stock adjustments.

### 8.13 Reports & Analytics

Route:

`/reports`

**Report Categories**

- Patient Registration Reports
- Appointment Reports
- Admission and Discharge Reports
- Bed Occupancy Reports
- Laboratory Reports
- Pharmacy Reports
- Billing Reports
- Inventory Reports
- Staff Reports

**Visual Requirements**

- Use clean charts.
- Display date ranges.
- Provide filtering by department where appropriate.
- Use readable chart labels and legends.
- Provide export actions where authorized.
- Avoid presenting incomplete or unauthorized information as official statistics.

### 8.14 User & Role Management

Route:

`/settings/users`

**User List**

Recommended columns:

- User
- Email
- Assigned Role
- Department
- Account Status
- Last Activity
- Actions

**Role Management**

Recommended roles:

- System Administrator
- Hospital Administrator
- Receptionist
- Physician
- Nurse
- Laboratory Staff
- Pharmacist
- Billing Staff
- Inventory Staff

**Visual Requirements**

- Display assigned roles clearly.
- Use explicit permission descriptions.
- Require confirmation for account deactivation and role changes.
- Never rely on hidden navigation alone for security. Permissions must also be enforced by the database.

### 8.15 Audit Logs

Route:

`/audit-logs`

**Audit Table**

Recommended columns:

- Timestamp
- User
- Action
- Module
- Affected Record
- Result

**Visual Requirements**

- Use a readable chronological table.
- Provide filters for date, user, and action.
- Distinguish successful and failed actions.
- Restrict access to authorized administrative personnel.
- Do not provide ordinary users with controls to modify audit history.

---

## 9. Component State Catalog & Supabase Error Contract

Every data-driven component must handle four explicit UI states.

### 9.1 Loading State

Use skeleton components matching the target layout.

Examples:

- `MetricCardSkeleton`
- `TableRowSkeleton`
- `PatientProfileSkeleton`
- `FormSkeleton`

Recommended class:

```tsx
"animate-pulse bg-hospital-surface-muted rounded-md"
```

### 9.2 Empty State

Use a reusable `components/ui/empty-state.tsx`.

The empty state should display:

- Relevant icon
- Clear title
- Short explanation
- Primary action when appropriate

Example:

```text
No appointments found

There are no appointments matching your selected filters.

[Schedule Appointment]
```

### 9.3 Success State

- Display a toast notification or success alert.
- Update the UI after the database operation succeeds.
- Use optimistic updates only when rollback behavior is implemented correctly.
- Never indicate that a sensitive operation succeeded before receiving confirmation from Supabase.

### 9.4 Error State

Use:

`components/ui/alert.tsx`

Variant:

```tsx
variant="danger"
```

Display friendly, actionable error messages.

Common database error handling:

| PostgreSQL Code | Meaning | UI Response |
|---|---|---|
| 23505 | Unique violation | A record with this identifier already exists. |
| 23503 | Foreign key violation | This record cannot be removed because related records depend on it. |
| 23502 | Not-null violation | A required field is missing. |
| 42501 | Insufficient privilege | You do not have permission to perform this action. |
| 23514 | Check constraint violation | The provided information does not meet the required validation rules. |

Do not expose raw database errors, internal SQL statements, authentication tokens, or sensitive implementation details to ordinary users.

### 9.5 Confirmation State

Sensitive operations must use confirmation dialogs.

Examples:

- Discharging a patient
- Cancelling an appointment
- Recording a payment
- Dispensing medication
- Adjusting inventory
- Deactivating a staff account

The confirmation dialog must clearly identify the operation being performed.

### 9.6 Data Integrity

- Prevent duplicate form submissions.
- Validate required information before saving.
- Handle network failures gracefully.
- Preserve form data when an operation fails.
- Use database transactions for operations that require atomic updates.
- Use server-side authorization and database RLS policies.
- Never assume that hiding an action in the frontend makes the operation secure.

---

## 10. Accessibility, Privacy & Clinical Usability

### 10.1 Accessibility

- Use semantic HTML elements.
- Provide accessible labels for inputs.
- Support keyboard navigation.
- Provide visible focus indicators.
- Use readable text sizes.
- Maintain sufficient color contrast.
- Provide accessible dialog behavior.
- Do not rely exclusively on color to convey information.
- Use descriptive labels for icons and icon-only buttons.

### 10.2 Patient Privacy

- Display only the patient information necessary for the current task.
- Restrict sensitive information according to assigned permissions.
- Do not display patient information in public notifications.
- Do not expose sensitive patient information in URLs.
- Avoid placing patient details in browser console logs.
- Use secure authentication and database authorization.
- Apply appropriate session handling.
- Ensure that unauthorized users cannot access records by manually changing a URL or identifier.

### 10.3 Clinical Usability

- Keep patient identification visible during clinical workflows.
- Display timestamps for clinical records.
- Display measurement units beside vital signs and laboratory values.
- Separate current and historical information.
- Use explicit status labels.
- Require authorized review for sensitive clinical workflows.
- Never present unverified clinical results as verified.
- Never imply that interface colors replace clinical judgment.

---

## 11. Provisional Design Decisions Awaiting Stakeholder Review

The following decisions are provisional and may be adjusted after stakeholder evaluation.

| Item | Current Provisional Value | Alternative Options | Notes |
|---|---|---|---|
| Primary Green | #007A55 | #0F766E, #059669 | Main healthcare identity |
| Header Identity | Hospital logo placeholder | Authorized official hospital logo | Official asset must be supplied |
| Interface Font | Plus Jakarta Sans / System Sans | Other accessible sans-serif | Prefer self-hosted fonts |
| Dark Mode | Daylight-bright default | Optional dark mode | Must not reduce clinical readability |
| Sidebar Width | 256px | 240px, 272px | Adjust based on navigation |
| Table Density | Standard | Compact | Useful for high-volume operational screens |
| Dashboard Layout | KPI cards and operational panels | Role-specific dashboard layouts | Each role may have different priorities |
| Department Colors | Semantic department accents | Single-color department system | Primary green must remain dominant |

---

## 12. Technical Implementation Mapping — Tailwind CSS 4

All design tokens must be declared in:

`app/globals.css`

### 12.1 Global CSS Variables

```css
@import "tailwindcss";

:root {
  /* Primary Healthcare Green */
  --hospital-green: #007A55;
  --hospital-green-hover: #006345;
  --hospital-green-dark: #064E3B;
  --hospital-green-light: #F0FDF4;
  --hospital-green-border: #BBF7D0;
  --hospital-green-foreground: #FFFFFF;

  /* Surfaces & Canvas */
  --hospital-white: #FFFFFF;
  --hospital-surface: #F8FAFC;
  --hospital-surface-muted: #F1F5F9;
  --hospital-border: #E2E8F0;
  --hospital-border-subtle: #F1F5F9;

  /* Typography */
  --hospital-text: #0F172A;
  --hospital-text-muted: #475569;
  --hospital-text-subtle: #64748B;
  --hospital-text-inverse: #FFFFFF;

  /* Clinical Status */
  --status-success: #16A34A;
  --status-warning: #D97706;
  --status-danger: #DC2626;
  --status-info: #0284C7;
  --status-neutral: #64748B;

  /* Department Accent Colors */
  --department-emergency: #DC2626;
  --department-outpatient: #2563EB;
  --department-inpatient: #059669;
  --department-laboratory: #7C3AED;
  --department-pharmacy: #D97706;
  --department-radiology: #0891B2;
  --department-billing: #475569;
  --department-administration: #007A55;

  /* Layout */
  --header-height: 4rem;
  --sidebar-width: 16rem;
  --sidebar-collapsed-width: 4.5rem;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
}

@theme inline {
  /* Primary Healthcare Green */
  --color-hospital-green: var(--hospital-green);
  --color-hospital-green-hover: var(--hospital-green-hover);
  --color-hospital-green-dark: var(--hospital-green-dark);
  --color-hospital-green-light: var(--hospital-green-light);
  --color-hospital-green-border: var(--hospital-green-border);
  --color-hospital-green-foreground: var(--hospital-green-foreground);

  /* Surfaces */
  --color-hospital-white: var(--hospital-white);
  --color-hospital-surface: var(--hospital-surface);
  --color-hospital-surface-muted: var(--hospital-surface-muted);
  --color-hospital-border: var(--hospital-border);
  --color-hospital-border-subtle: var(--hospital-border-subtle);

  /* Typography */
  --color-hospital-text: var(--hospital-text);
  --color-hospital-text-muted: var(--hospital-text-muted);
  --color-hospital-text-subtle: var(--hospital-text-subtle);
  --color-hospital-text-inverse: var(--hospital-text-inverse);

  /* Status */
  --color-status-success: var(--status-success);
  --color-status-warning: var(--status-warning);
  --color-status-danger: var(--status-danger);
  --color-status-info: var(--status-info);
  --color-status-neutral: var(--status-neutral);

  /* Department Colors */
  --color-department-emergency: var(--department-emergency);
  --color-department-outpatient: var(--department-outpatient);
  --color-department-inpatient: var(--department-inpatient);
  --color-department-laboratory: var(--department-laboratory);
  --color-department-pharmacy: var(--department-pharmacy);
  --color-department-radiology: var(--department-radiology);
  --color-department-billing: var(--department-billing);
  --color-department-administration: var(--department-administration);

  /* Font Families */
  --font-sans: "Plus Jakarta Sans", Arial, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  background: var(--hospital-surface);
  color: var(--hospital-text);
  font-family:
    "Plus Jakarta Sans",
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    sans-serif;
  font-size: 13px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

button,
input,
select,
textarea {
  font: inherit;
}

button {
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
}

::selection {
  background: var(--hospital-green-light);
  color: var(--hospital-green-dark);
}

:focus-visible {
  outline: 2px solid var(--hospital-green);
  outline-offset: 2px;
}
```

### 12.2 Global Styling Rules

- All application components must use semantic color tokens.
- Avoid hardcoding primary brand colors in individual components.
- Keep the global background consistent.
- Use white surfaces for cards, forms, and tables.
- Use the same border and radius standards throughout the application.
- Avoid unnecessary gradients and decorative shadows.
- Keep focus indicators visible.
- Maintain consistent font families.

Updating any CSS variable in `:root` should recolor the corresponding interface elements without requiring changes to individual component structures.

---

## 13. Frontend Component Architecture

Recommended reusable component organization:

```text
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── patients/
│   │   ├── appointments/
│   │   ├── admissions/
│   │   ├── medical-records/
│   │   ├── staff/
│   │   ├── nursing/
│   │   ├── laboratory/
│   │   ├── radiology/
│   │   ├── pharmacy/
│   │   ├── billing/
│   │   ├── inventory/
│   │   ├── reports/
│   │   └── settings/
│   ├── globals.css
│   └── layout.tsx
│
├── components/
│   ├── layout/
│   │   ├── hospital-header.tsx
│   │   ├── hospital-sidebar.tsx
│   │   ├── dashboard-layout.tsx
│   │   ├── page-header.tsx
│   │   └── breadcrumbs.tsx
│   │
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── textarea.tsx
│   │   ├── checkbox.tsx
│   │   ├── radio-group.tsx
│   │   ├── card.tsx
│   │   ├── table.tsx
│   │   ├── badge.tsx
│   │   ├── modal.tsx
│   │   ├── alert.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── tabs.tsx
│   │   ├── pagination.tsx
│   │   ├── skeleton.tsx
│   │   ├── empty-state.tsx
│   │   ├── confirmation-dialog.tsx
│   │   └── toast.tsx
│   │
│   ├── dashboard/
│   ├── patients/
│   ├── appointments/
│   ├── admissions/
│   ├── medical-records/
│   ├── nursing/
│   ├── laboratory/
│   ├── radiology/
│   ├── pharmacy/
│   ├── billing/
│   ├── inventory/
│   └── reports/
│
├── lib/
│   ├── supabase/
│   ├── utils/
│   └── validations/
│
└── types/
    └── database.types.ts
```

This architecture is a recommended frontend organization. Adjust it to the actual project structure without unnecessarily duplicating components.

---

## 14. Final Design & Implementation Rules

All developers and AI coding agents must follow these rules when creating or modifying the HMS interface.

1. Follow this `THEME.md` as the primary visual design reference.
2. Follow `PROJECT.md` for the actual system modules, requirements, workflows, and business rules.
3. Use the healthcare green and white identity consistently.
4. Build reusable UI components instead of duplicating styling.
5. Use semantic CSS variables and Tailwind theme tokens.
6. Keep the interface professional, clean, and information-focused.
7. Prioritize patient information readability.
8. Ensure all clinical and administrative screens are role-aware.
9. Implement loading, empty, success, and error states.
10. Use responsive layouts across desktop, tablet, and mobile.
11. Avoid fake dashboard statistics and hardcoded operational records.
12. Do not use decorative UI elements that reduce information density.
13. Do not create fictional hospital logos or claim official branding without authorized assets.
14. Never expose sensitive patient information to unauthorized users.
15. Ensure database-level authorization rather than relying only on frontend visibility.
16. Keep all interactive elements functional.
17. Use descriptive action labels and meaningful validation messages.
18. Ensure that the actual application workflows follow the project specification.
19. Do not invent clinical diagnoses, treatment decisions, or laboratory results.
20. Maintain consistent styling across all hospital modules.

**The final interface should look and behave like a professional enterprise Hospital Management System: clean, clinical, structured, readable, responsive, secure, and efficient for everyday hospital operations.**