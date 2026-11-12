export type Profile = {
  id: string;
  email: string;
  full_name: string;
  avatar_path: string | null;
  contact_number: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Role = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
};

export type Department = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type StaffProfile = {
  id: string;
  user_id: string;
  staff_number: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  department_id: string | null;
  employment_type: string | null;
  professional_license_number: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Physician = {
  id: string;
  staff_id: string;
  specialty: string | null;
  license_number: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
};

export type Room = {
  id: string;
  room_number: string;
  department_id: string;
  room_type: string | null;
  floor_number: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Bed = {
  id: string;
  room_id: string;
  bed_number: string;
  status: "available" | "occupied" | "maintenance" | "reserved";
  created_at: string;
  updated_at: string;
};

export type Patient = {
  id: string;
  medical_record_number: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  date_of_birth: string | null;
  sex: string | null;
  civil_status: string | null;
  nationality: string | null;
  contact_number: string | null;
  email: string | null;
  address_line: string | null;
  barangay: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  registration_date: string;
  registration_status: "active" | "inactive" | "archived";
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type EmergencyContact = {
  id: string;
  patient_id: string;
  full_name: string;
  relationship: string | null;
  contact_number: string;
  address: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

export type PatientAllergy = {
  id: string;
  patient_id: string;
  allergen: string;
  reaction: string | null;
  severity: string | null;
  notes: string | null;
  recorded_by: string;
  created_at: string;
  updated_at: string;
};

export type MedicalHistory = {
  id: string;
  patient_id: string;
  history_type: string;
  description: string;
  recorded_by: string;
  recorded_at: string;
  created_at: string;
};

export type Appointment = {
  id: string;
  appointment_number: string;
  patient_id: string;
  department_id: string;
  physician_id: string | null;
  scheduled_at: string;
  duration_minutes: number;
  appointment_type: string | null;
  reason_for_visit: string | null;
  status:
    | "scheduled"
    | "confirmed"
    | "waiting"
    | "in_consultation"
    | "completed"
    | "cancelled"
    | "no_show";
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Admission = {
  id: string;
  admission_number: string;
  patient_id: string;
  attending_physician_id: string | null;
  department_id: string;
  admission_date: string;
  discharge_date: string | null;
  admission_type: string | null;
  status: "admitted" | "transferred" | "discharged" | "cancelled";
  admission_notes: string | null;
  discharge_notes: string | null;
  admitted_by: string;
  discharged_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AdmissionBedAssignment = {
  id: string;
  admission_id: string;
  bed_id: string;
  assigned_at: string;
  released_at: string | null;
  assigned_by: string;
  created_at: string;
};

export type PatientTransfer = {
  id: string;
  admission_id: string;
  from_bed_id: string | null;
  to_bed_id: string;
  transfer_reason: string | null;
  transferred_by: string;
  transferred_at: string;
  created_at: string;
};

export type Encounter = {
  id: string;
  encounter_number: string;
  patient_id: string;
  appointment_id: string | null;
  admission_id: string | null;
  physician_id: string | null;
  department_id: string;
  encounter_type: string;
  chief_complaint: string | null;
  clinical_status: "open" | "in_progress" | "completed" | "cancelled";
  started_at: string;
  completed_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type VitalSigns = {
  id: string;
  patient_id: string;
  encounter_id: string;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  heart_rate: number | null;
  respiratory_rate: number | null;
  temperature: number | null;
  oxygen_saturation: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  recorded_by: string;
  recorded_at: string;
  created_at: string;
};

export type Diagnosis = {
  id: string;
  patient_id: string;
  encounter_id: string;
  diagnosis_code: string | null;
  diagnosis_name: string;
  diagnosis_type: string | null;
  clinical_notes: string | null;
  is_primary: boolean;
  recorded_by: string;
  recorded_at: string;
  created_at: string;
};

export type ClinicalNote = {
  id: string;
  patient_id: string;
  encounter_id: string;
  note_type: string;
  content: string;
  status: "draft" | "finalized" | "amended";
  authored_by: string;
  finalized_at: string | null;
  created_at: string;
  updated_at: string;
};

export type NursingAssessment = {
  id: string;
  patient_id: string;
  encounter_id: string;
  assessment_type: string;
  assessment_data: Record<string, unknown>;
  notes: string | null;
  assessed_by: string;
  assessed_at: string;
  created_at: string;
};

export type NursingNote = {
  id: string;
  patient_id: string;
  encounter_id: string;
  note: string;
  recorded_by: string;
  recorded_at: string;
  created_at: string;
};

export type LaboratoryTest = {
  id: string;
  test_code: string;
  test_name: string;
  category: string | null;
  description: string | null;
  specimen_type: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type LaboratoryOrder = {
  id: string;
  order_number: string;
  patient_id: string;
  encounter_id: string;
  ordered_by: string;
  priority: "routine" | "urgent" | "stat";
  status: "pending" | "collection" | "processing" | "completed" | "cancelled";
  ordered_at: string;
  created_at: string;
  updated_at: string;
};

export type LaboratoryOrderItem = {
  id: string;
  order_id: string;
  test_id: string;
  status: string;
  created_at: string;
};

export type LaboratorySpecimen = {
  id: string;
  order_id: string;
  specimen_type: string;
  collection_status: "pending" | "collected" | "rejected";
  collected_by: string | null;
  collected_at: string | null;
  notes: string | null;
  created_at: string;
};

export type LaboratoryResult = {
  id: string;
  order_item_id: string;
  result_value: string | null;
  result_unit: string | null;
  reference_range: string | null;
  interpretation: string | null;
  verification_status: "pending" | "verified" | "rejected";
  performed_by: string | null;
  verified_by: string | null;
  performed_at: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type RadiologyOrder = {
  id: string;
  order_number: string;
  patient_id: string;
  encounter_id: string;
  examination_type: string;
  body_part: string | null;
  ordered_by: string;
  scheduled_at: string | null;
  status: "pending" | "scheduled" | "in_progress" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
};

export type RadiologyReport = {
  id: string;
  order_id: string;
  report_content: string | null;
  report_status: "draft" | "verified" | "amended";
  reported_by: string | null;
  verified_by: string | null;
  reported_at: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Medication = {
  id: string;
  medication_code: string;
  generic_name: string;
  brand_name: string | null;
  strength: string | null;
  dosage_form: string | null;
  unit: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Prescription = {
  id: string;
  prescription_number: string;
  patient_id: string;
  encounter_id: string;
  prescribed_by: string;
  prescription_date: string;
  status: "pending" | "partially_dispensed" | "dispensed" | "cancelled";
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PrescriptionItem = {
  id: string;
  prescription_id: string;
  medication_id: string;
  dosage: string;
  frequency: string;
  duration_days: number | null;
  quantity: number;
  instructions: string | null;
  created_at: string;
};

export type MedicationDispense = {
  id: string;
  prescription_item_id: string;
  quantity_dispensed: number;
  dispensed_by: string;
  dispensed_at: string;
  notes: string | null;
  created_at: string;
};

export type InventoryCategory = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export type InventoryItem = {
  id: string;
  item_code: string;
  name: string;
  description: string | null;
  category_id: string | null;
  unit: string;
  reorder_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type InventoryBatch = {
  id: string;
  item_id: string;
  batch_number: string | null;
  quantity_received: number;
  quantity_remaining: number;
  expiration_date: string | null;
  unit_cost: number | null;
  received_at: string;
  created_at: string;
};

export type StockTransaction = {
  id: string;
  item_id: string;
  batch_id: string | null;
  transaction_type:
    | "stock_in"
    | "stock_out"
    | "adjustment"
    | "transfer"
    | "dispensing";
  quantity: number;
  reference_type: string | null;
  reference_id: string | null;
  reason: string | null;
  performed_by: string;
  performed_at: string;
  created_at: string;
};

export type Invoice = {
  id: string;
  invoice_number: string;
  patient_id: string;
  admission_id: string | null;
  encounter_id: string | null;
  invoice_date: string;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  balance: number;
  status: "unpaid" | "partially_paid" | "paid" | "cancelled" | "refunded";
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  created_at: string;
};

export type Payment = {
  id: string;
  payment_reference: string;
  invoice_id: string;
  amount: number;
  payment_method: string;
  payment_status: "pending" | "completed" | "failed" | "refunded" | "cancelled";
  received_by: string;
  received_at: string;
  notes: string | null;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
};

export type AuditLog = {
  id: number;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
};

export type StockStatus = "available" | "low_stock" | "out_of_stock";

export type PatientListRow = {
  id: string;
  medical_record_number: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  full_name: string;
  date_of_birth: string | null;
  sex: string | null;
  contact_number: string | null;
  email: string | null;
  address_line: string | null;
  city: string | null;
  province: string | null;
  registration_date: string;
  registration_status: "active" | "inactive" | "archived";
};

export type AppointmentListRow = {
  id: string;
  appointment_number: string;
  patient_id: string;
  patient_name: string;
  patient_mrn: string;
  department_id: string;
  department_name: string;
  physician_id: string | null;
  physician_name: string | null;
  scheduled_at: string;
  duration_minutes: number;
  appointment_type: string | null;
  reason_for_visit: string | null;
  status: Appointment["status"];
  notes: string | null;
  created_at: string;
};

export type AdmissionListRow = {
  id: string;
  admission_number: string;
  patient_id: string;
  patient_name: string;
  patient_mrn: string;
  department_id: string;
  department_name: string;
  attending_physician_id: string | null;
  attending_physician_name: string | null;
  admission_date: string;
  discharge_date: string | null;
  admission_type: string | null;
  status: Admission["status"];
  room_number: string | null;
  bed_number: string | null;
};

export type BedBoardRow = {
  bed_id: string;
  bed_number: string;
  status: Bed["status"];
  room_id: string;
  room_number: string;
  room_type: string | null;
  floor_number: string | null;
  department_id: string;
  department_name: string;
  patient_id: string | null;
  patient_name: string | null;
  admission_id: string | null;
};

export type StaffListRow = {
  id: string;
  staff_number: string;
  user_id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  full_name: string;
  email: string;
  contact_number: string | null;
  role_names: string[];
  department_id: string | null;
  department_name: string | null;
  employment_type: string | null;
  professional_license_number: string | null;
  specialty: string | null;
  is_physician: boolean;
  is_active: boolean;
};

export type EncounterListRow = {
  id: string;
  encounter_number: string;
  patient_id: string;
  patient_name: string;
  patient_mrn: string;
  department_id: string;
  department_name: string;
  physician_id: string | null;
  physician_name: string | null;
  encounter_type: string;
  chief_complaint: string | null;
  clinical_status: Encounter["clinical_status"];
  started_at: string;
  completed_at: string | null;
};

export type EncounterDetail = {
  encounter: Encounter;
  patient: Patient;
  vitals: VitalSigns[];
  diagnoses: Diagnosis[];
  clinical_notes: ClinicalNote[];
};

export type EmergencyTriageLevel =
  | "critical"
  | "emergent"
  | "urgent"
  | "less_urgent"
  | "non_urgent";

export type EmergencyVisitStatus =
  | "waiting"
  | "triage"
  | "in_treatment"
  | "observation"
  | "admitted"
  | "transferred"
  | "discharged";

export type EmergencyArrivalMode = "walk_in" | "ambulance" | "referral";

export type EmergencyDisposition = "admit" | "transfer" | "discharge" | null;

export type EmergencyVisit = {
  id: string;
  visit_number: string;
  encounter_id: string;
  patient_id: string;
  arrival_at: string;
  arrival_mode: EmergencyArrivalMode;
  triage_level: EmergencyTriageLevel;
  triage_note: string | null;
  chief_complaint: string;
  status: EmergencyVisitStatus;
  attending_physician_id: string | null;
  triage_nurse_id: string | null;
  treatment_area: string | null;
  disposition: EmergencyDisposition;
  disposition_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type EmergencyVisitListRow = {
  id: string;
  visit_number: string;
  encounter_id: string;
  patient_id: string;
  patient_name: string;
  patient_mrn: string;
  arrival_at: string;
  arrival_mode: EmergencyArrivalMode;
  triage_level: EmergencyTriageLevel;
  chief_complaint: string;
  status: EmergencyVisitStatus;
  attending_physician_id: string | null;
  attending_physician_name: string | null;
  triage_nurse_name: string | null;
  treatment_area: string | null;
  wait_minutes: number;
  latest_vitals: VitalSigns | null;
  disposition: EmergencyDisposition;
};

export type EmergencyOrderSummary = {
  id: string;
  kind: "laboratory" | "radiology";
  label: string;
  status: string;
  ordered_at: string;
  ordered_by_name: string;
};

export type EmergencyMonitoringEntry = {
  recorded_at: string;
  note: string;
  recorded_by_name: string;
};

export type EmergencyNoteSummary = ClinicalNote & {
  author_name: string;
  author_role: string;
};

export type EmergencyVisitDetail = {
  visit: EmergencyVisit;
  patient: Patient;
  encounter: Encounter;
  attending_physician_name: string | null;
  triage_nurse_name: string | null;
  vitals: VitalSigns[];
  notes: EmergencyNoteSummary[];
  diagnoses: Diagnosis[];
  orders: EmergencyOrderSummary[];
  procedures: string[];
  monitoring: EmergencyMonitoringEntry[];
};

export type EmergencyStats = {
  total: number;
  waiting: number;
  triage: number;
  inTreatment: number;
  observation: number;
  critical: number;
  admitted: number;
  transferred: number;
  discharged: number;
  averageWaitMinutes: number;
};

export type NursingAssignmentRow = {
  patient_id: string;
  patient_name: string;
  patient_mrn: string;
  admission_id: string;
  admission_number: string;
  department_name: string;
  room_number: string | null;
  bed_number: string | null;
  assigned_staff_name: string | null;
  latest_vitals: VitalSigns | null;
  pending_assessments: number;
  active_tasks: number;
};

export type LabOrderListRow = {
  id: string;
  order_number: string;
  patient_id: string;
  patient_name: string;
  patient_mrn: string;
  encounter_id: string;
  ordered_by_name: string;
  priority: LaboratoryOrder["priority"];
  status: LaboratoryOrder["status"];
  ordered_at: string;
  tests: string[];
  item_count: number;
  specimen_status: LaboratorySpecimen["collection_status"] | null;
};

export type RadiologyOrderListRow = {
  id: string;
  order_number: string;
  patient_id: string;
  patient_name: string;
  patient_mrn: string;
  encounter_id: string;
  ordered_by_name: string;
  examination_type: string;
  body_part: string | null;
  scheduled_at: string | null;
  status: RadiologyOrder["status"];
  report_status: RadiologyReport["report_status"] | null;
  created_at: string;
};

export type PrescriptionListRow = {
  id: string;
  prescription_number: string;
  patient_id: string;
  patient_name: string;
  patient_mrn: string;
  encounter_id: string;
  prescribed_by_name: string;
  prescription_date: string;
  status: Prescription["status"];
  item_count: number;
  medications: string[];
};

export type MedicationStockRow = {
  id: string;
  medication_code: string;
  generic_name: string;
  brand_name: string | null;
  strength: string | null;
  dosage_form: string | null;
  unit: string | null;
  quantity_on_hand: number;
  reorder_level: number;
  nearest_expiration: string | null;
  stock_status: StockStatus;
  expiring_soon: boolean;
};

export type InvoiceListRow = {
  id: string;
  invoice_number: string;
  patient_id: string;
  patient_name: string;
  patient_mrn: string;
  admission_id: string | null;
  encounter_id: string | null;
  invoice_date: string;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  balance: number;
  status: Invoice["status"];
};

export type PaymentListRow = {
  id: string;
  payment_reference: string;
  invoice_id: string;
  invoice_number: string;
  patient_name: string;
  amount: number;
  payment_method: string;
  payment_status: Payment["payment_status"];
  received_by_name: string;
  received_at: string;
  notes: string | null;
};

export type InventoryListRow = {
  id: string;
  item_code: string;
  name: string;
  category_id: string | null;
  category_name: string | null;
  unit: string;
  quantity_on_hand: number;
  reorder_level: number;
  nearest_expiration: string | null;
  stock_status: StockStatus;
  expiring_soon: boolean;
};

export type StockTransactionRow = {
  id: string;
  item_id: string;
  item_code: string;
  item_name: string;
  unit: string;
  batch_id: string | null;
  batch_number: string | null;
  transaction_type: StockTransaction["transaction_type"];
  quantity: number;
  reference_type: string | null;
  reference_id: string | null;
  reason: string | null;
  performed_by_name: string;
  performed_at: string;
};

export type AuditLogRow = {
  id: number;
  created_at: string;
  actor_id: string | null;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  description: string | null;
  ip_address: string | null;
  result: "success" | "failed";
};

export type UserListRow = {
  id: string;
  email: string;
  full_name: string;
  avatar_path: string | null;
  contact_number: string | null;
  role_slugs: string[];
  role_names: string[];
  department_name: string | null;
  is_active: boolean;
  last_activity: string | null;
  created_at: string;
};

export type ReportCard = {
  id: string;
  title: string;
  description: string;
  category: string;
  href: string;
  formats: string[];
};

export type ReportRange = {
  start: string;
  end: string;
  label: string;
};

export type DashboardOverview = {
  metrics: {
    totalPatients: number;
    todaysAppointments: number;
    admittedPatients: number;
    availableBeds: number;
    pendingLabOrders: number;
    pendingPrescriptions: number;
    outstandingBilling: number;
  };
  admissionTrend: { month: string; admissions: number; discharges: number }[];
  appointmentBreakdown: { status: string; count: number }[];
  recentRegistrations: PatientListRow[];
  pendingActivities: {
    id: string;
    label: string;
    module: string;
    count: number;
    href: string;
  }[];
};

export type PatientSummary = {
  allergies: PatientAllergy[];
  history: MedicalHistory[];
  appointments: AppointmentListRow[];
  admissions: AdmissionListRow[];
  encounters: Encounter[];
  labResults: LaboratoryResult[];
  prescriptions: PrescriptionListRow[];
  invoices: InvoiceListRow[];
};

export type AppointmentStats = {
  total: number;
  today: number;
  scheduled: number;
  confirmed: number;
  waiting: number;
  inConsultation: number;
  completed: number;
  cancelled: number;
  noShow: number;
};

export type AdmissionStats = {
  total: number;
  admitted: number;
  transferred: number;
  discharged: number;
  cancelled: number;
  availableBeds: number;
  occupiedBeds: number;
  maintenanceBeds: number;
  reservedBeds: number;
  dischargesToday: number;
};

export type EncounterStats = {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  today: number;
};

export type NursingStats = {
  assignedPatients: number;
  pendingAssessments: number;
  vitalsToday: number;
  activeTasks: number;
};

export type StaffStats = {
  total: number;
  active: number;
  inactive: number;
  physicians: number;
  byDepartment: {
    department_id: string;
    department_name: string;
    count: number;
  }[];
};

export type LaboratoryStats = {
  total: number;
  pending: number;
  collection: number;
  processing: number;
  completed: number;
  cancelled: number;
  urgent: number;
  stat: number;
};

export type RadiologyStats = {
  total: number;
  pending: number;
  scheduled: number;
  inProgress: number;
  completed: number;
  cancelled: number;
};

export type PharmacyStats = {
  totalPrescriptions: number;
  pending: number;
  partiallyDispensed: number;
  dispensed: number;
  cancelled: number;
  lowStock: number;
  outOfStock: number;
  expiringSoon: number;
};

export type BillingStats = {
  totalInvoices: number;
  unpaid: number;
  partiallyPaid: number;
  paid: number;
  cancelled: number;
  refunded: number;
  totalBilled: number;
  totalPaid: number;
  outstandingBalance: number;
  paymentsToday: number;
};

export type InventoryStats = {
  totalItems: number;
  available: number;
  lowStock: number;
  outOfStock: number;
  expiringSoon: number;
  stockValue: number;
  transactions: number;
};

export type DepartmentStats = {
  total: number;
  active: number;
  inactive: number;
  staffCount: number;
};

export type UserStats = {
  total: number;
  active: number;
  inactive: number;
  byRole: { role: string; count: number }[];
};

export type AuditStats = {
  total: number;
  today: number;
  success: number;
  failed: number;
  byAction: { action: string; count: number }[];
};
