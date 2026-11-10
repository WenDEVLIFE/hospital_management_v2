# PROJECT.md — Integrated Hospital Management System (HMS)

## 1. Project Overview

Develop a comprehensive, web-based **Hospital Management System (HMS)** for a full-service hospital.

The system will provide a centralized platform for managing hospital operations, patient records, clinical workflows, appointments, admissions, diagnostics, pharmacy, billing, inventory, human resources, and administrative services.

The application must support all hospital departments through role-based access control, centralized patient information, interconnected workflows, and real-time operational monitoring.

**Supabase is the application's backend platform and communication layer.** The React frontend communicates directly with Supabase through the official Supabase JavaScript client and Supabase services.

Do not create a separate Node.js, Python, Express, FastAPI, or custom REST API backend.

The system must maintain a centralized and traceable patient record throughout the patient's hospital journey, from registration and consultation to admission, treatment, billing, and discharge.

### Primary Objectives

- Centralize hospital operations into one integrated platform.
- Digitize patient registration and medical records.
- Automate outpatient and inpatient workflows.
- Manage doctors, nurses, employees, and hospital departments.
- Integrate laboratory, radiology, pharmacy, and clinical services.
- Manage hospital rooms, wards, and bed availability.
- Automate billing, payments, and financial transactions.
- Manage medicine, medical supplies, and inventory.
- Generate hospital reports and operational analytics.
- Maintain secure and auditable medical records.
- Improve coordination between hospital departments.
- Support patient-facing services and online appointments.

## 2. Technology Stack

### Frontend

- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Reusable component architecture
- Responsive web application
- React Router
- TanStack Query where appropriate
- React Hook Form
- Zod validation
- Recharts for analytics and dashboards

### Backend Platform — Supabase Only

Use Supabase as the only backend platform.

- **Supabase Auth:** User authentication and session management.
- **Supabase PostgreSQL Database:** Persistent application data.
- **Supabase Row Level Security (RLS):** Authorization and data access control.
- **Supabase Storage:** Medical documents, patient attachments, reports, and uploaded files.
- **Supabase Realtime:** Live queue updates, notifications, and operational status changes.
- **Supabase Edge Functions:** Only for trusted server-side operations requiring protected secrets or privileged execution.
- **Supabase Database Functions:** Transactional database operations that require atomic execution, such as inventory movements, payment posting, and bed assignment.

Do not build a separate application server or custom REST API layer.

Use the official Supabase JavaScript SDK for database, authentication, storage, and realtime communication.

Do not expose the Supabase service-role key or privileged secrets in frontend code.

### File Generation and Document Processing

- Browser-compatible PDF generation.
- DOCX generation.
- Excel report generation.
- CSV export.
- Printable patient documents.
- Printable billing statements.
- Medical certificate generation.
- Discharge summary generation.
- Laboratory report generation.

Prefer browser-side processing when practical.

Use Supabase Edge Functions only when processing requires protected server-side execution.

Store generated files in Supabase Storage and metadata in PostgreSQL.

## 3. Core Architecture Rules

1. The React application communicates directly with Supabase through the official Supabase client.
2. Supabase Auth manages authentication and sessions.
3. PostgreSQL stores structured hospital information.
4. RLS policies enforce data access and permissions.
5. Supabase Storage stores medical documents and generated files.
6. Supabase Realtime provides live operational updates where necessary.
7. Database Functions may handle transactional operations that must be atomic.
8. Edge Functions are optional and reserved for trusted server-side operations.
9. Do not create a separate REST API, Express server, FastAPI server, Node.js backend, or Python backend.
10. Do not duplicate functionality already provided by Supabase.
11. Never expose privileged keys or database credentials in frontend code.
12. All medical and financial operations must be traceable.
13. Clinical and financial records must not be silently overwritten or permanently deleted after finalization.
14. All critical database operations must enforce referential integrity and transactional consistency.

## 4. Authentication and User Management

Use Supabase Auth for identity and authentication.

### Features

- User login and logout.
- Email and password authentication.
- Password reset.
- Session persistence.
- Secure session management.
- User profile management.
- User activation and deactivation.
- Role assignment.
- Department assignment.
- Permission management.
- User activity monitoring.
- Login history.
- Account status management.
- Multi-factor authentication support.
- Session expiration.
- Password change.

### Proposed User Roles

1. Super Administrator
2. Hospital Administrator
3. Department Head
4. Medical Director
5. Doctor
6. Nurse
7. Receptionist
8. Medical Records Officer
9. Pharmacist
10. Laboratory Technician
11. Pathologist
12. Radiologist
13. Radiology Technician
14. Cashier
15. Accountant
16. Inventory Officer
17. Procurement Officer
18. HR Officer
19. Payroll Officer
20. Blood Bank Officer
21. Ambulance Dispatcher
22. Housekeeping Staff
23. Maintenance Staff
24. Dietary Staff
25. Mortuary Staff
26. Patient

Store application profiles, roles, and permissions in PostgreSQL.

Enforce all access permissions using RLS.

Frontend route guards are for user experience only and must never be treated as the authoritative security mechanism.

## 5. Dashboard and Analytics

Provide role-specific dashboards based on the user's permissions and department.

### Hospital Administrator Dashboard

- Total registered patients.
- Total active employees.
- Total doctors and nurses.
- Today's appointments.
- Daily patient consultations.
- Current inpatient census.
- Available beds.
- Occupied beds.
- Emergency department cases.
- Pending laboratory requests.
- Pending radiology requests.
- Pharmacy stock alerts.
- Daily collections.
- Monthly revenue.
- Outstanding balances.
- Hospital operational statistics.
- Recent activities.

### Department Dashboard

Display information relevant to the user's assigned department.

Examples:

**OPD Dashboard**
- Today's appointments.
- Waiting patients.
- Patients currently in consultation.
- Completed consultations.
- Available doctors.

**Nursing Dashboard**
- Assigned patients.
- Current ward census.
- Pending nursing tasks.
- Medication administration schedules.
- Vital signs monitoring.

**Pharmacy Dashboard**
- Pending prescriptions.
- Dispensing queue.
- Available medicine stock.
- Low-stock medicines.
- Expiring medicine batches.

**Laboratory Dashboard**
- Pending laboratory orders.
- Specimens awaiting collection.
- Samples being processed.
- Results awaiting verification.
- Approved results.

**Billing Dashboard**
- Pending invoices.
- Unpaid accounts.
- Daily collections.
- Outstanding balances.
- Refund requests.

### Analytics

- Patient admission trends.
- Outpatient consultation trends.
- Department performance.
- Bed occupancy rates.
- Average length of stay.
- Pharmacy utilization.
- Laboratory utilization.
- Radiology utilization.
- Revenue trends.
- Collection summaries.
- Inventory movement.

## 6. Patient Management

Provide a centralized patient registration and information management module.

### Features

- New patient registration.
- Unique patient number generation.
- Duplicate patient detection.
- Patient demographic information.
- Patient contact information.
- Emergency contact management.
- Patient address management.
- Patient identification documents.
- PhilHealth information.
- HMO and insurance information.
- Patient profile management.
- Patient medical history.
- Family medical history.
- Previous illnesses and surgeries.
- Allergy records.
- Medication history.
- Patient documents and attachments.
- Patient visit history.
- Admission history.
- Discharge history.
- Consultation history.
- Patient search and filtering.
- Patient record archiving.
- Authorized patient record merging.

### Patient Profile Sections

1. Overview
2. Personal Information
3. Medical History
4. Allergies
5. Medications
6. Appointments
7. Consultations
8. Admissions
9. Laboratory Results
10. Radiology Results
11. Prescriptions
12. Billing and Payments
13. Insurance
14. Documents
15. Audit History

Patient demographic records must be separate from encounter-specific medical records.

## 7. Appointment and Queue Management

### Features

- Online appointment booking.
- Walk-in registration.
- Doctor scheduling.
- Department-based appointments.
- Doctor availability management.
- Appointment calendar.
- Appointment confirmation.
- Appointment rescheduling.
- Appointment cancellation.
- Appointment history.
- Queue number generation.
- Patient check-in.
- Queue management.
- Waiting list.
- No-show tracking.
- Appointment reminders.
- Doctor-specific schedules.
- Department queue monitoring.
- Real-time queue display.

### Appointment Statuses

- Pending
- Confirmed
- Checked In
- Waiting
- In Consultation
- Completed
- Cancelled
- Rescheduled
- No Show

Use Supabase Realtime for live queue updates where appropriate.

Prevent conflicting appointments using database constraints or transactional validation.

## 8. Doctor and Medical Staff Management

### Features

- Doctor registration.
- Doctor profile management.
- Medical specialization management.
- Professional license information.
- License expiration tracking.
- Department assignment.
- Consultation fee configuration.
- Doctor availability.
- Doctor schedules.
- Duty scheduling.
- Leave management.
- Patient assignment.
- Consultation history.
- Diagnosis records.
- Treatment plans.
- Prescription creation.
- Medical certificate generation.
- Referral management.
- Doctor performance reports.

## 9. Electronic Medical Records (EMR)

Provide a centralized digital medical record system.

### Features

- Electronic patient charts.
- Medical history.
- Chief complaints.
- History of present illness.
- Review of systems.
- Physical examination.
- Clinical assessments.
- Diagnosis records.
- Treatment plans.
- Progress notes.
- SOAP notes.
- Physician notes.
- Nursing notes.
- Vital signs history.
- Allergy records.
- Medication history.
- Laboratory results.
- Radiology reports.
- Clinical procedures.
- Discharge summaries.
- Medical certificates.
- Document attachments.
- Medical record audit history.
- Clinical record version history.

### Clinical Note Management

Support the following statuses:

- Draft
- Pending Signature
- Signed
- Amended
- Voided with documented reason

Signed clinical notes must not be silently edited. Amendments must retain the original record, author, reason, and timestamp.

## 10. Consultation and Clinical Management

### Features

- Consultation queue.
- Patient medical chart access.
- Chief complaint recording.
- Clinical history recording.
- Patient examination.
- Vital signs review.
- Primary diagnosis.
- Secondary diagnosis.
- ICD-10 coding support.
- Clinical assessment.
- Treatment recommendations.
- Prescription creation.
- Laboratory requests.
- Radiology requests.
- Procedure orders.
- Specialist referrals.
- Follow-up scheduling.
- Consultation notes.
- Consultation completion.

### Clinical Order Management

Support:

- Laboratory orders.
- Radiology orders.
- Medication orders.
- Medical procedure orders.
- Referral orders.

Order statuses:

- Draft
- Submitted
- Accepted
- In Progress
- Completed
- Rejected
- Cancelled
- On Hold

Each order must retain its originating encounter, ordering clinician, patient, department, and status history.

## 11. Admission, Discharge and Transfer (ADT)

### Features

- Inpatient admission.
- Admission requests.
- Admission diagnosis.
- Admission date and time.
- Attending physician assignment.
- Ward assignment.
- Room assignment.
- Bed assignment.
- Patient transfer.
- Transfer history.
- Discharge processing.
- Discharge diagnosis.
- Discharge instructions.
- Discharge summary.
- Length-of-stay calculation.
- Discharge disposition.
- Admission reports.
- Discharge reports.

### Admission Workflow

Admission Request → Bed Availability Check → Admission Confirmation → Bed Assignment → Inpatient Care → Discharge Approval → Billing Clearance → Discharge.

Maintain the clinical discharge decision separately from financial clearance. Hospital policies must determine the permitted discharge process.

## 12. Bed and Room Management

### Features

- Building management.
- Floor management.
- Ward management.
- Room registration.
- Bed registration.
- Room category management.
- Room pricing.
- Bed availability monitoring.
- Bed reservation.
- Patient bed assignment.
- Bed transfer.
- Bed cleaning status.
- Maintenance status.
- Occupancy monitoring.
- Bed utilization reports.

### Bed Statuses

- Available
- Reserved
- Occupied
- Cleaning
- Maintenance
- Out of Service

Prevent concurrent active assignments of the same bed.

A discharged patient must not automatically make a bed available until housekeeping and inspection procedures are completed.

## 13. Nursing Management

### Features

- Patient assignment.
- Nursing assessment.
- Vital signs recording.
- Nursing notes.
- Nursing care plans.
- Nursing interventions.
- Medication Administration Records (MAR).
- Medication schedule monitoring.
- Intake and output monitoring.
- Patient condition monitoring.
- Fall-risk assessment.
- Patient handover.
- Nursing procedures.
- Patient safety documentation.
- Nursing activity reports.

### Vital Signs

Support:

- Blood pressure.
- Heart rate.
- Respiratory rate.
- Body temperature.
- Oxygen saturation.
- Height.
- Weight.
- BMI calculation.

### Medication Administration Records

Record:

- Patient.
- Medication.
- Dose.
- Route.
- Scheduled administration time.
- Actual administration time.
- Administering nurse.
- Administration status.
- Omission or refusal reason.
- Additional notes.

Medication administration must be validated against the authorized prescription and applicable clinical safety procedures.

## 14. Emergency Room Management

### Features

- Emergency patient registration.
- Emergency encounter creation.
- Triage assessment.
- Emergency severity classification.
- Arrival time recording.
- Presenting complaint.
- Initial vital signs.
- Emergency queue.
- Attending physician assignment.
- Nurse assignment.
- Emergency treatment records.
- Medication administration.
- Laboratory orders.
- Imaging orders.
- Emergency procedures.
- Patient monitoring.
- Inpatient admission.
- Transfer to another facility.
- Emergency discharge.
- Emergency case reports.

Use a hospital-approved triage protocol. Do not automatically determine clinical priority using unvalidated algorithms.

## 15. Pharmacy Management

### Features

- Medicine catalog.
- Generic and brand names.
- Medicine categories.
- Dosage forms.
- Medicine strengths.
- Unit management.
- Prescription management.
- Prescription verification.
- Medicine dispensing.
- Batch tracking.
- Expiration date tracking.
- Stock-in.
- Stock-out.
- Medicine returns.
- Supplier management.
- Purchase orders.
- Low-stock alerts.
- Near-expiry alerts.
- Expired medicine monitoring.
- Pharmacy sales.
- Dispensing history.
- Pharmacy reports.

### Pharmacy Workflow

Prescription → Pharmacist Verification → Stock Availability Check → Batch Selection → Dispensing → Billing Integration → Completion.

Use FEFO (First Expiry, First Out) for batch selection where applicable.

Maintain a complete history of dispensing and stock movements.

## 16. Laboratory Management

### Features

- Laboratory test catalog.
- Laboratory test categories.
- Test pricing.
- Laboratory order management.
- Accession number generation.
- Specimen collection.
- Specimen labeling.
- Specimen reception.
- Specimen rejection.
- Specimen tracking.
- Technician assignment.
- Test processing.
- Result encoding.
- Reference ranges.
- Result verification.
- Result approval.
- Result release.
- Printable laboratory reports.
- Laboratory history.
- Pending test monitoring.

### Supported Laboratory Tests

- Complete Blood Count (CBC).
- Urinalysis.
- Fecalysis.
- Blood Chemistry.
- Lipid Profile.
- Blood Glucose.
- Pregnancy Test.
- Other configurable laboratory tests.

### Laboratory Workflow

Order → Collection → Reception → Processing → Result Encoding → Verification → Approval → Release.

Support multiple result components per test.

Store result units, reference ranges, abnormal flags, performing personnel, verification details, and amendments.

## 17. Radiology and Imaging Management

### Features

- Imaging procedure catalog.
- X-ray requests.
- Ultrasound requests.
- CT scan requests.
- MRI requests.
- Imaging appointment scheduling.
- Radiology queue.
- Technician assignment.
- Imaging procedure records.
- Image attachments.
- Radiologist findings.
- Interpretation.
- Report verification.
- Report approval.
- Result release.
- Imaging history.

Support future integration with DICOM and PACS.

Large imaging files should use appropriate object storage or an integrated PACS rather than being stored directly as database binary data.

## 18. Billing and Payment Management

### Features

- Patient billing account.
- Invoice generation.
- Consultation charges.
- Laboratory charges.
- Radiology charges.
- Pharmacy charges.
- Room accommodation charges.
- Medical procedure charges.
- Surgery charges.
- Additional hospital services.
- Automatic charge calculation.
- Itemized billing.
- Discounts.
- Insurance coverage.
- PhilHealth deductions.
- HMO deductions.
- Partial payments.
- Full payments.
- Cash payments.
- Card payment recording.
- Digital payment recording.
- Official receipt generation.
- Refund processing.
- Outstanding balance monitoring.
- Statement of account generation.
- Payment history.
- Collection reports.

### Billing Calculation

Calculate:

- Gross Charges.
- Authorized Discounts.
- Adjustments.
- Insurance and PhilHealth Coverage.
- Patient Payments.
- Outstanding Balance.

All financial calculations must use precise decimal monetary values.

### Financial Controls

- Finalized invoices cannot be silently edited.
- Posted payments cannot be permanently deleted.
- Refunds require authorization.
- Payment reversals must retain transaction history.
- Receipt numbers must be unique.
- All financial operations must be auditable.
- Prevent duplicate payment posting.

## 19. Inventory and Procurement Management

### Features

- Medical supply registration.
- Non-medical supply registration.
- Inventory categories.
- Stock management.
- Stock-in and stock-out.
- Batch tracking.
- Expiration tracking.
- Inventory transfers.
- Stock adjustments.
- Stock requisitions.
- Purchase requisitions.
- Purchase orders.
- Supplier management.
- Goods receiving.
- Delivery inspection.
- Physical inventory counting.
- Inventory valuation.
- Low-stock alerts.
- Inventory reports.

### Procurement Workflow

Department Requisition → Approval → Purchase Order → Supplier Delivery → Inspection → Goods Receipt → Inventory Update → Supplier Invoice.

Maintain complete stock movement history.

Stock changes must be performed through controlled transactional operations, not arbitrary frontend updates to stock balances.

## 20. Surgery and Operating Room Management

### Features

- Operating room registration.
- Operating room availability.
- Surgery scheduling.
- Surgical procedure catalog.
- Surgeon assignment.
- Anesthesiologist assignment.
- Surgical team assignment.
- Preoperative assessment.
- Surgical consent documentation.
- Surgical safety checklist.
- Anesthesia records.
- Intraoperative notes.
- Surgical instrument records.
- Medical supply utilization.
- Postoperative monitoring.
- Recovery room management.
- Surgical reports.
- Surgery-related billing.

## 21. Human Resources and Payroll Management

### Features

- Employee registration.
- Employee profiles.
- Department assignment.
- Position management.
- Professional credential records.
- License expiration monitoring.
- Attendance monitoring.
- Shift scheduling.
- Leave management.
- Overtime tracking.
- Payroll periods.
- Salary configuration.
- Allowances.
- Deductions.
- Payroll processing.
- Payroll approval.
- Payslip generation.
- Employee reports.

HR and payroll permissions must be separated appropriately.

## 22. Insurance and PhilHealth Management

### Features

- Insurance provider registration.
- Patient insurance information.
- Membership information.
- Coverage verification records.
- Policy information.
- Benefit configuration.
- Authorization tracking.
- Claims documentation.
- Claims submission tracking.
- Claims status.
- Approved claims.
- Rejected claims.
- Claims adjustments.
- Claims payment monitoring.
- PhilHealth documentation.
- Claims reports.

Maintain configurable benefit and policy information according to applicable official rules.

Do not claim automatic PhilHealth or insurance processing without an approved and functional external integration.

## 23. Blood Bank Management

### Features

- Blood donor registration.
- Donor eligibility records.
- Blood donation records.
- Blood type management.
- Blood component inventory.
- Blood unit identification.
- Screening and testing records.
- Expiration tracking.
- Blood requests.
- Blood reservations.
- Crossmatching records.
- Blood issue and release.
- Transfusion documentation.
- Transfusion reaction records.
- Blood disposal.
- Blood inventory reports.

Blood bank workflows must be validated by qualified blood bank personnel.

## 24. Ambulance Management

### Features

- Ambulance registration.
- Vehicle information.
- Driver assignment.
- Medical crew assignment.
- Ambulance availability.
- Emergency dispatch.
- Pickup and destination records.
- Patient transport records.
- Dispatch status.
- Trip history.
- Vehicle maintenance.
- Fuel records.
- Ambulance reports.

## 25. Dietary Management

### Features

- Patient dietary assessment.
- Diet category management.
- Therapeutic diet configuration.
- Food allergy information.
- Dietary restrictions.
- Meal scheduling.
- Meal preparation requests.
- Meal distribution.
- Meal delivery confirmation.
- Dietary reports.

## 26. Housekeeping Management

### Features

- Cleaning request creation.
- Room cleaning assignments.
- Bed cleaning assignments.
- Cleaning schedules.
- Staff assignments.
- Cleaning status monitoring.
- Disinfection records.
- Cleaning completion verification.
- Housekeeping reports.

## 27. Equipment and Maintenance Management

### Features

- Medical equipment registration.
- Asset identification.
- Equipment categorization.
- Department assignment.
- Equipment availability.
- Maintenance schedules.
- Preventive maintenance.
- Repair requests.
- Maintenance work orders.
- Calibration records.
- Maintenance history.
- Equipment reports.

## 28. Mortuary Management

### Features

- Deceased patient records.
- Mortuary admission.
- Body identification.
- Storage location assignment.
- Next-of-kin information.
- Authorized release processing.
- Release documentation.
- Mortuary status monitoring.
- Mortuary reports.

Apply strict access restrictions and audit all access to mortuary records.

## 29. Notifications and Communication

### Features

- Internal notifications.
- Appointment reminders.
- Appointment confirmation.
- Queue notifications.
- Admission notifications.
- Discharge notifications.
- Laboratory result notifications.
- Radiology result notifications.
- Prescription notifications.
- Billing reminders.
- Low-stock alerts.
- Expiration alerts.
- Maintenance notifications.
- Staff announcements.
- Email integration.
- SMS integration.
- Notification preferences.

Use Supabase Realtime for in-app updates where appropriate.

Sensitive patient information must not be exposed through unsecured notifications.

## 30. Reports and Analytics

### Patient Reports

- Patient registration reports.
- Patient demographics.
- Patient visit history.
- Outpatient reports.
- Inpatient reports.
- Emergency patient reports.
- Patient admission reports.
- Discharge reports.

### Clinical Reports

- Consultation reports.
- Diagnosis statistics.
- Nursing activity reports.
- Laboratory reports.
- Radiology reports.
- Surgery reports.
- Medication administration reports.

### Pharmacy Reports

- Medicine inventory.
- Medicine dispensing.
- Medicine sales.
- Expired medicine.
- Low-stock medicines.
- Pharmacy transactions.

### Financial Reports

- Daily collections.
- Monthly revenue.
- Outstanding balances.
- Payment history.
- Refund reports.
- Discount reports.
- Insurance claims.
- PhilHealth claims.
- Departmental revenue.
- Expense reports.

### Administrative Reports

- Employee reports.
- Attendance reports.
- Payroll reports.
- Inventory reports.
- Procurement reports.
- Bed occupancy.
- Equipment maintenance.
- User activity.
- Audit history.

### Export Formats

- PDF.
- Excel (XLSX).
- CSV.
- Printable HTML.

Apply role-based access and data filtering to all reports.

## 31. System Settings and Audit Logs

### Hospital Configuration

- Hospital name.
- Hospital address.
- Hospital logo.
- Contact details.
- Hospital departments.
- Hospital branches.
- Department categories.
- Room categories.
- Bed categories.
- Service categories.
- Consultation fees.
- Laboratory prices.
- Radiology prices.
- Pharmacy settings.
- Billing settings.
- Payment methods.
- Document templates.
- Numbering sequences.

### Audit Logs

Track:

- User login and logout.
- Patient record access.
- Patient record modification.
- Clinical record creation.
- Clinical record amendments.
- Prescription creation.
- Medication dispensing.
- Laboratory result approval.
- Radiology report approval.
- Admission and discharge.
- Bed assignments.
- Invoice generation.
- Payment posting.
- Refunds.
- Inventory changes.
- User permission changes.
- Administrative configuration changes.
- Record exports and sensitive document downloads.

Audit records must include:

- User ID.
- Action.
- Resource type.
- Resource ID.
- Timestamp.
- Relevant contextual information.
- Outcome.
- Reason where required.

Protect audit records against unauthorized modification and deletion.

## 32. Proposed Supabase Database Schema

Design a normalized PostgreSQL database organized into logical domains.

Use UUID primary keys for major entities.

Use:

- `created_at`
- `updated_at`
- `created_by`
- `updated_by`

Where appropriate, include:

- `deleted_at` for controlled soft deletion of eligible non-finalized records.
- `status` for workflow state.
- `hospital_id` or branch scope where required.
- Foreign keys and database constraints.
- Indexes for frequently queried fields.

### 32.1 Authentication and Access Control

- `profiles`
- `roles`
- `permissions`
- `user_roles`
- `role_permissions`
- `departments`
- `user_departments`
- `hospital_branches`
- `user_sessions`
- `login_logs`

### 32.2 Patient Management

- `patients`
- `patient_contacts`
- `patient_addresses`
- `patient_emergency_contacts`
- `patient_documents`
- `patient_allergies`
- `patient_medical_history`
- `patient_insurances`
- `patient_consents`

### 32.3 Appointment and Clinical Management

- `doctor_profiles`
- `specializations`
- `doctor_schedules`
- `appointments`
- `queue_entries`
- `encounters`
- `diagnoses`
- `encounter_diagnoses`
- `clinical_notes`
- `clinical_orders`
- `clinical_order_items`
- `service_catalog`
- `referrals`

### 32.4 Admission and Bed Management

- `buildings`
- `floors`
- `wards`
- `rooms`
- `beds`
- `admissions`
- `bed_assignments`
- `patient_transfers`
- `discharge_summaries`

### 32.5 Nursing Management

- `vital_signs`
- `nursing_assessments`
- `nursing_care_plans`
- `nursing_interventions`
- `medication_administration_records`
- `intake_output_records`
- `patient_handover_records`

### 32.6 Pharmacy Management

- `medicine_categories`
- `medicines`
- `prescriptions`
- `prescription_items`
- `dispensings`
- `dispensing_items`
- `medicine_batches`
- `medicine_returns`

### 32.7 Laboratory Management

- `lab_test_categories`
- `lab_tests`
- `lab_test_components`
- `lab_reference_ranges`
- `lab_orders`
- `lab_order_items`
- `specimens`
- `lab_results`
- `lab_result_values`
- `lab_result_approvals`

### 32.8 Radiology Management

- `imaging_procedures`
- `imaging_orders`
- `imaging_examinations`
- `imaging_reports`
- `imaging_files`

### 32.9 Billing and Finance

- `invoices`
- `invoice_items`
- `payments`
- `payment_allocations`
- `refunds`
- `discounts`
- `insurance_claims`
- `expenses`
- `expense_categories`

### 32.10 Inventory and Procurement

- `inventory_categories`
- `inventory_items`
- `inventory_locations`
- `stock_batches`
- `stock_balances`
- `stock_movements`
- `suppliers`
- `purchase_requisitions`
- `purchase_requisition_items`
- `purchase_orders`
- `purchase_order_items`
- `goods_receipts`
- `goods_receipt_items`

### 32.11 Surgery Management

- `operating_rooms`
- `surgeries`
- `surgery_team_members`
- `surgical_checklists`
- `surgical_records`
- `anesthesia_records`
- `postoperative_records`
- `recovery_room_assignments`

### 32.12 HR and Payroll

- `employees`
- `employee_positions`
- `employee_contracts`
- `employee_credentials`
- `employee_shifts`
- `attendance_records`
- `leave_requests`
- `overtime_records`
- `payroll_periods`
- `payroll_records`
- `payroll_items`
- `payslips`

### 32.13 Insurance and PhilHealth

- `insurance_providers`
- `insurance_policies`
- `patient_coverages`
- `insurance_authorizations`
- `insurance_claims`
- `claim_documents`
- `claim_adjustments`

### 32.14 Blood Bank

- `blood_donors`
- `blood_donations`
- `blood_units`
- `blood_screening_results`
- `blood_requests`
- `crossmatch_records`
- `transfusions`
- `transfusion_reactions`

### 32.15 Ambulance Management

- `ambulances`
- `ambulance_crews`
- `dispatches`
- `ambulance_trips`
- `ambulance_maintenance`

### 32.16 Dietary Management

- `diet_types`
- `diet_orders`
- `meal_schedules`
- `meal_deliveries`

### 32.17 Housekeeping

- `cleaning_requests`
- `cleaning_assignments`
- `cleaning_logs`

### 32.18 Equipment and Maintenance

- `equipment`
- `maintenance_requests`
- `maintenance_work_orders`
- `maintenance_logs`
- `equipment_calibrations`

### 32.19 Mortuary Management

- `mortuary_records`
- `mortuary_locations`
- `body_releases`

### 32.20 System and Shared Services

- `notifications`
- `notification_preferences`
- `audit_logs`
- `attachments`
- `system_settings`
- `approval_requests`
- `approval_actions`
- `number_sequences`
- `integration_logs`

### Database Relationship Requirements

1. One patient can have multiple appointments.
2. One patient can have multiple encounters.
3. One patient can have multiple admissions.
4. One encounter can contain multiple diagnoses.
5. One encounter can contain multiple clinical notes.
6. One encounter can contain multiple clinical orders.
7. One prescription can contain multiple prescription items.
8. One prescription can have multiple dispensing transactions where partial dispensing is allowed.
9. One laboratory order can contain multiple test items.
10. One laboratory test can have multiple result components.
11. One admission can have multiple bed assignments over time.
12. One bed can have multiple historical assignments but only one active assignment.
13. One invoice can contain multiple invoice items.
14. One invoice can receive multiple payments.
15. One inventory item can have multiple batches.
16. One batch can have stock balances across multiple locations.
17. Every stock movement must have a traceable source and destination where applicable.
18. Every clinical order must reference its originating patient and encounter.
19. Every financial transaction must retain its responsible user.
20. All finalized records must retain their historical information.

Use database transactions, constraints, and appropriate unique indexes to prevent concurrent duplicate operations.

## 33. Core Entity Relationships

### Patient Relationships

`patients`
- Has many appointments.
- Has many encounters.
- Has many admissions.
- Has many allergies.
- Has many medical history records.
- Has many patient documents.
- Has many insurance records.

### Clinical Relationships

`encounters`
- Belongs to one patient.
- Belongs to a department.
- Has an attending or responsible clinician.
- Has many diagnoses.
- Has many clinical notes.
- Has many clinical orders.
- May be linked to an admission.

### Admission Relationships

`admissions`
- Belongs to one patient.
- References an encounter where applicable.
- Has one attending physician.
- Has many bed assignments.
- Has many transfers.
- May have one discharge summary.

### Pharmacy Relationships

`prescriptions`
- Belongs to one patient.
- Belongs to one encounter.
- References the prescribing doctor.
- Has many prescription items.
- Can have multiple dispensing records.

### Laboratory Relationships

`lab_orders`
- Belongs to one patient.
- References an encounter.
- Has many laboratory order items.
- Each item can have specimen and result records.
- Results retain verification and approval history.

### Billing Relationships

`invoices`
- Belongs to one patient.
- May reference an encounter.
- May reference an admission.
- Has many invoice items.
- Has many payments and payment allocations.

## 34. Core Hospital Workflow Integration

All modules must work together rather than operating as isolated applications.

### Outpatient Workflow

1. Receptionist searches for an existing patient.
2. New patients are registered when necessary.
3. Patient books an appointment or registers as a walk-in.
4. System generates a queue number.
5. Nurse performs triage and records vital signs where required.
6. Doctor opens the patient's EMR.
7. Doctor performs consultation and records diagnoses.
8. Doctor creates prescriptions and clinical orders.
9. Laboratory and radiology departments receive their orders.
10. Pharmacy receives authorized prescriptions.
11. Charges are recorded in the patient's billing account.
12. Cashier processes payments.
13. Doctor reviews available results.
14. Consultation is completed and follow-up is scheduled if necessary.

### Inpatient Workflow

1. Doctor creates an admission request.
2. Admission personnel verify patient and admission details.
3. Bed management checks availability.
4. Patient receives a ward, room, and bed assignment.
5. Nursing department receives the patient assignment.
6. Doctor creates treatment orders.
7. Nurses document patient care and vital signs.
8. Laboratory, radiology, and pharmacy process clinical orders.
9. Hospital charges are recorded.
10. Doctor evaluates discharge readiness.
11. Discharge summary and instructions are prepared.
12. Billing finalizes the account.
13. Patient discharge is recorded.
14. Bed is transferred to cleaning status.
15. Housekeeping completes cleaning.
16. Bed becomes available after inspection.

### Laboratory Workflow

Doctor Order → Laboratory Queue → Specimen Collection → Specimen Reception → Processing → Result Encoding → Verification → Approval → Release → Doctor Review.

### Pharmacy Workflow

Prescription → Pharmacist Verification → Stock Availability Check → Batch Selection → Dispensing → Medication Record Update → Billing Integration.

### Emergency Workflow

Emergency Arrival → Registration → Triage → Initial Assessment → Emergency Treatment → Diagnostics → Clinical Decision → Admission, Transfer, or Discharge.

### Surgery Workflow

Surgical Request → Clinical Assessment → Scheduling → Preoperative Checklist → Surgery → Postoperative Care → Recovery → Discharge or Inpatient Continuation.

### Procurement Workflow

Department Requisition → Approval → Purchase Order → Delivery → Inspection → Goods Receipt → Inventory Update → Invoice Processing.

## 35. Role-Based Access Control and Permissions

Implement permission-based access with department-level and patient-level restrictions.

### Super Administrator

- Manage system-wide configuration.
- Manage application roles and permissions.
- Manage hospital branches.
- Manage users and departments.
- Monitor audit logs.
- Manage technical settings.

### Hospital Administrator

- View hospital-wide operational dashboards.
- Manage hospital configuration within authorized scope.
- Monitor departments.
- Access authorized reports.
- Approve administrative requests.

### Department Head

- Manage department personnel.
- Monitor departmental activity.
- View department reports.
- Approve department requests.
- Monitor departmental resources.

### Medical Director

- Clinical oversight.
- Authorized clinical reports.
- Review clinical performance.
- Monitor clinical documentation compliance.

### Doctor

- Access assigned patients and authorized shared records.
- Conduct consultations.
- Create diagnoses.
- Create prescriptions.
- Request laboratory and imaging tests.
- Create referrals.
- Sign clinical notes.
- Create admission and discharge orders.

### Nurse

- Access assigned patients.
- Record vital signs.
- Create nursing assessments.
- Record nursing notes.
- Maintain care plans.
- Record medication administration.
- Monitor assigned patients.

### Receptionist

- Register patients.
- Manage demographic information.
- Manage appointments.
- Manage patient check-in.
- Manage queues.
- Access permitted administrative patient information.

### Medical Records Officer

- Manage medical record indexing.
- Manage documents.
- Review record completeness.
- Process authorized record requests.
- Maintain record archives.

### Pharmacist

- View authorized prescriptions.
- Verify prescriptions.
- Dispense medicines.
- Manage medicine inventory.
- Record returns.
- Monitor batches and expiration dates.

### Laboratory Technician

- View assigned laboratory orders.
- Manage specimens.
- Process tests.
- Encode results.
- Submit results for verification.

### Pathologist

- Review laboratory results.
- Verify and approve authorized results.
- Amend results through controlled workflows.

### Radiologist

- Review imaging examinations.
- Create interpretations.
- Verify and approve reports.

### Radiology Technician

- Process imaging requests.
- Manage imaging worklists.
- Record examinations.
- Upload authorized imaging files.

### Cashier

- Generate invoices where authorized.
- Receive payments.
- Generate receipts.
- Process approved transactions.

### Accountant

- Financial reporting.
- Reconciliation.
- Financial summaries.
- Review collections and expenses.
- Manage authorized financial adjustments.

### Inventory Officer

- Manage stock.
- Process inventory movements.
- Manage supplies.
- Conduct stock counts.
- Generate inventory reports.

### Procurement Officer

- Manage suppliers.
- Create purchase orders.
- Process procurement records.
- Track deliveries.

### HR Officer

- Manage employee profiles.
- Manage attendance.
- Manage leave.
- Manage employee credentials.

### Payroll Officer

- Process payroll.
- Review salary calculations.
- Generate payslips.
- Manage authorized payroll records.

### Patient

- View own approved medical records.
- View appointments.
- Book appointments.
- View approved laboratory and imaging results.
- View billing statements.
- View payment history.
- Manage personal information.

All role permissions must be enforced through RLS and database-level controls.

## 36. Supabase Storage Architecture

Use private storage buckets by default for confidential hospital documents.

Suggested buckets:

- `patient-documents`
- `medical-records`
- `laboratory-reports`
- `radiology-files`
- `prescriptions`
- `billing-documents`
- `discharge-summaries`
- `employee-documents`
- `hospital-assets`
- `generated-reports`

Requirements:

- Validate uploaded file types.
- Restrict file sizes.
- Use authenticated uploads.
- Enforce access permissions.
- Use signed URLs for authorized downloads.
- Store file metadata in PostgreSQL.
- Maintain upload and download audit records for sensitive documents.
- Avoid exposing confidential files through public URLs.

## 37. Supabase Realtime Integration

Use Realtime only for features that benefit from live updates.

Recommended features:

- OPD queue monitoring.
- Emergency department queue.
- Bed occupancy updates.
- Admission status changes.
- Pharmacy dispensing queue.
- Laboratory worklists.
- Result release notifications.
- Radiology worklists.
- Internal notifications.
- Dashboard operational updates.

Do not subscribe to every database table unnecessarily.

Ensure Realtime access is consistent with the applicable authorization policies.

## 38. Supabase Database Functions and Edge Functions

### Database Functions

Use PostgreSQL functions for atomic transactional operations such as:

- Patient number generation.
- Admission creation.
- Bed assignment.
- Patient transfer.
- Invoice finalization.
- Payment posting.
- Refund processing.
- Inventory stock movement.
- Medicine dispensing.
- Purchase order receiving.
- Approval state transitions.

Ensure operations are transactional and prevent race conditions.

### Edge Functions

Use Supabase Edge Functions only when trusted server-side execution is required.

Potential use cases:

- Protected email and SMS integrations.
- External insurance integrations.
- Payment provider callbacks.
- Secure AI integrations if approved.
- Scheduled external notifications.
- Protected third-party service requests.
- Server-side document processing when browser-side processing is unsuitable.

Do not use Edge Functions to recreate ordinary Supabase database CRUD operations.

## 39. Frontend Design Guidelines

Build a professional enterprise-level Hospital Information System interface.

### Design Direction

- Modern hospital management dashboard.
- Clean and organized layouts.
- Professional typography.
- Consistent spacing.
- Accessible contrast.
- Responsive navigation.
- Reusable components.
- Clear data tables.
- Searchable records.
- Filterable lists.
- Useful empty states.
- Loading indicators.
- Error handling.
- Confirmation dialogs.
- Accessible forms.

### Suggested Visual Identity

Use a professional healthcare-inspired design.

Suggested colors:

- Primary: `#176B87`
- Secondary: `#2A9D8F`
- Accent: `#E9C46A`
- Background: `#F7F9FC`
- Surface: `#FFFFFF`
- Text: `#1F2937`
- Muted: `#64748B`
- Danger: `#DC2626`

Use consistent design tokens and semantic status colors.

### Main Navigation

1. Dashboard
2. Patients
3. Appointments
4. Queue Management
5. Doctors
6. Consultations
7. Electronic Medical Records
8. Admissions and Discharges
9. Bed and Room Management
10. Nursing
11. Emergency Room
12. Pharmacy
13. Laboratory
14. Radiology
15. Surgery and Operating Room
16. Billing and Payments
17. Insurance and PhilHealth
18. Inventory
19. Procurement
20. Blood Bank
21. Ambulance
22. Dietary
23. Housekeeping
24. Equipment and Maintenance
25. Mortuary
26. Human Resources
27. Payroll
28. Reports and Analytics
29. Notifications
30. User Management
31. Audit Logs
32. System Settings

Display navigation items according to the user's permissions.

## 40. Security and Philippine Compliance Requirements

The system handles sensitive personal and medical information.

Implement security and governance controls appropriate to a Philippine hospital environment.

Requirements:

- Follow the applicable Philippine Data Privacy Act of 2012 (RA 10173) and its implementing rules.
- Implement privacy-by-design principles.
- Apply least-privilege access.
- Enforce RLS policies.
- Protect patient medical information.
- Encrypt data in transit using HTTPS.
- Use appropriate encryption at rest.
- Maintain audit logs.
- Restrict sensitive document access.
- Implement secure session management.
- Support authorized data access requests.
- Implement retention and disposal policies.
- Maintain backup and recovery procedures.
- Protect against unauthorized data modification.
- Maintain incident response procedures.
- Apply appropriate access controls to employee and patient records.
- Ensure external integrations have approved privacy and security arrangements.

For a real hospital deployment, obtain review from the hospital's Data Protection Officer, IT security team, legal/compliance personnel, and clinical leadership.

The system must not be considered compliant merely because it has login and RLS enabled.

## 41. Testing Requirements

### Authentication Testing

- Login.
- Logout.
- Password reset.
- Session expiration.
- Role assignment.
- Unauthorized access.

### Database Testing

- Foreign key integrity.
- Unique constraints.
- Transactional consistency.
- Patient record relationships.
- Admission relationships.
- Financial transaction consistency.
- Inventory calculations.

### RLS Testing

Test users with different roles and departments.

Verify:

- Patient access boundaries.
- Doctor access restrictions.
- Nurse patient assignments.
- Department-level restrictions.
- Pharmacy access restrictions.
- Laboratory access restrictions.
- Financial data restrictions.
- Administrative privileges.
- Patient portal access.
- Storage bucket permissions.

### Module Testing

- Patient registration.
- Appointment scheduling.
- Queue management.
- Consultations.
- EMR.
- Admissions.
- Bed assignments.
- Nursing records.
- Pharmacy dispensing.
- Laboratory processing.
- Radiology reporting.
- Billing.
- Payments.
- Inventory.
- Procurement.
- Surgery.
- HR.
- Payroll.
- Insurance.
- Blood bank.
- Ambulance.
- Notifications.
- Reporting.

### Workflow Testing

Test complete patient journeys, not just individual screens.

Include:

- Outpatient consultation.
- Emergency admission.
- Inpatient admission.
- Patient transfer.
- Discharge.
- Laboratory testing.
- Prescription dispensing.
- Billing and payment.
- Procurement and inventory receiving.

Use synthetic patient information or approved de-identified data during development and testing.

## 42. Development Phases

### Phase 1 — Project Foundation

- Inspect and initialize the React application.
- Configure TypeScript and Tailwind CSS.
- Configure Supabase.
- Create initial database migrations.
- Implement authentication.
- Implement user profiles.
- Implement roles and permissions.
- Configure initial RLS policies.
- Build the application layout.
- Build reusable UI components.

**Deliverable:** Functional HMS application foundation.

### Phase 2 — Core Hospital Operations

- Patient management.
- Doctor management.
- Department management.
- Appointment management.
- Queue management.
- Consultation management.
- Electronic Medical Records.
- Vital signs.
- Clinical notes.
- Diagnosis management.

**Deliverable:** Functional outpatient and clinical management modules.

### Phase 3 — Inpatient and Emergency Operations

- Admission management.
- Discharge management.
- Patient transfers.
- Bed management.
- Room management.
- Nursing management.
- Emergency room management.
- Patient monitoring.

**Deliverable:** Functional inpatient and emergency management.

### Phase 4 — Diagnostics and Pharmacy

- Pharmacy management.
- Medicine inventory.
- Prescription management.
- Laboratory management.
- Specimen tracking.
- Result verification.
- Radiology management.
- Imaging reports.

**Deliverable:** Integrated pharmacy and diagnostic services.

### Phase 5 — Finance and Supply Chain

- Billing.
- Payments.
- Refunds.
- Insurance management.
- PhilHealth tracking.
- Inventory.
- Suppliers.
- Procurement.
- Purchase orders.
- Goods receiving.

**Deliverable:** Integrated financial and inventory management.

### Phase 6 — Advanced Hospital Operations

- Surgery management.
- Operating room management.
- HR.
- Payroll.
- Blood bank.
- Ambulance.
- Dietary management.
- Housekeeping.
- Equipment maintenance.
- Mortuary.

**Deliverable:** Comprehensive hospital department management.

### Phase 7 — Reports and Integrations

- Hospital analytics.
- Operational reports.
- Clinical reports.
- Financial reports.
- Document generation.
- Notifications.
- Realtime integrations.
- Approved external integrations.

**Deliverable:** Integrated reporting and communication platform.

### Phase 8 — Testing and Security Validation

- Functional testing.
- RLS testing.
- Security testing.
- Workflow testing.
- Performance testing.
- Database integrity testing.
- User acceptance testing.
- Clinical workflow validation.
- Bug fixing.

**Deliverable:** Production release candidate.

### Phase 9 — Deployment and Handover

- Configure production Supabase.
- Configure production environment variables.
- Deploy frontend.
- Configure custom domain.
- Configure backups.
- Prepare technical documentation.
- Prepare user manuals.
- Conduct user training.
- Complete production handover.

**Deliverable:** Production-ready Hospital Management System.

## 43. Development Standards

1. Use modular React and TypeScript architecture.
2. Use the official Supabase JavaScript SDK.
3. Use Supabase as the only backend platform.
4. Do not create a separate REST API backend.
5. Do not introduce Express, FastAPI, or standalone backend servers.
6. Use Supabase Auth for authentication.
7. Use PostgreSQL for structured application data.
8. Apply RLS policies to all client-accessible tables.
9. Use Supabase Storage for files.
10. Use Realtime only when needed.
11. Use database migrations for schema changes.
12. Use database transactions for critical operations.
13. Never expose privileged secrets.
14. Validate all user input.
15. Implement loading, empty, success, and error states.
16. Reuse UI components and business logic.
17. Avoid unnecessary dependencies.
18. Use Git for version control.
19. Write tests for critical workflows.
20. Maintain complete clinical and financial audit trails.
21. Do not use real patient data in development fixtures.
22. Never invent real hospital records or operational data.
23. Use realistic synthetic data for demonstrations.
24. Document all implemented features.
25. Report incomplete functionality honestly.

## 44. Instructions for AI Coding Agents

When working on this repository:

- Inspect the existing project structure before modifying files.
- Read existing documentation and configuration.
- Preserve working implementations.
- Do not introduce Express, FastAPI, custom Node.js backends, or Python backends.
- Do not create custom REST endpoints for operations already supported by Supabase.
- Use Supabase client methods for database, Auth, Storage, and Realtime operations.
- Use database functions for critical transactional operations where appropriate.
- Use Edge Functions only when trusted server-side execution is necessary.
- Never expose service-role keys or provider secrets.
- Do not invent patient information.
- Do not use real patient data in development fixtures.
- Implement features incrementally.
- Validate RLS policies, not just frontend access controls.
- Test all role permissions.
- Run relevant tests after changes.
- Report incomplete functionality honestly.
- Update documentation when implementation changes.

### Before Implementing Any Feature

1. Inspect the existing code and relevant Supabase schema.
2. Identify required tables and relationships.
3. Identify required RLS policies.
4. Determine whether Storage or Realtime is required.
5. Implement database migrations.
6. Implement and validate RLS policies.
7. Implement frontend integration using the Supabase client.
8. Use a Database Function or Edge Function only when justified.
9. Implement form validation and error handling.
10. Test using appropriate user roles.
11. Test the complete workflow.
12. Update documentation.

### Important Implementation Rules

- Never create frontend-only simulated CRUD functionality and claim that it is connected to Supabase.
- Never use hardcoded patient records as production data.
- Never allow unauthorized users to modify clinical records.
- Never allow unauthorized financial adjustments.
- Never silently overwrite signed medical records.
- Never bypass database constraints to make a feature work.
- Never expose sensitive patient information in logs.
- Never trust client-submitted role or permission values.
- Never use frontend calculations as the sole authority for financial transactions or inventory updates.
- Never report a feature as complete unless its actual database integration and permissions work.

## 45. Definition of Done

A feature is complete only when:

- Its requirements are implemented.
- Its frontend is functional.
- Its Supabase integration works.
- Its database changes are versioned through migrations.
- Its RLS policies are implemented and tested.
- Its relationships and database constraints are correct.
- Its Storage permissions are correct, if applicable.
- Its Realtime behavior works, if applicable.
- Its loading and error states are handled.
- Its role permissions are verified.
- Its critical workflows pass tests.
- Its documentation is updated.

The complete HMS is ready for production handover only when the approved hospital scope has passed security validation, database integrity testing, clinical workflow validation, performance testing, and user acceptance testing.

## 46. Non-Negotiable Architecture Decision

**SUPABASE IS THE BACKEND. THE REACT FRONTEND COMMUNICATES DIRECTLY WITH SUPABASE THROUGH THE OFFICIAL SUPABASE CLIENT.**

- No separate REST API backend.
- No Express backend.
- No FastAPI backend.
- No standalone Node.js application server.
- No standalone Python application server.
- Supabase PostgreSQL is the primary database.
- Supabase Auth handles authentication.
- Supabase RLS enforces authorization.
- Supabase Storage handles files.
- Supabase Realtime handles required live updates.
- Supabase Database Functions handle necessary transactional operations.
- Supabase Edge Functions are reserved for trusted server-side operations that cannot safely run in the browser.

Do not add another backend layer unless the project owner explicitly changes this architecture decision.

**The approved database schema, hospital workflows, clinical permissions, and documented requirements must serve as the source of truth for the implementation.**