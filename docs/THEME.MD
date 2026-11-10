# THEME.md — Design System & UI/UX Specification

# SPMC Integrated System & Documentation Generation Platform
*Southern Philippines Medical Center (SPMC)*  
Department of Health (DOH) • Republic of the Philippines

---

## 1. Platform Purpose, Workflows & User Personas

### 1.1 True System Purpose
This application is *not* a bedside clinical charting app, an EHR for patient diagnosis, or a public hospital portal.

Per PROJECT.MD §1, it is a web-based *Integrated System & Documentation Generation Platform* for Southern Philippines Medical Center. Its concrete job is to serve as the centralized engineering workspace for:
1. *System Modeling*: Formally defining software requirements, hierarchical components, interface contracts (HL7, DICOM, REST), and relational data schemas.
2. *Software Artifact Generation*: Generating directory structures, service skeletons, PostgreSQL DDL schemas with RLS policies, and infrastructure-as-code (IaC) templates from approved models.
3. *Documentation Generation*: Compiling System Architecture Documents (SAD), Software Requirements Specifications (SRS), Data Dictionaries, and DOH hospital forms into DOCX, PDF, HTML, and Markdown.
4. *Diagram Generation*: Rendering traceable context, component, sequence, and data-flow diagrams.
5. *Traceability Engine*: Linking requirements to components, test cases, generated artifacts, and documents with coverage and gap detection.
6. *Governance & Approval Workflows*: Enforcing single-reviewer (Standard Mode) and multi-reviewer (Complex Mode) sign-offs before generated outputs are accepted.
7. *Compliance & Audit*: Maintaining immutable records of model revisions, generation jobs, and access events.

### 1.2 User Personas & Interface Requirements
The UI must cater to five technical and administrative user classes:

| Persona (PROJECT.MD §4.1) | Primary Tasks | UI & Density Needs |
|---|---|---|
| *System Analysts / Architects* | Drafting requirements, defining interfaces, mapping entities | High-density tables, tree structures, relational schema builders |
| *Software Developers* | Reviewing generated code, copying skeletons, exporting DDL | Monospace syntax viewers, copy-to-clipboard, zip export triggers |
| *Clinical Reviewers & PMs* | Inspecting version diffs, adding review notes, signing off | Side-by-side diff viewers, threaded comment cards, approval action bars |
| *Documentation Managers* | Selecting templates, revising markdown, compiling exports | Split-pane markdown editors, live document previews, format selectors |
| *Administrators & Auditors* | Assigning project roles, configuring modes, reviewing logs | Scannable audit tables, before/after JSON diffs, status filter pills |

---

## 2. Core Visual Identity: Green & White Healthcare Information System

The visual identity reflects a serious, high-trust, mission-critical healthcare information platform:

- *Primary Identity*: *SPMC Clinical Green* (#007A55 / #064E3B) and *Pure Hospital White* (#FFFFFF) with cool slate architectural neutrals (#F8FAFC, #E2E8F0).
- *Clinical Daylighting*: Workstation monitors in hospital administrative and IT offices operate in brightly lit environments. The primary interface is high-contrast daylight-bright, maximizing legibility and reducing fatigue.
- *Precision over Decoration*: The interface feels like an enterprise IDE and governance system. There are no decorative illustrations, floating cartoon elements, or marketing fluff.

### 2.1 Anti-AI-Slop Clinical Standards
- *No Decorative Gradients or Glows*: Zero CSS gradients, glowing background blobs, or glassmorphic blur effects. Surfaces are flat, opaque, and delimited by crisp 1px borders.
- *Intentional Rectangular Geometry*: Corners use modest, functional radii (rounded-md 6px for cards, inputs, and buttons; rounded 4px for inner badges). Oversized pill buttons and large rounded containers are banned.
- *Pills Restricted to Status*: Pill geometry (rounded-full) is strictly reserved for compact status tags (Active, Draft, Approved, Standard Mode, Complex Mode).
- *Zero Blanket Positive Tracking*: Headings and body text use natural tracking (tracking-normal). Positive tracking is reserved solely for small uppercase metadata tags (text-[10px] tracking-wider uppercase).
- *Restricted Monospace*: Monospace is reserved strictly for requirement codes (REQ-EHR-001), PostgreSQL table names, SQL DDL, JSON payload schemas, and generated code skeletons.
- *Banned Fonts Prohibited*: Do not use Geist, Inter, Space Grotesk, or Poppins. Use high-legibility enterprise grotesque sans (Plus Jakarta Sans or clean system grotesque).
- *Multi-Cue Accessibility*: Color is never the sole communicator of status. Every badge, alert, and table cell couples color with explicit text labels and distinct icons.

---

## 3. Color Palette & Semantic Token Architecture

All styling in Next.js 16 + Tailwind CSS 4 is bound to semantic CSS variables in app/globals.css.

### 3.1 Primary Green Tokens (SPMC Clinical Identity)
| Token | Hex Value | Status | Semantic Usage |
|---|---|---|---|
| --hospital-green | #007A55 | Approved | Primary action button, active tab indicator, verified checkmarks, brand accent |
| --hospital-green-hover | #006345 | Approved | Hover state for primary buttons and interactive green surfaces |
| --hospital-green-dark | #064E3B | Approved | High-contrast page titles, active navigation text, emphasized headers |
| --hospital-green-light | #F0FDF4 | Approved | Mint tint for active sidebar items, callout banners, and selected rows |
| --hospital-green-border | #BBF7D0 | Approved | Subtle green boundary for badges, callouts, and active tab highlights |
| --hospital-green-foreground | #FFFFFF | Approved | White text on primary green buttons and badges |

### 3.2 Neutral Surfaces & Architectural Borders
| Token | Hex Value | Status | Semantic Usage |
|---|---|---|---|
| --hospital-white | #FFFFFF | Approved | Primary canvas for cards, modal dialogs, data tables, and input fields |
| --hospital-surface | #F8FAFC | Approved | Cool slate page canvas beneath cards and main content |
| --hospital-surface-muted | #F1F5F9 | Approved | Table header rows, tab bars, disabled backgrounds, and code preview containers |
| --hospital-border | #E2E8F0 | Approved | Clean 1px architectural borders on cards, headers, and grid containers |
| --hospital-border-subtle | #F1F5F9 | Approved | Inner dividers between card headers and content bodies |

### 3.3 High-Contrast Clinical Typography
| Token | Hex Value | Contrast Ratio | Semantic Usage |
|---|---|---|---|
| --hospital-text | #0F172A (Slate 900) | *14.2:1 (AAA)* | Primary headings, table text, form labels, and body copy |
| --hospital-text-muted | #475569 (Slate 600) | *7.1:1 (AAA)* | Timestamps, metadata subtitles, table captions, and helper notes |
| --hospital-text-inverse | #FFFFFF | *12.5:1 (AAA)* | Text on primary green and status buttons |

### 3.4 Multi-Cue Status System (PROJECT.MD §4.7, §4.9)
| Status State | Background | Border | Text | Icon | Semantic Meaning |
|---|---|---|---|---|---|
| *Success / Approved* | #ECFDF5 | #A7F3D0 | #065F46 | CheckCircle2 | Approved model versions, verified requirements, passing tests |
| *Warning / In Review* | #FFFBEB | #FDE68A | #92400E | Clock / AlertTriangle | Items in review, revision requested, pending clinical sign-off |
| *Danger / Rejected* | #FEF2F2 | #FECACA | #991B1B | XCircle / AlertCircle | Rejected submissions, critical priority bugs, test failures |
| *Info / Draft* | #F0F9FF | #BAE6FD | #075985 | Info | Draft artifacts, unsubmitted revisions, system notices |

### 3.5 System Modes (PROJECT.MD §5)
- *Standard System Mode* (--mode-standard: #007A55): Displays a clean clinical green badge (bg-emerald-50 text-emerald-800 border-emerald-200). Signals basic modeling and single-reviewer approval.
- *Complex System Mode* (--mode-complex: #B45309): Displays a prominent amber badge (bg-amber-50 text-amber-800 border-amber-200). Signals cross-departmental impact, multi-reviewer approval requirements, and strict traceability checks.

---

## 4. Typography & Readability Standards

### 4.1 Typeface Families
1. *Primary Interface Font*: Enterprise grotesque sans (Plus Jakarta Sans or high-quality system sans stack -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif).
   - Clean, open apertures for high legibility on 1080p and 1440p clinical monitors.
   - Distinct digit forms and high x-height for scannable data grids.
2. *Monospace Code Font*: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace.
   - Used strictly for requirement identifiers (REQ-EHR-001), PostgreSQL table names, SQL DDL, JSON payload schemas, and generated code skeletons.

### 4.2 Type Scale & Hierarchy
| Level | Font Size | Line Height | Weight | Color Token | Usage |
|---|---|---|---|---|---|
| *Display / H1* | 20px (1.25rem) | 1.25 | Bold (700) | --hospital-green-dark | Page titles (Dashboard, Models Workspace) |
| *Section / H2* | 16px (1.00rem) | 1.35 | Semibold (600) | --hospital-text | Card group titles, modal headers |
| *Card Title / H3* | 14px (0.875rem) | 1.40 | Semibold (600) | --hospital-text | Section headers within cards, table titles |
| *Body / Standard* | 13px (0.8125rem) | 1.50 | Regular (400) | --hospital-text | Table cell data, descriptions, form inputs |
| **Metadata / Caption**| 11px (0.6875rem) | 1.40 | Medium (500) | --hospital-text-muted | Timestamps, subtitles, helper notes |
| *Code / Schema* | 11px (0.6875rem) | 1.60 | Regular (400) | Monospace | SQL DDL, JSON schemas, code previews |

---

## 5. Spacing, Sizing, Layout, and Responsive Behavior

### 5.1 Base 4px Spatial Grid
All margins, paddings, heights, and gaps follow a 4px scale:
- 4px (p-1): Inner icon gaps, compact badge padding.
- 8px (p-2, gap-2): Button internal padding, table cell vertical spacing.
- 12px (p-3, gap-3): Compact card grids, search filter bars.
- 16px (p-4, gap-4): Card body padding, standard column spacing.
- 20px (p-5): Card header padding, dialog padding.
- 24px (p-6): Main content view padding.

### 5.2 Responsive Breakpoints & Viewport Behavior
- *Mobile (< 640px)*:
  - Sidebar collapses into an off-canvas drawer.
  - Header displays condensed logo mark and mobile navigation trigger.
  - Multi-column metric cards stack into single columns.
- *Tablet (640px – 1023px)*:
  - Header displays active project picker and system mode badge.
  - Metric cards display in 2-column grids.
  - Data tables support horizontal scroll with fixed headers.
- *Desktop (1024px – 1439px)*:
  - Full persistent 256px sidebar.
  - Split-pane markdown editor and diagram views display side-by-side.
  - 4-column metric grid on Dashboard.
- *Wide Workstation (>= 1440px)*:
  - Maximum content width container (e.g. max-w-7xl or full-width table view).
  - Traceability matrix displays all realization columns without horizontal truncation.

---

## 6. Component Style Specifications

Every component is defined with exact styling classes and state behavior for immediate frontend replication:

### 6.1 Buttons (components/ui/button.tsx)
- *Primary*: bg-hospital-green hover:bg-hospital-green-hover text-white rounded-md shadow-xs h-9 px-3.5 text-sm font-medium transition-colors cursor-pointer.
- *Secondary*: bg-hospital-surface-muted hover:bg-slate-200 text-hospital-text border border-hospital-border rounded-md h-9 px-3.5 text-sm.
- *Outline*: bg-hospital-white hover:bg-hospital-green-light text-hospital-green border border-hospital-green-border rounded-md h-9 px-3.5 text-sm.
- *Destructive*: bg-status-danger hover:bg-red-700 text-white rounded-md h-9 px-3.5 text-sm font-medium.
- *Focus Ring*: focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hospital-green focus-visible:ring-offset-1.
- *Disabled State*: disabled:opacity-50 disabled:pointer-events-none cursor-not-allowed.

### 6.2 Form Inputs, Selects & Textareas (components/ui/input.tsx)
- *Field*: h-9 w-full rounded-md border border-hospital-border bg-hospital-white px-3 py-1 text-sm text-hospital-text placeholder:text-slate-400 transition-colors.
- *Focus*: focus:outline-none focus:border-hospital-green focus:ring-1 focus:ring-hospital-green.
- *Label*: text-xs font-medium text-hospital-text mb-1 block.
- *Error*: border-status-danger text-status-danger text-xs mt-1.

### 6.3 Data Tables (components/ui/table.tsx)
- *Container*: rounded-md border border-hospital-border bg-hospital-white overflow-hidden.
- *Header*: bg-hospital-surface-muted border-b border-hospital-border h-10 px-4 text-left text-xs font-semibold text-hospital-text-muted uppercase tracking-wider.
- *Row*: border-b border-hospital-border hover:bg-hospital-surface/80 transition-colors.
- *Cell*: p-4 align-middle text-sm text-hospital-text.

### 6.4 Cards (components/ui/card.tsx)
- *Container*: bg-hospital-white border border-hospital-border rounded-md shadow-xs.
- *Header*: p-5 border-b border-hospital-border-subtle flex flex-col space-y-1.
- *Title*: text-base font-semibold leading-none tracking-tight text-hospital-text.
- *Description*: text-xs text-hospital-text-muted mt-1.
- *Content*: p-5.

### 6.5 Badges (components/ui/badge.tsx)
- *Base*: inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border select-none.
- *Standard Mode*: bg-emerald-50 text-emerald-800 border-emerald-200.
- *Complex Mode*: bg-amber-50 text-amber-800 border-amber-200.
- *Success / Approved*: bg-emerald-50 text-emerald-700 border-emerald-200.
- *Warning / Review*: bg-amber-50 text-amber-800 border-amber-200.
- *Danger / Rejected*: bg-red-50 text-red-700 border-red-200.

### 6.6 Modal Dialogs (components/ui/modal.tsx)
- *Backdrop*: fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50.
- *Box*: relative w-full rounded-md bg-hospital-white border border-hospital-border shadow-lg z-10 overflow-hidden max-h-[90vh].
- *Header*: p-5 border-b border-hospital-border flex items-center justify-between.

### 6.7 Alerts (components/ui/alert.tsx)
- *Container*: flex items-start gap-3 p-3.5 rounded-md border text-xs leading-relaxed.
- *Info*: bg-sky-50/70 border-sky-200 text-sky-900.
- *Success*: bg-emerald-50/70 border-emerald-200 text-emerald-900.
- *Warning*: bg-amber-50/70 border-amber-200 text-amber-900.
- *Danger*: bg-red-50/70 border-red-200 text-red-900.

---

## 7. Layout & Navigation Styles

### 7.1 Header (components/layout/hospital-header.tsx)
- *Height & Sticky*: sticky top-0 z-40 h-16 w-full border-b border-hospital-border bg-hospital-white px-6.
- *SPMC Brand Crest*:
  - Green mark: h-10 w-10 rounded-md bg-hospital-green text-white shadow-xs.
  - Brand titles: SPMC (text-sm font-bold text-hospital-green-dark) • Southern Philippines Medical Center.
- *Project Selector*:
  - Pill container: flex items-center gap-2 bg-hospital-surface px-3 py-1.5 rounded-md border border-hospital-border.
  - Native select: appearance-none bg-transparent pr-6 text-xs font-semibold text-hospital-text cursor-pointer.
- *System Mode Tag*:
  - Standard Mode or Complex System Mode badge.
- *Role Preview Switcher*:
  - Allows staff to simulate permissions across 8 SPMC roles in real time.
- *User Profile & Session Control*:
  - Avatar, staff name (Dr. Maria Santos), and hospital email.
  - Dedicated *Sign Out* button: px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md.

### 7.2 Sidebar (components/layout/hospital-sidebar.tsx)
- *Width*: w-64 shrink-0 border-r border-hospital-border bg-hospital-white flex flex-col h-[calc(100vh-4rem)].
- *Section Headers*: px-3 text-[11px] font-bold uppercase tracking-wider text-hospital-text-muted/80.
- *Navigation Item*:
  - Default: px-3 py-2 text-xs font-medium text-hospital-text hover:bg-hospital-surface-muted rounded-md transition-colors.
  - Active: bg-hospital-green-light text-hospital-green-dark font-semibold border-l-2 border-hospital-green.
  - Module Badge: Amber pill for pending approvals count.
- *Footer*: SPMC platform release metadata.

---

## 8. Specific Workbench UI Patterns

### 8.1 System Modeling Workspace (/projects/[id]/models/[modelId])
- *Multi-Tab Nav*: Segmented tab control (Requirements, System Components, Interfaces, Data Entities, Version Diff).
- *Approval Dispatch*: Prominent green "Submit Model for Approval" button that triggers the multi-reviewer sign-off workflow.
- *Diff Viewer*: Side-by-side or stacked diffs showing changed requirements with green + and red - highlighted inline spans.

### 8.2 Software System Generator (/projects/[id]/generator)
- *Artifact Category Cards*: 4 selector cards (DDL Schemas, Skeletons, Directory Trees, IaC) with active green border.
- *Syntax Previewer*: Monospace terminal container (bg-slate-900 text-slate-100 rounded-b-md p-4 font-mono text-xs overflow-x-auto).
- *Actions*: Copy Code and Download ZIP package triggers.

### 8.3 Documentation Generator & Editor (/projects/[id]/documents/[docId])
- *Split-Pane Layout*:
  - Left Pane: Markdown source editor with character count.
  - Right Pane: Real-time formatted document preview conforming to DOH hospital document layout standards.
- *Actions*: Save Draft and Export (DOCX, PDF, HTML, Markdown).

### 8.4 Traceability Matrix (/projects/[id]/traceability)
- *Realization Grid*: Full tabular alignment mapping Req Code &rarr; Component &rarr; Generated Artifact &rarr; Test Case &rarr; Documentation.
- *Coverage Indicators*: Percentage bars showing requirement verification coverage.

### 8.5 Reviews and Approvals (/reviews/[reviewId])
- *Approval Count*: Shows current / required sign-offs (1 for Standard Mode, 2+ for Complex Mode).
- *Reviewer Action Bar*: Three explicit buttons:
  - Approve & Sign Off (bg-emerald-600 text-white)
  - Request Revisions (border-amber-300 text-amber-800 bg-amber-50)
  - Reject Submission (bg-status-danger text-white)
- *Threaded Discussion*: Chronological comment cards showing reviewer identity, clinical role, timestamp, and review guidance.

---

## 9. Component State Catalog & Supabase Error Contract

Per SUPABASE.MD §11, every data component handles four explicit UI states:

1. *Loading State*:
   - Uses components/ui/skeleton.tsx matching the target layout (MetricCardSkeleton, TableRowSkeleton).
   - Non-distracting subtle pulse (bg-hospital-surface-muted animate-pulse).
2. *Empty State*:
   - Uses components/ui/empty-state.tsx.
   - Displays a clean hospital icon, title, description, and primary green action button.
3. *Success State*:
   - Optimistic UI update with toast notice or green badge indicator (Alert variant="success").
4. *Error State*:
   - Uses components/ui/alert.tsx variant="danger".
   - Maps PostgreSQL error codes to friendly clinical messages:
     - 23505: Unique violation &rarr; "A record or requirement code with this identifier already exists in this project."
     - 23503: Foreign key violation &rarr; "Cannot remove this entity because active traceability links or generated artifacts depend on it."
     - 42501: RLS denial &rarr; "You do not have the required SPMC project role to modify this resource."

---

## 10. Provisional Design Decisions Awaiting Stakeholder Review

The following design decisions are currently *provisional* and documented here for team and stakeholder approval:

| Item | Current Provisional Value | Alternative Options for Review | Notes / Reason |
|---|---|---|---|
| *Primary Green Shade* | #007A55 (SPMC Medical Emerald) | #0F766E (Deep Teal), #059669 (Vibrant Emerald) | High daylight contrast; can be adjusted in --hospital-green variable |
| *Header Identity Mark* | SVG Activity Cross + SPMC text | Official DOH / SPMC Vector Seal | Vector seal asset file is currently not checked into the repository |
| *Interface Font Source* | System Grotesque Stack | Self-hosted Plus Jakarta Sans via Fontsource | Prevents external CDN font requests per hospital intranet security rules |
| *Dark Mode Policy* | Daylight-Bright only by default | Opt-in Dark Mode for radiology darkrooms | Hospital IT offices require high contrast; radiology reading rooms may request dark mode in Phase 3 |
| *Matrix Dense Mode* | Standard padding (p-4) | Compact density toggle (p-2) | May be useful when traceability matrices exceed 50 requirements |

---

## 11. Technical Implementation Mapping (Tailwind CSS 4)

Declared in app/globals.css:

```css
@import "tailwindcss";

:root {
  /* Primary Green Tokens */
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

  /* High-Contrast Typography */
  --hospital-text: #0F172A;
  --hospital-text-muted: #475569;
  --hospital-text-inverse: #FFFFFF;

  /* Clinical Multi-Cue Status */
  --status-success: #16A34A;
  --status-warning: #D97706;
  --status-danger: #DC2626;
  --status-info: #0284C7;

  /* System Modes */
  --mode-standard: #007A55;
  --mode-complex: #B45309;
}

@theme inline {
  --color-hospital-green: var(--hospital-green);
  --color-hospital-green-hover: var(--hospital-green-hover);
  --color-hospital-green-dark: var(--hospital-green-dark);
  --color-hospital-green-light: var(--hospital-green-light);
  --color-hospital-green-border: var(--hospital-green-border);
  --color-hospital-green-foreground: var(--hospital-green-foreground);

  --color-hospital-white: var(--hospital-white);
  --color-hospital-surface: var(--hospital-surface);
  --color-hospital-surface-muted: var(--hospital-surface-muted);
  --color-hospital-border: var(--hospital-border);
  --color-hospital-border-subtle: var(--hospital-border-subtle);

  --color-hospital-text: var(--hospital-text);
  --color-hospital-text-muted: var(--hospital-text-muted);
  --color-hospital-text-inverse: var(--hospital-text-inverse);

  --color-status-success: var(--status-success);
  --color-status-warning: var(--status-warning);
  --color-status-danger: var(--status-danger);
  --color-status-info: var(--status-info);

  --color-mode-standard: var(--mode-standard);
  --color-mode-complex: var(--mode-complex);
}
```

Updating any CSS variable in :root immediately recolors the entire hospital interface while preserving component architecture, accessibility contrast, and responsive layout behavior.
