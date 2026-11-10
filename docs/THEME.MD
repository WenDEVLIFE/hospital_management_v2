# THEME.md — Design System & UI Specification

# SPMC Integrated System & Documentation Generation Platform
**Southern Philippines Medical Center (SPMC)**

Companion document to [`docs/PROJECT.MD`](file:///E:/hospital_management_v2/docs/PROJECT.MD) and [`docs/SUPABASE.MD`](file:///E:/hospital_management_v2/docs/SUPABASE.MD).  
This document serves as the authoritative visual design and frontend implementation manual. All frontend components, layouts, pages, and interactive workflows must adhere strictly to the guidelines, color tokens, typography scales, and component patterns documented here.

---

## 1. Executive Design Philosophy & Context

### 1.1 Enterprise Healthcare Engineering Context
This platform is **not a consumer patient portal, teleconsultation app, or appointment scheduler**.  
It is an **Enterprise Engineering & Documentation Generation Platform** engineered specifically for Southern Philippines Medical Center (SPMC). Its primary functions include:
- Modeling medical-grade software systems and clinical workflows.
- Generating software architectures, database schemas (DDL), and DOH-compliant application code.
- Producing official hospital technical specifications, standard operating procedures (SOPs), and clinical data dictionaries.
- Maintaining rigorous cryptographic requirement traceability and multi-reviewer clinical governance sign-offs.

### 1.2 Core Visual Identity: Green & White
The visual identity of SPMC centers on **SPMC Forest Green and Pure Clinical White**:
- **SPMC Green (`#007A55`)**: Conveys institutional trust, healthcare authority, growth, and clinical safety.
- **Clinical White (`#FFFFFF`) & Crisp Slate Surface (`#F8FAFC`)**: Provides maximum contrast, reduced visual fatigue during long documentation sessions, and high legibility.
- **High-Density Data Presentation**: Built to display large requirement matrices, entity schemas, audit trails, and multi-tier approval workflows cleanly without decorative clutter ("anti-slop" design principles).

---

## 2. Design Tokens & Palette Specifications

All tokens are defined in [`app/globals.css`](file:///E:/hospital_management_v2/app/globals.css) using Tailwind CSS v4 `@theme inline` variables.

### 2.1 Primary Brand Palette (SPMC Green & White)

| Token Name | CSS Variable | Hex / Value | Semantic Role & Usage |
|---|---|---|---|
| `hospital-green` | `--hospital-green` | `#007A55` | Primary action buttons, active navigation markers, brand accents, icon highlights |
| `hospital-green-hover` | `--hospital-green-hover` | `#006345` | Hover state for primary buttons, active link hover |
| `hospital-green-dark` | `--hospital-green-dark` | `#064E3B` | Primary headings, prominent metric values, high-contrast brand text |
| `hospital-green-light` | `--hospital-green-light` | `#F0FDF4` | Subtle card background tints, active sidebar item backgrounds, badge backgrounds |
| `hospital-green-border`| `--hospital-green-border`| `#BBF7D0` | Subtle borders for success panels, active navigation borders |
| `hospital-green-foreground` | `--hospital-green-foreground` | `#FFFFFF` | Text color on primary green buttons and badges |
| `hospital-white` | `--hospital-white` | `#FFFFFF` | Card backgrounds, modal dialogs, data table backgrounds |
| `hospital-surface` | `--hospital-surface` | `#F8FAFC` | Workspace background, table header fills, secondary input backgrounds |
| `hospital-surface-muted` | `--hospital-surface-muted` | `#F1F5F9` | Disabled inputs, scrollbar tracks, subtle divider sections |
| `hospital-border` | `--hospital-border` | `#E2E8F0` | Default card borders, table row dividers, input borders |
| `hospital-border-subtle` | `--hospital-border-subtle` | `#F1F5F9` | Secondary dividers, nested card outlines |

### 2.2 Text & Typography Palette

| Token Name | CSS Variable | Hex / Value | Contrast Ratio (vs White) | Purpose |
|---|---|---|---|---|
| `hospital-text` | `--hospital-text` | `#0F172A` (Slate 900) | **15.8:1** (AAA) | High-contrast body text, table data, form labels |
| `hospital-text-muted` | `--hospital-text-muted` | `#475569` (Slate 600) | **5.9:1** (AA) | Secondary captions, timestamps, placeholder text |
| `hospital-text-inverse` | `--hospital-text-inverse` | `#FFFFFF` | **21:1** (AAA) | Text on dark buttons, dark badges, and solid headers |

### 2.3 Clinical Semantic Status Palette
To comply with medical documentation safety, **never rely on color alone**. Every status badge and alert must pair its semantic color with a visible icon and explicit text label.

| Status Category | Accent Color | Light Tint Bg | Border Color | Icon | Clinical Real-world Meaning |
|---|---|---|---|---|---|
| **Verified / Approved** | `#16A34A` (Emerald 600) | `#ECFDF5` | `#A7F3D0` | `CheckCircle2` | Signed off by clinical authority; requirements 100% verified |
| **Pending / In Review** | `#D97706` (Amber 600) | `#FFFBEB` | `#FDE68A` | `Clock` / `RotateCcw` | Awaiting peer review; drafts undergoing revision |
| **Danger / Gap / Rejected** | `#DC2626` (Red 600) | `#FEF2F2` | `#FECACA` | `AlertTriangle` / `XCircle` | Traceability break, orphaned schema, rejected sign-off |
| **Informational / Telemetry** | `#0284C7` (Sky 600) | `#F0F9FF` | `#BAE6FD` | `Info` / `TestTube2` | System notices, automated test metrics, background jobs |

### 2.4 System Mode Accents ([`PROJECT.MD` §5](file:///E:/hospital_management_v2/docs/PROJECT.MD#L258-L284))
The platform supports two distinct operational modes that dynamically govern review depth and requirement rigor:
- **Standard Mode (`#007A55`)**: Streamlined single-reviewer workflows for departmental tools.
- **Complex Mode (`#B45309`)**: High-rigor amber-ochre accent for enterprise-wide hospital systems requiring multi-stakeholder dual sign-offs and cross-service impact analysis.

---

## 3. Typography & Monospace Standards

### 3.1 Font Family Hierarchy
1. **Primary Interface Sans-Serif**:
   ```css
   font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
   ```
   *Rationale:* Clean native font stacks eliminate font download latency and ensure crisp pixel rendering across clinical workstations running Windows 10/11 or macOS.
2. **Code & Technical Monospace**:
   ```css
   font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
   ```
   *Usage:* Mandatory for requirement identifiers (e.g., `REQ-EHR-001`), database table/column names (`clinical_orders.id`), SQL DDL, cryptographic hashes, and git commit tags.

### 3.2 Type Scale & Hierarchy

| Element | Tailwind Class | Font Size / Line Height | Weight | Tracking | Usage |
|---|---|---|---|---|---|
| **Page Title** | `text-xl sm:text-2xl` | 20px–24px / 28px–32px | `font-bold` | `tracking-tight` | Top-level module titles (e.g., "Engineering Workspace") |
| **Section Header** | `text-base sm:text-lg` | 16px–18px / 24px–28px | `font-bold` | `normal` | Card titles, modal headers, major panel headings |
| **Subsection Header** | `text-sm sm:text-base` | 14px–16px / 20px–24px | `font-semibold`| `normal` | Sub-panels, form groups, matrix section bars |
| **Body Standard** | `text-xs sm:text-sm` | 12px–14px / 16px–20px | `font-normal` | `normal` | General descriptions, table data cells, form input text |
| **Micro / Caption** | `text-[10px] sm:text-xs`| 10px–12px / 14px–16px | `font-medium` | `normal` | Subtitle notes, timestamps, author metadata |
| **Badge / Stat Label**| `text-[9px] sm:text-[10px]`| 9px–10px / 12px–14px | `font-bold` | `uppercase tracking-wider` | Metric card subheaders, status pill text |

---

## 4. UI Component Architecture & Pattern Standards

All components must be constructed using React 19 and Tailwind CSS utility classes, utilizing the design primitives in `@/components/ui`.

### 4.1 Buttons
Buttons must feature standard padding, rounded corners (`rounded-md`), and explicit keyboard focus rings (`focus:ring-2 focus:ring-hospital-green`).

- **Primary Button**:
  ```tsx
  <button className="bg-hospital-green hover:bg-hospital-green-hover text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-xs transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-hospital-green">
    <Check className="w-3.5 h-3.5" /> Save Changes
  </button>
  ```
- **Secondary / Outline Button**:
  ```tsx
  <button className="bg-hospital-white hover:bg-hospital-surface text-hospital-text border border-hospital-border text-xs font-medium px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-hospital-green">
    <Download className="w-3.5 h-3.5 text-hospital-green" /> Export Document
  </button>
  ```
- **Destructive Button**:
  ```tsx
  <button className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5">
    <Trash2 className="w-3.5 h-3.5" /> Archive Project
  </button>
  ```
- **Ghost Button**:
  ```tsx
  <button className="text-hospital-text-muted hover:text-hospital-text hover:bg-hospital-surface text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors">
    Cancel
  </button>
  ```

### 4.2 Form Controls & Inputs
Forms must emphasize clarity, explicit required indicators (`text-red-500 *`), and descriptive microcopy.

- **Standard Text / Number Input**:
  ```tsx
  <div className="space-y-1">
    <label className="text-xs font-semibold text-hospital-text flex items-center gap-1">
      Requirement Code <span className="text-red-500">*</span>
    </label>
    <input
      type="text"
      placeholder="e.g. REQ-EHR-005"
      className="w-full bg-hospital-white border border-hospital-border rounded-md px-3 py-2 text-xs text-hospital-text font-mono placeholder:text-hospital-text-muted focus:outline-none focus:ring-1 focus:ring-hospital-green"
    />
    <p className="text-[10px] text-hospital-text-muted">Must follow SPMC standard naming conventions.</p>
  </div>
  ```
- **Textarea**: Same styling as input with `min-h-[80px]` and resizable vertical handling.
- **Select Dropdowns**: Distinct `bg-hospital-surface`, 1px border, explicit pointer cursor.

### 4.3 Data Tables
High-density data tables represent the workhorse of the SPMC platform.
- **Header**: Background `bg-hospital-surface`, subtle uppercase micro text (`text-[10px] font-bold uppercase tracking-wider text-hospital-text-muted`), 1px bottom border.
- **Row Styling**: Subtle transition hover (`hover:bg-hospital-green-light/40`), padding `py-2.5 px-3`, bottom border `border-b border-hospital-border`.
- **Monospace Alignment**: All identifiers (`REQ-*`, `MOD-*`, `DOC-*`) left-aligned in font-mono with `text-hospital-green-dark`.

### 4.4 Metric Cards (KPI Strips)
Metric cards provide rapid status assessments across projects, models, and compliance baselines.
```tsx
<div className="bg-hospital-white border border-hospital-border rounded-lg p-4 flex items-center justify-between">
  <div className="space-y-1">
    <span className="text-[10px] font-bold text-hospital-text-muted uppercase tracking-wider">
      Requirement Coverage
    </span>
    <p className="text-2xl font-bold text-hospital-green-dark">96.2%</p>
    <p className="text-[11px] text-emerald-700 font-medium">4 of 4 requirements realized</p>
  </div>
  <div className="h-10 w-10 rounded-lg bg-emerald-50 text-hospital-green flex items-center justify-center border border-emerald-200">
    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
  </div>
</div>
```

### 4.5 Modals & Interactive Drawers
- **Backdrop**: Translucent deep overlay (`bg-black/40` or `bg-black/50` with subtle blur `backdrop-blur-xs`).
- **Container**: Elevated card (`bg-hospital-white border border-hospital-border rounded-xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95`).
- **Header**: Elevated bar (`bg-hospital-surface border-b border-hospital-border px-4 py-3 flex items-center justify-between`).
- **Footer Action Bar**: Right-aligned buttons with primary action in SPMC Green.

### 4.6 Alerts & Notifications
Always render alerts with icon, title, and descriptive message:
```tsx
<div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs flex items-center justify-between">
  <div className="flex items-center gap-2">
    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
    <span>Clinical Sign-off Recorded. Verification saved to cryptographic audit ledger.</span>
  </div>
</div>
```

---

## 5. Navigation & Layout Structure

### 5.1 Workspace Layout
The application employs a dual-column layout:
1. **Collapsible Sidebar (256px / `w-64`)**:
   - Institutional Header: SPMC Logo mark + "SPMC Systems".
   - **Active Project Scope Bar**: Quick switcher displaying active project code, title, and "Active" status indicator.
   - Categorized Navigation Sections:
     - **Main**: Dashboard, Projects.
     - **Engineering & Modeling**: System Models, System Generator, Document Generator, Architectural Diagrams, Traceability Engine.
     - **Governance & Approvals**: Reviews & Sign-offs (with dynamic pending counter badge), Documentation Portal.
     - **Administration**: User Management, Settings, Audit Logs.
2. **Main Workspace Container**:
   - Header Bar: Global search, active role switcher (Super Admin, System Analyst, Reviewer, etc.), System Mode toggle (Standard vs. Complex), notifications, and user avatar.
   - Dynamic Breadcrumbs: Dynamic title resolution displaying human-readable project titles and document names instead of raw slugs.
   - Content Viewport: Max-width 7xl container with consistent padding (`p-4 sm:p-6 lg:p-8`).

### 5.2 Project Scope Bar (Engineering Pages)
All engineering sub-pages (`/models`, `/generator`, `/documents`, `/diagrams`, `/traceability`) feature a dedicated top **Project Scope Bar** that binds the active module to the active project context without forcing nested URL slugs.

---

## 6. Accessibility (a11y) & Visual Consistency Standards

1. **Contrast Compliance**:
   - Primary text (`#0F172A`) against surface (`#F8FAFC` and `#FFFFFF`) exceeds **15:1**, far exceeding WCAG AAA standards.
   - Primary Green (`#007A55`) against white text achieves **4.6:1** (WCAG AA Compliant).
2. **Keyboard Navigation**:
   - All interactive controls (buttons, modals, selects, table rows) must support `Tab` navigation and `Enter`/`Space` activation.
   - Clear visual focus outlines via `focus-visible:ring-2 focus-visible:ring-hospital-green`.
3. **Screen Reader Semantic Roles**:
   - Modals use `role="dialog"` with `aria-labelledby`.
   - Tables feature proper `<TableHeader>`, `<TableRow>`, and `<TableHead>`.
4. **Motion Safety**:
   - Transitions are constrained to `150ms`–`200ms` ease-out. No distracting or excessive motion.

---

## 7. Provisional Design Values [PENDING STAKEHOLDER REVIEW]

The following items are designated **provisional** and require final sign-off from SPMC Clinical IT stakeholders:

> [!IMPORTANT]
> **Provisional Item 1: High-Contrast Dark Mode for Night-Shift Clinical Wards**  
> *Current Status:* The platform defaults exclusively to Clinical Light Mode (`#F8FAFC`).  
> *Proposed Review:* Implement an optional night-shift dark theme (`--hospital-surface: #0B1320`, `--hospital-text: #F1F5F9`) for doctors and nurses operating in dimmed inpatient wards.

> [!IMPORTANT]
> **Provisional Item 2: Official SPMC Institutional Seal & Vector Assets**  
> *Current Status:* Standard vector medical badge icon (`Activity` + Shield) used in header.  
> *Proposed Review:* Ingestion of official high-resolution vector emblem approved by the Southern Philippines Medical Center Office of the Medical Center Chief.

> [!IMPORTANT]
> **Provisional Item 3: Print / PDF Export Typography Standardization**  
> *Current Status:* Generated Markdown and HTML documents utilize standard system serif/sans-serif.  
> *Proposed Review:* Formally specify whether official DOH PDF generation requires licensed Arial / Book Antiqua font packaging in Supabase Edge Functions.
