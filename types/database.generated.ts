export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admission_bed_assignments: {
        Row: {
          admission_id: string
          assigned_at: string
          assigned_by: string
          bed_id: string
          created_at: string
          id: string
          released_at: string | null
        }
        Insert: {
          admission_id: string
          assigned_at?: string
          assigned_by: string
          bed_id: string
          created_at?: string
          id?: string
          released_at?: string | null
        }
        Update: {
          admission_id?: string
          assigned_at?: string
          assigned_by?: string
          bed_id?: string
          created_at?: string
          id?: string
          released_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admission_bed_assignments_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "admissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admission_bed_assignments_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "v_admission_census"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admission_bed_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admission_bed_assignments_bed_id_fkey"
            columns: ["bed_id"]
            isOneToOne: false
            referencedRelation: "beds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admission_bed_assignments_bed_id_fkey"
            columns: ["bed_id"]
            isOneToOne: false
            referencedRelation: "v_bed_availability"
            referencedColumns: ["bed_id"]
          },
        ]
      }
      admissions: {
        Row: {
          admission_date: string
          admission_notes: string | null
          admission_number: string
          admission_type: string | null
          admitted_by: string
          attending_physician_id: string | null
          created_at: string
          department_id: string
          discharge_date: string | null
          discharge_notes: string | null
          discharged_by: string | null
          id: string
          patient_id: string
          status: Database["public"]["Enums"]["admission_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          admission_date?: string
          admission_notes?: string | null
          admission_number: string
          admission_type?: string | null
          admitted_by: string
          attending_physician_id?: string | null
          created_at?: string
          department_id: string
          discharge_date?: string | null
          discharge_notes?: string | null
          discharged_by?: string | null
          id?: string
          patient_id: string
          status?: Database["public"]["Enums"]["admission_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          admission_date?: string
          admission_notes?: string | null
          admission_number?: string
          admission_type?: string | null
          admitted_by?: string
          attending_physician_id?: string | null
          created_at?: string
          department_id?: string
          discharge_date?: string | null
          discharge_notes?: string | null
          discharged_by?: string | null
          id?: string
          patient_id?: string
          status?: Database["public"]["Enums"]["admission_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admissions_admitted_by_fkey"
            columns: ["admitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_attending_physician_id_fkey"
            columns: ["attending_physician_id"]
            isOneToOne: false
            referencedRelation: "physicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_discharged_by_fkey"
            columns: ["discharged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ambulance_fuel_records: {
        Row: {
          cost: number
          created_at: string
          fueled_at: string
          id: string
          liters: number
          odometer_km: number
          recorded_by: string | null
          vehicle_id: string
        }
        Insert: {
          cost?: number
          created_at?: string
          fueled_at?: string
          id?: string
          liters: number
          odometer_km?: number
          recorded_by?: string | null
          vehicle_id: string
        }
        Update: {
          cost?: number
          created_at?: string
          fueled_at?: string
          id?: string
          liters?: number
          odometer_km?: number
          recorded_by?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ambulance_fuel_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambulance_fuel_records_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "ambulance_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      ambulance_maintenance: {
        Row: {
          cost: number
          created_at: string
          id: string
          maintenance_type: string
          next_due_date: string | null
          notes: string | null
          performed_at: string
          performed_by: string | null
          vehicle_id: string
        }
        Insert: {
          cost?: number
          created_at?: string
          id?: string
          maintenance_type: string
          next_due_date?: string | null
          notes?: string | null
          performed_at?: string
          performed_by?: string | null
          vehicle_id: string
        }
        Update: {
          cost?: number
          created_at?: string
          id?: string
          maintenance_type?: string
          next_due_date?: string | null
          notes?: string | null
          performed_at?: string
          performed_by?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ambulance_maintenance_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambulance_maintenance_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "ambulance_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      ambulance_trips: {
        Row: {
          arrived_destination_at: string | null
          arrived_pickup_at: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          crew_names: string[]
          departed_pickup_at: string | null
          destination: string
          dispatched_at: string | null
          id: string
          notes: string | null
          patient_id: string
          pickup_location: string
          priority: string
          requested_at: string
          status: string
          trip_number: string
          updated_at: string
          updated_by: string | null
          vehicle_id: string | null
        }
        Insert: {
          arrived_destination_at?: string | null
          arrived_pickup_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          crew_names?: string[]
          departed_pickup_at?: string | null
          destination: string
          dispatched_at?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          pickup_location: string
          priority?: string
          requested_at?: string
          status?: string
          trip_number: string
          updated_at?: string
          updated_by?: string | null
          vehicle_id?: string | null
        }
        Update: {
          arrived_destination_at?: string | null
          arrived_pickup_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          crew_names?: string[]
          departed_pickup_at?: string | null
          destination?: string
          dispatched_at?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          pickup_location?: string
          priority?: string
          requested_at?: string
          status?: string
          trip_number?: string
          updated_at?: string
          updated_by?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ambulance_trips_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambulance_trips_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambulance_trips_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambulance_trips_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambulance_trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "ambulance_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      ambulance_vehicles: {
        Row: {
          created_at: string
          created_by: string | null
          crew_names: string[]
          driver_name: string | null
          fuel_level: number
          id: string
          last_service_date: string | null
          location: string
          next_service_due: string | null
          notes: string | null
          odometer_km: number
          plate_number: string
          status: string
          type: string
          updated_at: string
          updated_by: string | null
          vehicle_number: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          crew_names?: string[]
          driver_name?: string | null
          fuel_level?: number
          id?: string
          last_service_date?: string | null
          location?: string
          next_service_due?: string | null
          notes?: string | null
          odometer_km?: number
          plate_number: string
          status?: string
          type: string
          updated_at?: string
          updated_by?: string | null
          vehicle_number: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          crew_names?: string[]
          driver_name?: string | null
          fuel_level?: number
          id?: string
          last_service_date?: string | null
          location?: string
          next_service_due?: string | null
          notes?: string | null
          odometer_km?: number
          plate_number?: string
          status?: string
          type?: string
          updated_at?: string
          updated_by?: string | null
          vehicle_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "ambulance_vehicles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambulance_vehicles_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_number: string
          appointment_type: string | null
          created_at: string
          created_by: string
          department_id: string
          duration_minutes: number
          id: string
          notes: string | null
          patient_id: string
          physician_id: string | null
          reason_for_visit: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          appointment_number: string
          appointment_type?: string | null
          created_at?: string
          created_by: string
          department_id: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          patient_id: string
          physician_id?: string | null
          reason_for_visit?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          appointment_number?: string
          appointment_type?: string | null
          created_at?: string
          created_by?: string
          department_id?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          patient_id?: string
          physician_id?: string | null
          reason_for_visit?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_physician_id_fkey"
            columns: ["physician_id"]
            isOneToOne: false
            referencedRelation: "physicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          description: string | null
          entity_id: string | null
          entity_type: string
          id: number
          ip_address: unknown
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type: string
          id?: never
          ip_address?: unknown
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: never
          ip_address?: unknown
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      authorization_requests: {
        Row: {
          approved_at: string | null
          authorization_number: string
          created_at: string
          created_by: string
          diagnosis: string
          id: string
          notes: string | null
          patient_id: string
          policy_id: string
          procedure_name: string
          provider_id: string
          reference_number: string | null
          requested_at: string
          status: string
          updated_at: string
          updated_by: string | null
          valid_until: string | null
        }
        Insert: {
          approved_at?: string | null
          authorization_number: string
          created_at?: string
          created_by: string
          diagnosis: string
          id?: string
          notes?: string | null
          patient_id: string
          policy_id: string
          procedure_name: string
          provider_id: string
          reference_number?: string | null
          requested_at?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          valid_until?: string | null
        }
        Update: {
          approved_at?: string | null
          authorization_number?: string
          created_at?: string
          created_by?: string
          diagnosis?: string
          id?: string
          notes?: string | null
          patient_id?: string
          policy_id?: string
          procedure_name?: string
          provider_id?: string
          reference_number?: string | null
          requested_at?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "authorization_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authorization_requests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authorization_requests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authorization_requests_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "insurance_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authorization_requests_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "insurance_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authorization_requests_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      beds: {
        Row: {
          bed_number: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          room_id: string
          status: Database["public"]["Enums"]["bed_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          bed_number: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          room_id: string
          status?: Database["public"]["Enums"]["bed_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          bed_number?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          room_id?: string
          status?: Database["public"]["Enums"]["bed_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "beds_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beds_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beds_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blood_crossmatches: {
        Row: {
          created_at: string
          crossmatched_at: string | null
          crossmatched_by: string | null
          id: string
          notes: string | null
          request_id: string
          result: string
          unit_id: string
        }
        Insert: {
          created_at?: string
          crossmatched_at?: string | null
          crossmatched_by?: string | null
          id?: string
          notes?: string | null
          request_id: string
          result?: string
          unit_id: string
        }
        Update: {
          created_at?: string
          crossmatched_at?: string | null
          crossmatched_by?: string | null
          id?: string
          notes?: string | null
          request_id?: string
          result?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blood_crossmatches_crossmatched_by_fkey"
            columns: ["crossmatched_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blood_crossmatches_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "blood_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blood_crossmatches_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "blood_units"
            referencedColumns: ["id"]
          },
        ]
      }
      blood_donations: {
        Row: {
          blood_type: string
          collection_site: string
          created_at: string
          created_by: string | null
          donation_date: string
          donation_number: string
          donor_id: string
          id: string
          notes: string | null
          status: string
          units_collected: number
        }
        Insert: {
          blood_type: string
          collection_site?: string
          created_at?: string
          created_by?: string | null
          donation_date?: string
          donation_number: string
          donor_id: string
          id?: string
          notes?: string | null
          status?: string
          units_collected?: number
        }
        Update: {
          blood_type?: string
          collection_site?: string
          created_at?: string
          created_by?: string | null
          donation_date?: string
          donation_number?: string
          donor_id?: string
          id?: string
          notes?: string | null
          status?: string
          units_collected?: number
        }
        Relationships: [
          {
            foreignKeyName: "blood_donations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blood_donations_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "blood_donors"
            referencedColumns: ["id"]
          },
        ]
      }
      blood_donors: {
        Row: {
          address: string | null
          blood_type: string
          contact_number: string | null
          created_at: string
          created_by: string | null
          date_of_birth: string
          donor_number: string
          eligibility_status: string
          full_name: string
          id: string
          last_donation_date: string | null
          notes: string | null
          sex: string
          total_donations: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          blood_type: string
          contact_number?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth: string
          donor_number: string
          eligibility_status?: string
          full_name: string
          id?: string
          last_donation_date?: string | null
          notes?: string | null
          sex: string
          total_donations?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          blood_type?: string
          contact_number?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string
          donor_number?: string
          eligibility_status?: string
          full_name?: string
          id?: string
          last_donation_date?: string | null
          notes?: string | null
          sex?: string
          total_donations?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blood_donors_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blood_donors_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blood_issues: {
        Row: {
          id: string
          issued_at: string
          issued_by: string
          notes: string | null
          received_by_name: string
          request_id: string
          unit_id: string
        }
        Insert: {
          id?: string
          issued_at?: string
          issued_by: string
          notes?: string | null
          received_by_name: string
          request_id: string
          unit_id: string
        }
        Update: {
          id?: string
          issued_at?: string
          issued_by?: string
          notes?: string | null
          received_by_name?: string
          request_id?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blood_issues_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blood_issues_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "blood_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blood_issues_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: true
            referencedRelation: "blood_units"
            referencedColumns: ["id"]
          },
        ]
      }
      blood_requests: {
        Row: {
          blood_type: string
          component: string
          created_at: string
          created_by: string
          department_id: string | null
          id: string
          notes: string | null
          patient_id: string
          priority: string
          request_number: string
          required_by: string
          status: string
          units_fulfilled: number
          units_requested: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          blood_type: string
          component: string
          created_at?: string
          created_by: string
          department_id?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          priority?: string
          request_number: string
          required_by?: string
          status?: string
          units_fulfilled?: number
          units_requested: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          blood_type?: string
          component?: string
          created_at?: string
          created_by?: string
          department_id?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          priority?: string
          request_number?: string
          required_by?: string
          status?: string
          units_fulfilled?: number
          units_requested?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blood_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blood_requests_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blood_requests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blood_requests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blood_requests_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blood_screenings: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          result: string
          test_name: string
          tested_at: string | null
          tested_by: string | null
          unit_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          result?: string
          test_name: string
          tested_at?: string | null
          tested_by?: string | null
          unit_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          result?: string
          test_name?: string
          tested_at?: string | null
          tested_by?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blood_screenings_tested_by_fkey"
            columns: ["tested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blood_screenings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "blood_units"
            referencedColumns: ["id"]
          },
        ]
      }
      blood_units: {
        Row: {
          blood_type: string
          collection_date: string
          component: string
          created_at: string
          donation_id: string
          donor_id: string
          expiry_date: string
          id: string
          notes: string | null
          screening_status: string
          status: string
          storage_location: string
          unit_number: string
          updated_at: string
        }
        Insert: {
          blood_type: string
          collection_date: string
          component: string
          created_at?: string
          donation_id: string
          donor_id: string
          expiry_date: string
          id?: string
          notes?: string | null
          screening_status?: string
          status?: string
          storage_location?: string
          unit_number: string
          updated_at?: string
        }
        Update: {
          blood_type?: string
          collection_date?: string
          component?: string
          created_at?: string
          donation_id?: string
          donor_id?: string
          expiry_date?: string
          id?: string
          notes?: string | null
          screening_status?: string
          status?: string
          storage_location?: string
          unit_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blood_units_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "blood_donations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blood_units_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "blood_donors"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_requests: {
        Row: {
          assigned_staff_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          department_id: string | null
          disinfection_used: string | null
          due_at: string
          id: string
          location_label: string
          location_type: string
          notes: string | null
          priority: string
          request_number: string
          request_type: string
          requested_at: string
          scheduled_for: string
          started_at: string | null
          status: string
          updated_at: string
          updated_by: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          assigned_staff_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          department_id?: string | null
          disinfection_used?: string | null
          due_at?: string
          id?: string
          location_label: string
          location_type: string
          notes?: string | null
          priority?: string
          request_number: string
          request_type: string
          requested_at?: string
          scheduled_for?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          assigned_staff_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          department_id?: string | null
          disinfection_used?: string | null
          due_at?: string
          id?: string
          location_label?: string
          location_type?: string
          notes?: string | null
          priority?: string
          request_number?: string
          request_type?: string
          requested_at?: string
          scheduled_for?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_requests_assigned_staff_id_fkey"
            columns: ["assigned_staff_id"]
            isOneToOne: false
            referencedRelation: "housekeeping_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_requests_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_requests_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_requests_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_notes: {
        Row: {
          authored_by: string
          content: string
          created_at: string
          encounter_id: string
          finalized_at: string | null
          id: string
          note_type: string
          patient_id: string
          status: Database["public"]["Enums"]["clinical_note_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          authored_by: string
          content: string
          created_at?: string
          encounter_id: string
          finalized_at?: string | null
          id?: string
          note_type: string
          patient_id: string
          status?: Database["public"]["Enums"]["clinical_note_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          authored_by?: string
          content?: string
          created_at?: string
          encounter_id?: string
          finalized_at?: string | null
          id?: string
          note_type?: string
          patient_id?: string
          status?: Database["public"]["Enums"]["clinical_note_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_notes_authored_by_fkey"
            columns: ["authored_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_notes_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_notes_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coverage_verifications: {
        Row: {
          id: string
          notes: string | null
          policy_id: string
          reference_number: string
          status: string
          verified_at: string
          verified_by: string
        }
        Insert: {
          id?: string
          notes?: string | null
          policy_id: string
          reference_number: string
          status: string
          verified_at?: string
          verified_by: string
        }
        Update: {
          id?: string
          notes?: string | null
          policy_id?: string
          reference_number?: string
          status?: string
          verified_at?: string
          verified_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "coverage_verifications_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "insurance_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coverage_verifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnoses: {
        Row: {
          clinical_notes: string | null
          created_at: string
          diagnosis_code: string | null
          diagnosis_name: string
          diagnosis_type: string | null
          encounter_id: string
          id: string
          is_primary: boolean
          patient_id: string
          recorded_at: string
          recorded_by: string
        }
        Insert: {
          clinical_notes?: string | null
          created_at?: string
          diagnosis_code?: string | null
          diagnosis_name: string
          diagnosis_type?: string | null
          encounter_id: string
          id?: string
          is_primary?: boolean
          patient_id: string
          recorded_at?: string
          recorded_by: string
        }
        Update: {
          clinical_notes?: string | null
          created_at?: string
          diagnosis_code?: string | null
          diagnosis_name?: string
          diagnosis_type?: string | null
          encounter_id?: string
          id?: string
          is_primary?: boolean
          patient_id?: string
          recorded_at?: string
          recorded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnoses_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnoses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnoses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnoses_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_categories: {
        Row: {
          created_at: string
          description: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      dietary_orders: {
        Row: {
          allergies: string[]
          assessed_at: string
          assessment_notes: string | null
          category_id: string
          created_at: string
          id: string
          meal_schedule: string[]
          order_number: string
          ordered_by: string
          patient_id: string
          restrictions: string[]
          status: string
          therapeutic_diet_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allergies?: string[]
          assessed_at?: string
          assessment_notes?: string | null
          category_id: string
          created_at?: string
          id?: string
          meal_schedule?: string[]
          order_number: string
          ordered_by: string
          patient_id: string
          restrictions?: string[]
          status?: string
          therapeutic_diet_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allergies?: string[]
          assessed_at?: string
          assessment_notes?: string | null
          category_id?: string
          created_at?: string
          id?: string
          meal_schedule?: string[]
          order_number?: string
          ordered_by?: string
          patient_id?: string
          restrictions?: string[]
          status?: string
          therapeutic_diet_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dietary_orders_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "diet_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dietary_orders_ordered_by_fkey"
            columns: ["ordered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dietary_orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dietary_orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dietary_orders_therapeutic_diet_id_fkey"
            columns: ["therapeutic_diet_id"]
            isOneToOne: false
            referencedRelation: "therapeutic_diets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dietary_orders_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      disinfection_records: {
        Row: {
          chemical: string
          contact_time_minutes: number
          id: string
          method: string
          notes: string | null
          performed_at: string
          performed_by: string
          request_id: string
        }
        Insert: {
          chemical: string
          contact_time_minutes: number
          id?: string
          method: string
          notes?: string | null
          performed_at?: string
          performed_by: string
          request_id: string
        }
        Update: {
          chemical?: string
          contact_time_minutes?: number
          id?: string
          method?: string
          notes?: string | null
          performed_at?: string
          performed_by?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "disinfection_records_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disinfection_records_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "cleaning_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_contacts: {
        Row: {
          address: string | null
          contact_number: string
          created_at: string
          created_by: string | null
          full_name: string
          id: string
          is_primary: boolean
          patient_id: string
          relationship: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          contact_number: string
          created_at?: string
          created_by?: string | null
          full_name: string
          id?: string
          is_primary?: boolean
          patient_id: string
          relationship?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          contact_number?: string
          created_at?: string
          created_by?: string | null
          full_name?: string
          id?: string
          is_primary?: boolean
          patient_id?: string
          relationship?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_contacts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_contacts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_contacts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_visits: {
        Row: {
          arrival_at: string
          arrival_mode: Database["public"]["Enums"]["emergency_arrival_mode"]
          attending_physician_id: string | null
          chief_complaint: string
          created_at: string
          created_by: string
          disposition:
            | Database["public"]["Enums"]["emergency_disposition"]
            | null
          disposition_at: string | null
          encounter_id: string
          id: string
          patient_id: string
          status: Database["public"]["Enums"]["emergency_visit_status"]
          treatment_area: string | null
          triage_level: Database["public"]["Enums"]["emergency_triage_level"]
          triage_note: string | null
          triage_nurse_id: string | null
          triaged_at: string | null
          updated_at: string
          updated_by: string | null
          visit_number: string
        }
        Insert: {
          arrival_at?: string
          arrival_mode?: Database["public"]["Enums"]["emergency_arrival_mode"]
          attending_physician_id?: string | null
          chief_complaint: string
          created_at?: string
          created_by: string
          disposition?:
            | Database["public"]["Enums"]["emergency_disposition"]
            | null
          disposition_at?: string | null
          encounter_id: string
          id?: string
          patient_id: string
          status?: Database["public"]["Enums"]["emergency_visit_status"]
          treatment_area?: string | null
          triage_level?: Database["public"]["Enums"]["emergency_triage_level"]
          triage_note?: string | null
          triage_nurse_id?: string | null
          triaged_at?: string | null
          updated_at?: string
          updated_by?: string | null
          visit_number: string
        }
        Update: {
          arrival_at?: string
          arrival_mode?: Database["public"]["Enums"]["emergency_arrival_mode"]
          attending_physician_id?: string | null
          chief_complaint?: string
          created_at?: string
          created_by?: string
          disposition?:
            | Database["public"]["Enums"]["emergency_disposition"]
            | null
          disposition_at?: string | null
          encounter_id?: string
          id?: string
          patient_id?: string
          status?: Database["public"]["Enums"]["emergency_visit_status"]
          treatment_area?: string | null
          triage_level?: Database["public"]["Enums"]["emergency_triage_level"]
          triage_note?: string | null
          triage_nurse_id?: string | null
          triaged_at?: string | null
          updated_at?: string
          updated_by?: string | null
          visit_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_visits_attending_physician_id_fkey"
            columns: ["attending_physician_id"]
            isOneToOne: false
            referencedRelation: "physicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_visits_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_visits_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: true
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_visits_triage_nurse_id_fkey"
            columns: ["triage_nurse_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_visits_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      encounters: {
        Row: {
          admission_id: string | null
          appointment_id: string | null
          chief_complaint: string | null
          clinical_status: Database["public"]["Enums"]["encounter_status"]
          completed_at: string | null
          created_at: string
          created_by: string
          department_id: string
          encounter_number: string
          encounter_type: string
          id: string
          patient_id: string
          physician_id: string | null
          started_at: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          admission_id?: string | null
          appointment_id?: string | null
          chief_complaint?: string | null
          clinical_status?: Database["public"]["Enums"]["encounter_status"]
          completed_at?: string | null
          created_at?: string
          created_by: string
          department_id: string
          encounter_number: string
          encounter_type: string
          id?: string
          patient_id: string
          physician_id?: string | null
          started_at?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          admission_id?: string | null
          appointment_id?: string | null
          chief_complaint?: string | null
          clinical_status?: Database["public"]["Enums"]["encounter_status"]
          completed_at?: string | null
          created_at?: string
          created_by?: string
          department_id?: string
          encounter_number?: string
          encounter_type?: string
          id?: string
          patient_id?: string
          physician_id?: string | null
          started_at?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "encounters_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "admissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounters_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "v_admission_census"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounters_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounters_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "v_appointment_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounters_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounters_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounters_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounters_physician_id_fkey"
            columns: ["physician_id"]
            isOneToOne: false
            referencedRelation: "physicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounters_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_calibrations: {
        Row: {
          calibration_type: string
          certificate_number: string
          equipment_id: string
          id: string
          next_due_date: string | null
          notes: string | null
          performed_at: string
          performed_by: string | null
          result: string
        }
        Insert: {
          calibration_type: string
          certificate_number: string
          equipment_id: string
          id?: string
          next_due_date?: string | null
          notes?: string | null
          performed_at?: string
          performed_by?: string | null
          result: string
        }
        Update: {
          calibration_type?: string
          certificate_number?: string
          equipment_id?: string
          id?: string
          next_due_date?: string | null
          notes?: string | null
          performed_at?: string
          performed_by?: string | null
          result?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_calibrations_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "medical_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_calibrations_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_categories: {
        Row: {
          created_at: string
          description: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      equipment_maintenance_history: {
        Row: {
          cost: number
          equipment_id: string
          event_type: string
          id: string
          notes: string | null
          performed_at: string
          performed_by: string | null
          summary: string
        }
        Insert: {
          cost?: number
          equipment_id: string
          event_type: string
          id?: string
          notes?: string | null
          performed_at?: string
          performed_by?: string | null
          summary: string
        }
        Update: {
          cost?: number
          equipment_id?: string
          event_type?: string
          id?: string
          notes?: string | null
          performed_at?: string
          performed_by?: string | null
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_maintenance_history_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "medical_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_maintenance_history_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_maintenance_schedules: {
        Row: {
          created_at: string
          due_date: string
          equipment_id: string
          id: string
          interval_days: number
          maintenance_type: string
          status: string
        }
        Insert: {
          created_at?: string
          due_date: string
          equipment_id: string
          id?: string
          interval_days: number
          maintenance_type: string
          status?: string
        }
        Update: {
          created_at?: string
          due_date?: string
          equipment_id?: string
          id?: string
          interval_days?: number
          maintenance_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_maintenance_schedules_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "medical_equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_work_orders: {
        Row: {
          assigned_technician_id: string | null
          completed_at: string | null
          cost: number
          created_at: string
          equipment_id: string
          id: string
          issue_description: string
          notes: string | null
          parts_used: string | null
          priority: string
          requested_at: string
          requested_by: string
          resolution_notes: string | null
          scheduled_for: string | null
          status: string
          updated_at: string
          work_order_number: string
        }
        Insert: {
          assigned_technician_id?: string | null
          completed_at?: string | null
          cost?: number
          created_at?: string
          equipment_id: string
          id?: string
          issue_description: string
          notes?: string | null
          parts_used?: string | null
          priority?: string
          requested_at?: string
          requested_by: string
          resolution_notes?: string | null
          scheduled_for?: string | null
          status?: string
          updated_at?: string
          work_order_number: string
        }
        Update: {
          assigned_technician_id?: string | null
          completed_at?: string | null
          cost?: number
          created_at?: string
          equipment_id?: string
          id?: string
          issue_description?: string
          notes?: string | null
          parts_used?: string | null
          priority?: string
          requested_at?: string
          requested_by?: string
          resolution_notes?: string | null
          scheduled_for?: string | null
          status?: string
          updated_at?: string
          work_order_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_work_orders_assigned_technician_id_fkey"
            columns: ["assigned_technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_work_orders_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "medical_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_work_orders_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      housekeeping_staff: {
        Row: {
          completed_today: number
          contact_number: string | null
          created_at: string
          current_assignment: string | null
          id: string
          name: string
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          completed_today?: number
          contact_number?: string | null
          created_at?: string
          current_assignment?: string | null
          id?: string
          name: string
          role?: string
          status?: string
          updated_at?: string
        }
        Update: {
          completed_today?: number
          contact_number?: string | null
          created_at?: string
          current_assignment?: string | null
          id?: string
          name?: string
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      hr_attendance: {
        Row: {
          attendance_date: string
          created_at: string
          id: string
          note: string | null
          overtime_minutes: number
          staff_profile_id: string
          status: string
          time_in: string | null
          time_out: string | null
        }
        Insert: {
          attendance_date: string
          created_at?: string
          id?: string
          note?: string | null
          overtime_minutes?: number
          staff_profile_id: string
          status?: string
          time_in?: string | null
          time_out?: string | null
        }
        Update: {
          attendance_date?: string
          created_at?: string
          id?: string
          note?: string | null
          overtime_minutes?: number
          staff_profile_id?: string
          status?: string
          time_in?: string | null
          time_out?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_attendance_staff_profile_id_fkey"
            columns: ["staff_profile_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_credentials: {
        Row: {
          created_at: string
          credential_number: string
          credential_type: string
          expires_at: string | null
          id: string
          issued_at: string
          staff_profile_id: string
          status: string
        }
        Insert: {
          created_at?: string
          credential_number: string
          credential_type: string
          expires_at?: string | null
          id?: string
          issued_at: string
          staff_profile_id: string
          status?: string
        }
        Update: {
          created_at?: string
          credential_number?: string
          credential_type?: string
          expires_at?: string | null
          id?: string
          issued_at?: string
          staff_profile_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_credentials_staff_profile_id_fkey"
            columns: ["staff_profile_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_employee_details: {
        Row: {
          created_at: string
          created_by: string | null
          employment_status: string
          hire_date: string
          leave_balance: number
          license_expiry: string | null
          monthly_rate: number
          position: string
          staff_profile_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          employment_status?: string
          hire_date: string
          leave_balance?: number
          license_expiry?: string | null
          monthly_rate?: number
          position: string
          staff_profile_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          employment_status?: string
          hire_date?: string
          leave_balance?: number
          license_expiry?: string | null
          monthly_rate?: number
          position?: string
          staff_profile_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_employee_details_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_employee_details_staff_profile_id_fkey"
            columns: ["staff_profile_id"]
            isOneToOne: true
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_employee_details_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_leave_requests: {
        Row: {
          created_at: string
          days: number
          end_date: string
          id: string
          leave_type: string
          reason: string
          requested_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          staff_profile_id: string
          start_date: string
          status: string
        }
        Insert: {
          created_at?: string
          days: number
          end_date: string
          id?: string
          leave_type: string
          reason: string
          requested_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          staff_profile_id: string
          start_date: string
          status?: string
        }
        Update: {
          created_at?: string
          days?: number
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          staff_profile_id?: string
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_leave_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_leave_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_leave_requests_staff_profile_id_fkey"
            columns: ["staff_profile_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_payroll_entries: {
        Row: {
          allowances: number
          basic_pay: number
          created_at: string
          deductions: number
          gross_pay: number
          id: string
          net_pay: number
          overtime_pay: number
          payroll_period_id: string
          position: string
          staff_profile_id: string
          status: string
        }
        Insert: {
          allowances?: number
          basic_pay?: number
          created_at?: string
          deductions?: number
          gross_pay?: number
          id?: string
          net_pay?: number
          overtime_pay?: number
          payroll_period_id: string
          position: string
          staff_profile_id: string
          status?: string
        }
        Update: {
          allowances?: number
          basic_pay?: number
          created_at?: string
          deductions?: number
          gross_pay?: number
          id?: string
          net_pay?: number
          overtime_pay?: number
          payroll_period_id?: string
          position?: string
          staff_profile_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_payroll_entries_payroll_period_id_fkey"
            columns: ["payroll_period_id"]
            isOneToOne: false
            referencedRelation: "hr_payroll_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_payroll_entries_staff_profile_id_fkey"
            columns: ["staff_profile_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_payroll_periods: {
        Row: {
          created_at: string
          created_by: string
          deduction_rate: number
          id: string
          pay_date: string
          period_end: string
          period_start: string
          status: string
        }
        Insert: {
          created_at?: string
          created_by: string
          deduction_rate?: number
          id?: string
          pay_date: string
          period_end: string
          period_start: string
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          deduction_rate?: number
          id?: string
          pay_date?: string
          period_end?: string
          period_start?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_payroll_periods_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_shifts: {
        Row: {
          created_at: string
          created_by: string
          end_time: string
          id: string
          published: boolean
          shift_date: string
          shift_type: string
          staff_profile_id: string
          start_time: string
        }
        Insert: {
          created_at?: string
          created_by: string
          end_time: string
          id?: string
          published?: boolean
          shift_date: string
          shift_type: string
          staff_profile_id: string
          start_time: string
        }
        Update: {
          created_at?: string
          created_by?: string
          end_time?: string
          id?: string
          published?: boolean
          shift_date?: string
          shift_type?: string
          staff_profile_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_shifts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_shifts_staff_profile_id_fkey"
            columns: ["staff_profile_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_benefits: {
        Row: {
          case_rate: number
          coverage_type: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          provider_id: string
        }
        Insert: {
          case_rate?: number
          coverage_type: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          provider_id: string
        }
        Update: {
          case_rate?: number
          coverage_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_benefits_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "insurance_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_claim_events: {
        Row: {
          actor_id: string | null
          claim_id: string
          created_at: string
          description: string
          event_type: string
          id: string
        }
        Insert: {
          actor_id?: string | null
          claim_id: string
          created_at?: string
          description: string
          event_type: string
          id?: string
        }
        Update: {
          actor_id?: string | null
          claim_id?: string
          created_at?: string
          description?: string
          event_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_claim_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_claim_events_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "insurance_claims"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_claim_lines: {
        Row: {
          claim_id: string
          description: string
          id: string
          line_total: number
          quantity: number
          unit_amount: number
        }
        Insert: {
          claim_id: string
          description: string
          id?: string
          line_total?: number
          quantity?: number
          unit_amount?: number
        }
        Update: {
          claim_id?: string
          description?: string
          id?: string
          line_total?: number
          quantity?: number
          unit_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "insurance_claim_lines_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "insurance_claims"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_claims: {
        Row: {
          adjudicated_at: string | null
          amount_approved: number
          amount_claimed: number
          amount_paid: number
          authorization_id: string | null
          claim_number: string
          claim_type: string
          created_at: string
          created_by: string
          diagnosis: string
          id: string
          notes: string | null
          paid_at: string | null
          patient_id: string
          policy_id: string
          provider_id: string
          status: string
          submitted_at: string | null
          total_charged: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          adjudicated_at?: string | null
          amount_approved?: number
          amount_claimed?: number
          amount_paid?: number
          authorization_id?: string | null
          claim_number: string
          claim_type: string
          created_at?: string
          created_by: string
          diagnosis: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          patient_id: string
          policy_id: string
          provider_id: string
          status?: string
          submitted_at?: string | null
          total_charged?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          adjudicated_at?: string | null
          amount_approved?: number
          amount_claimed?: number
          amount_paid?: number
          authorization_id?: string | null
          claim_number?: string
          claim_type?: string
          created_at?: string
          created_by?: string
          diagnosis?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          patient_id?: string
          policy_id?: string
          provider_id?: string
          status?: string
          submitted_at?: string | null
          total_charged?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_claims_authorization_id_fkey"
            columns: ["authorization_id"]
            isOneToOne: false
            referencedRelation: "authorization_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_claims_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_claims_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_claims_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_claims_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "insurance_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_claims_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "insurance_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_claims_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_policies: {
        Row: {
          coverage_type: string
          created_at: string
          created_by: string | null
          effective_date: string
          expiry_date: string
          id: string
          last_verified_at: string | null
          member_number: string
          notes: string | null
          patient_id: string
          policy_number: string
          provider_id: string
          status: string
          updated_at: string
          updated_by: string | null
          verification_status: string
        }
        Insert: {
          coverage_type: string
          created_at?: string
          created_by?: string | null
          effective_date: string
          expiry_date: string
          id?: string
          last_verified_at?: string | null
          member_number: string
          notes?: string | null
          patient_id: string
          policy_number: string
          provider_id: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          verification_status?: string
        }
        Update: {
          coverage_type?: string
          created_at?: string
          created_by?: string | null
          effective_date?: string
          expiry_date?: string
          id?: string
          last_verified_at?: string | null
          member_number?: string
          notes?: string | null
          patient_id?: string
          policy_number?: string
          provider_id?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_policies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_policies_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_policies_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_policies_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "insurance_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_policies_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_providers: {
        Row: {
          code: string
          contact_number: string | null
          created_at: string
          created_by: string | null
          id: string
          integration_status: string
          is_active: boolean
          name: string
          type: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          code: string
          contact_number?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          integration_status?: string
          is_active?: boolean
          name: string
          type: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          code?: string
          contact_number?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          integration_status?: string
          is_active?: boolean
          name?: string
          type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_providers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_providers_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_batches: {
        Row: {
          batch_number: string | null
          created_at: string
          created_by: string | null
          expiration_date: string | null
          id: string
          item_id: string
          quantity_received: number
          quantity_remaining: number
          received_at: string
          unit_cost: number | null
        }
        Insert: {
          batch_number?: string | null
          created_at?: string
          created_by?: string | null
          expiration_date?: string | null
          id?: string
          item_id: string
          quantity_received?: number
          quantity_remaining?: number
          received_at?: string
          unit_cost?: number | null
        }
        Update: {
          batch_number?: string | null
          created_at?: string
          created_by?: string | null
          expiration_date?: string | null
          id?: string
          item_id?: string
          quantity_received?: number
          quantity_remaining?: number
          received_at?: string
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_batches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_categories: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_categories_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          item_code: string
          name: string
          reorder_level: number
          unit: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          item_code: string
          name: string
          reorder_level?: number
          unit: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          item_code?: string
          name?: string
          reorder_level?: number
          unit?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          line_total: number
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          line_total: number
          quantity: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          line_total?: number
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "v_billing_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          admission_id: string | null
          amount_paid: number
          balance: number
          created_at: string
          created_by: string
          discount_amount: number
          encounter_id: string | null
          id: string
          invoice_date: string
          invoice_number: string
          patient_id: string
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          total_amount: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          admission_id?: string | null
          amount_paid?: number
          balance?: number
          created_at?: string
          created_by: string
          discount_amount?: number
          encounter_id?: string | null
          id?: string
          invoice_date?: string
          invoice_number: string
          patient_id: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          total_amount?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          admission_id?: string | null
          amount_paid?: number
          balance?: number
          created_at?: string
          created_by?: string
          discount_amount?: number
          encounter_id?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          patient_id?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          total_amount?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "admissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "v_admission_census"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      laboratory_order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          status: string
          test_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          status?: string
          test_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          status?: string
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "laboratory_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "laboratory_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laboratory_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_laboratory_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laboratory_order_items_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "laboratory_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      laboratory_orders: {
        Row: {
          created_at: string
          encounter_id: string
          id: string
          order_number: string
          ordered_at: string
          ordered_by: string
          patient_id: string
          priority: Database["public"]["Enums"]["laboratory_priority"]
          status: Database["public"]["Enums"]["laboratory_order_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          encounter_id: string
          id?: string
          order_number: string
          ordered_at?: string
          ordered_by: string
          patient_id: string
          priority?: Database["public"]["Enums"]["laboratory_priority"]
          status?: Database["public"]["Enums"]["laboratory_order_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          encounter_id?: string
          id?: string
          order_number?: string
          ordered_at?: string
          ordered_by?: string
          patient_id?: string
          priority?: Database["public"]["Enums"]["laboratory_priority"]
          status?: Database["public"]["Enums"]["laboratory_order_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "laboratory_orders_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laboratory_orders_ordered_by_fkey"
            columns: ["ordered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laboratory_orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laboratory_orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laboratory_orders_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      laboratory_results: {
        Row: {
          created_at: string
          id: string
          interpretation: string | null
          order_item_id: string
          performed_at: string | null
          performed_by: string | null
          reference_range: string | null
          result_unit: string | null
          result_value: string | null
          updated_at: string
          updated_by: string | null
          verification_status: Database["public"]["Enums"]["laboratory_verification_status"]
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          interpretation?: string | null
          order_item_id: string
          performed_at?: string | null
          performed_by?: string | null
          reference_range?: string | null
          result_unit?: string | null
          result_value?: string | null
          updated_at?: string
          updated_by?: string | null
          verification_status?: Database["public"]["Enums"]["laboratory_verification_status"]
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          interpretation?: string | null
          order_item_id?: string
          performed_at?: string | null
          performed_by?: string | null
          reference_range?: string | null
          result_unit?: string | null
          result_value?: string | null
          updated_at?: string
          updated_by?: string | null
          verification_status?: Database["public"]["Enums"]["laboratory_verification_status"]
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "laboratory_results_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "laboratory_order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laboratory_results_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laboratory_results_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laboratory_results_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      laboratory_specimens: {
        Row: {
          collected_at: string | null
          collected_by: string | null
          collection_status: Database["public"]["Enums"]["laboratory_specimen_status"]
          created_at: string
          id: string
          notes: string | null
          order_id: string
          specimen_type: string
        }
        Insert: {
          collected_at?: string | null
          collected_by?: string | null
          collection_status?: Database["public"]["Enums"]["laboratory_specimen_status"]
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          specimen_type: string
        }
        Update: {
          collected_at?: string | null
          collected_by?: string | null
          collection_status?: Database["public"]["Enums"]["laboratory_specimen_status"]
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          specimen_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "laboratory_specimens_collected_by_fkey"
            columns: ["collected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laboratory_specimens_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "laboratory_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laboratory_specimens_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_laboratory_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      laboratory_tests: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          specimen_type: string | null
          test_code: string
          test_name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          specimen_type?: string | null
          test_code: string
          test_name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          specimen_type?: string | null
          test_code?: string
          test_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "laboratory_tests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laboratory_tests_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_orders: {
        Row: {
          allergens: string[]
          bed: string
          created_at: string
          delivered_at: string | null
          delivered_by: string | null
          dietary_order_id: string
          id: string
          meal_number: string
          meal_type: string
          notes: string | null
          patient_id: string
          prepared_by: string | null
          room: string
          scheduled_for: string
          status: string
          updated_at: string
          ward: string
        }
        Insert: {
          allergens?: string[]
          bed?: string
          created_at?: string
          delivered_at?: string | null
          delivered_by?: string | null
          dietary_order_id: string
          id?: string
          meal_number: string
          meal_type: string
          notes?: string | null
          patient_id: string
          prepared_by?: string | null
          room?: string
          scheduled_for: string
          status?: string
          updated_at?: string
          ward?: string
        }
        Update: {
          allergens?: string[]
          bed?: string
          created_at?: string
          delivered_at?: string | null
          delivered_by?: string | null
          dietary_order_id?: string
          id?: string
          meal_number?: string
          meal_type?: string
          notes?: string | null
          patient_id?: string
          prepared_by?: string | null
          room?: string
          scheduled_for?: string
          status?: string
          updated_at?: string
          ward?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_orders_delivered_by_fkey"
            columns: ["delivered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_orders_dietary_order_id_fkey"
            columns: ["dietary_order_id"]
            isOneToOne: false
            referencedRelation: "dietary_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_orders_prepared_by_fkey"
            columns: ["prepared_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_equipment: {
        Row: {
          asset_number: string
          category_id: string | null
          created_at: string
          created_by: string | null
          department_id: string | null
          id: string
          is_active: boolean
          location: string
          manufacturer: string
          model: string
          name: string
          next_calibration_due: string | null
          next_maintenance_due: string | null
          notes: string | null
          purchase_date: string | null
          serial_number: string
          status: string
          updated_at: string
          updated_by: string | null
          warranty_expiry: string | null
        }
        Insert: {
          asset_number: string
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          id?: string
          is_active?: boolean
          location?: string
          manufacturer?: string
          model?: string
          name: string
          next_calibration_due?: string | null
          next_maintenance_due?: string | null
          notes?: string | null
          purchase_date?: string | null
          serial_number: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          warranty_expiry?: string | null
        }
        Update: {
          asset_number?: string
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          id?: string
          is_active?: boolean
          location?: string
          manufacturer?: string
          model?: string
          name?: string
          next_calibration_due?: string | null
          next_maintenance_due?: string | null
          notes?: string | null
          purchase_date?: string | null
          serial_number?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_equipment_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "equipment_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_equipment_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_equipment_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_equipment_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_histories: {
        Row: {
          created_at: string
          description: string
          history_type: string
          id: string
          patient_id: string
          recorded_at: string
          recorded_by: string
        }
        Insert: {
          created_at?: string
          description: string
          history_type: string
          id?: string
          patient_id: string
          recorded_at?: string
          recorded_by: string
        }
        Update: {
          created_at?: string
          description?: string
          history_type?: string
          id?: string
          patient_id?: string
          recorded_at?: string
          recorded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_histories_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_histories_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_histories_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_dispenses: {
        Row: {
          created_at: string
          dispensed_at: string
          dispensed_by: string
          id: string
          notes: string | null
          prescription_item_id: string
          quantity_dispensed: number
        }
        Insert: {
          created_at?: string
          dispensed_at?: string
          dispensed_by: string
          id?: string
          notes?: string | null
          prescription_item_id: string
          quantity_dispensed: number
        }
        Update: {
          created_at?: string
          dispensed_at?: string
          dispensed_by?: string
          id?: string
          notes?: string | null
          prescription_item_id?: string
          quantity_dispensed?: number
        }
        Relationships: [
          {
            foreignKeyName: "medication_dispenses_dispensed_by_fkey"
            columns: ["dispensed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_dispenses_prescription_item_id_fkey"
            columns: ["prescription_item_id"]
            isOneToOne: false
            referencedRelation: "prescription_items"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_stock: {
        Row: {
          inventory_item_id: string
          medication_id: string
        }
        Insert: {
          inventory_item_id: string
          medication_id: string
        }
        Update: {
          inventory_item_id?: string
          medication_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_stock_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: true
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_stock_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: true
            referencedRelation: "v_inventory_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_stock_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: true
            referencedRelation: "medication_stock_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_stock_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: true
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          brand_name: string | null
          created_at: string
          created_by: string | null
          description: string | null
          dosage_form: string | null
          generic_name: string
          id: string
          is_active: boolean
          medication_code: string
          strength: string | null
          unit: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          brand_name?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          dosage_form?: string | null
          generic_name: string
          id?: string
          is_active?: boolean
          medication_code: string
          strength?: string | null
          unit?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          brand_name?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          dosage_form?: string | null
          generic_name?: string
          id?: string
          is_active?: boolean
          medication_code?: string
          strength?: string | null
          unit?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medications_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mortuary_access_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          notes: string | null
          record_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          record_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mortuary_access_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mortuary_access_log_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "mortuary_records"
            referencedColumns: ["id"]
          },
        ]
      }
      mortuary_records: {
        Row: {
          admitted_at: string
          body_tag_number: string
          case_number: string
          created_at: string
          created_by: string
          declared_at: string
          id: string
          identification_status: string
          next_of_kin_contact: string | null
          next_of_kin_name: string | null
          next_of_kin_relationship: string | null
          next_of_kin_verified: boolean
          notes: string | null
          patient_id: string
          place_of_death: string
          release_authorized_by: string | null
          release_document_reference: string | null
          released_at: string | null
          released_to_name: string | null
          status: string
          storage_unit_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          admitted_at?: string
          body_tag_number: string
          case_number: string
          created_at?: string
          created_by: string
          declared_at?: string
          id?: string
          identification_status?: string
          next_of_kin_contact?: string | null
          next_of_kin_name?: string | null
          next_of_kin_relationship?: string | null
          next_of_kin_verified?: boolean
          notes?: string | null
          patient_id: string
          place_of_death?: string
          release_authorized_by?: string | null
          release_document_reference?: string | null
          released_at?: string | null
          released_to_name?: string | null
          status?: string
          storage_unit_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          admitted_at?: string
          body_tag_number?: string
          case_number?: string
          created_at?: string
          created_by?: string
          declared_at?: string
          id?: string
          identification_status?: string
          next_of_kin_contact?: string | null
          next_of_kin_name?: string | null
          next_of_kin_relationship?: string | null
          next_of_kin_verified?: boolean
          notes?: string | null
          patient_id?: string
          place_of_death?: string
          release_authorized_by?: string | null
          release_document_reference?: string | null
          released_at?: string | null
          released_to_name?: string | null
          status?: string
          storage_unit_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mortuary_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mortuary_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mortuary_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mortuary_records_release_authorized_by_fkey"
            columns: ["release_authorized_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mortuary_records_storage_unit_id_fkey"
            columns: ["storage_unit_id"]
            isOneToOne: false
            referencedRelation: "mortuary_storage_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mortuary_records_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mortuary_releases: {
        Row: {
          authorized_at: string | null
          authorized_by: string | null
          document_reference: string | null
          id: string
          notes: string | null
          record_id: string
          relationship: string | null
          released_at: string | null
          released_to_name: string | null
          requested_at: string
          status: string
        }
        Insert: {
          authorized_at?: string | null
          authorized_by?: string | null
          document_reference?: string | null
          id?: string
          notes?: string | null
          record_id: string
          relationship?: string | null
          released_at?: string | null
          released_to_name?: string | null
          requested_at?: string
          status?: string
        }
        Update: {
          authorized_at?: string | null
          authorized_by?: string | null
          document_reference?: string | null
          id?: string
          notes?: string | null
          record_id?: string
          relationship?: string | null
          released_at?: string | null
          released_to_name?: string | null
          requested_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "mortuary_releases_authorized_by_fkey"
            columns: ["authorized_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mortuary_releases_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: true
            referencedRelation: "mortuary_records"
            referencedColumns: ["id"]
          },
        ]
      }
      mortuary_storage_units: {
        Row: {
          created_at: string
          current_record_id: string | null
          id: string
          location: string
          status: string
          unit_number: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_record_id?: string | null
          id?: string
          location?: string
          status?: string
          unit_number: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_record_id?: string | null
          id?: string
          location?: string
          status?: string
          unit_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mortuary_storage_units_current_record_fkey"
            columns: ["current_record_id"]
            isOneToOne: false
            referencedRelation: "mortuary_records"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_email_deliveries: {
        Row: {
          accepted_at: string | null
          claimed_at: string
          notification_id: string
        }
        Insert: {
          accepted_at?: string | null
          claimed_at?: string
          notification_id: string
        }
        Update: {
          accepted_at?: string | null
          claimed_at?: string
          notification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_email_deliveries_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: true
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          category: string
          in_app: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          in_app?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          in_app?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          notification_type: string
          read_at: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          severity: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          notification_type: string
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          severity?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          notification_type?: string
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          severity?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nursing_assessments: {
        Row: {
          assessed_at: string
          assessed_by: string
          assessment_data: Json
          assessment_type: string
          created_at: string
          encounter_id: string
          id: string
          notes: string | null
          patient_id: string
        }
        Insert: {
          assessed_at?: string
          assessed_by: string
          assessment_data?: Json
          assessment_type: string
          created_at?: string
          encounter_id: string
          id?: string
          notes?: string | null
          patient_id: string
        }
        Update: {
          assessed_at?: string
          assessed_by?: string
          assessment_data?: Json
          assessment_type?: string
          created_at?: string
          encounter_id?: string
          id?: string
          notes?: string | null
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nursing_assessments_assessed_by_fkey"
            columns: ["assessed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nursing_assessments_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nursing_assessments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nursing_assessments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      nursing_notes: {
        Row: {
          created_at: string
          encounter_id: string
          id: string
          note: string
          patient_id: string
          recorded_at: string
          recorded_by: string
        }
        Insert: {
          created_at?: string
          encounter_id: string
          id?: string
          note: string
          patient_id: string
          recorded_at?: string
          recorded_by: string
        }
        Update: {
          created_at?: string
          encounter_id?: string
          id?: string
          note?: string
          patient_id?: string
          recorded_at?: string
          recorded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "nursing_notes_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nursing_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nursing_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nursing_notes_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      operating_rooms: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          notes: string | null
          room_name: string
          status: Database["public"]["Enums"]["operating_room_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          notes?: string | null
          room_name: string
          status?: Database["public"]["Enums"]["operating_room_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          notes?: string | null
          room_name?: string
          status?: Database["public"]["Enums"]["operating_room_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operating_rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operating_rooms_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operating_rooms_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_allergies: {
        Row: {
          allergen: string
          created_at: string
          id: string
          notes: string | null
          patient_id: string
          reaction: string | null
          recorded_by: string
          severity: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allergen: string
          created_at?: string
          id?: string
          notes?: string | null
          patient_id: string
          reaction?: string | null
          recorded_by: string
          severity?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allergen?: string
          created_at?: string
          id?: string
          notes?: string | null
          patient_id?: string
          reaction?: string | null
          recorded_by?: string
          severity?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_allergies_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_allergies_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_allergies_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_allergies_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_care_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          assignment_type: string
          ended_at: string | null
          id: string
          patient_id: string
          staff_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          assignment_type: string
          ended_at?: string | null
          id?: string
          patient_id: string
          staff_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          assignment_type?: string
          ended_at?: string | null
          id?: string
          patient_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_care_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_care_assignments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_care_assignments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_care_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_transfers: {
        Row: {
          admission_id: string
          created_at: string
          from_bed_id: string | null
          id: string
          to_bed_id: string
          transfer_reason: string | null
          transferred_at: string
          transferred_by: string
        }
        Insert: {
          admission_id: string
          created_at?: string
          from_bed_id?: string | null
          id?: string
          to_bed_id: string
          transfer_reason?: string | null
          transferred_at?: string
          transferred_by: string
        }
        Update: {
          admission_id?: string
          created_at?: string
          from_bed_id?: string | null
          id?: string
          to_bed_id?: string
          transfer_reason?: string | null
          transferred_at?: string
          transferred_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_transfers_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "admissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_transfers_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "v_admission_census"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_transfers_from_bed_id_fkey"
            columns: ["from_bed_id"]
            isOneToOne: false
            referencedRelation: "beds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_transfers_from_bed_id_fkey"
            columns: ["from_bed_id"]
            isOneToOne: false
            referencedRelation: "v_bed_availability"
            referencedColumns: ["bed_id"]
          },
          {
            foreignKeyName: "patient_transfers_to_bed_id_fkey"
            columns: ["to_bed_id"]
            isOneToOne: false
            referencedRelation: "beds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_transfers_to_bed_id_fkey"
            columns: ["to_bed_id"]
            isOneToOne: false
            referencedRelation: "v_bed_availability"
            referencedColumns: ["bed_id"]
          },
          {
            foreignKeyName: "patient_transfers_transferred_by_fkey"
            columns: ["transferred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address_line: string | null
          barangay: string | null
          city: string | null
          civil_status: string | null
          contact_number: string | null
          created_at: string
          created_by: string
          date_of_birth: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          medical_record_number: string
          middle_name: string | null
          nationality: string | null
          postal_code: string | null
          province: string | null
          registration_date: string
          registration_status: Database["public"]["Enums"]["patient_registration_status"]
          sex: string | null
          suffix: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address_line?: string | null
          barangay?: string | null
          city?: string | null
          civil_status?: string | null
          contact_number?: string | null
          created_at?: string
          created_by: string
          date_of_birth?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          medical_record_number: string
          middle_name?: string | null
          nationality?: string | null
          postal_code?: string | null
          province?: string | null
          registration_date?: string
          registration_status?: Database["public"]["Enums"]["patient_registration_status"]
          sex?: string | null
          suffix?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address_line?: string | null
          barangay?: string | null
          city?: string | null
          civil_status?: string | null
          contact_number?: string | null
          created_at?: string
          created_by?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          medical_record_number?: string
          middle_name?: string | null
          nationality?: string | null
          postal_code?: string | null
          province?: string | null
          registration_date?: string
          registration_status?: Database["public"]["Enums"]["patient_registration_status"]
          sex?: string | null
          suffix?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          notes: string | null
          payment_method: string
          payment_reference: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          received_at: string
          received_by: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          notes?: string | null
          payment_method: string
          payment_reference: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          received_at?: string
          received_by: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_method?: string
          payment_reference?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          received_at?: string
          received_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "v_billing_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          slug?: string
        }
        Relationships: []
      }
      physicians: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_available: boolean
          license_number: string
          specialty: string | null
          staff_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_available?: boolean
          license_number: string
          specialty?: string | null
          staff_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_available?: boolean
          license_number?: string
          specialty?: string | null
          staff_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "physicians_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physicians_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: true
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physicians_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prescription_items: {
        Row: {
          created_at: string
          dosage: string
          duration_days: number | null
          frequency: string
          id: string
          instructions: string | null
          medication_id: string
          prescription_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          dosage: string
          duration_days?: number | null
          frequency: string
          id?: string
          instructions?: string | null
          medication_id: string
          prescription_id: string
          quantity: number
        }
        Update: {
          created_at?: string
          dosage?: string
          duration_days?: number | null
          frequency?: string
          id?: string
          instructions?: string | null
          medication_id?: string
          prescription_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "prescription_items_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medication_stock_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_items_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_items_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_items_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "v_pharmacy_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          created_at: string
          encounter_id: string
          id: string
          notes: string | null
          patient_id: string
          prescribed_by: string
          prescription_date: string
          prescription_number: string
          status: Database["public"]["Enums"]["prescription_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          encounter_id: string
          id?: string
          notes?: string | null
          patient_id: string
          prescribed_by: string
          prescription_date?: string
          prescription_number: string
          status?: Database["public"]["Enums"]["prescription_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          encounter_id?: string
          id?: string
          notes?: string | null
          patient_id?: string
          prescribed_by?: string
          prescription_date?: string
          prescription_number?: string
          status?: Database["public"]["Enums"]["prescription_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_prescribed_by_fkey"
            columns: ["prescribed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          contact_number: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          contact_number?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          contact_number?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      radiology_orders: {
        Row: {
          body_part: string | null
          created_at: string
          encounter_id: string
          examination_type: string
          id: string
          order_number: string
          ordered_by: string
          patient_id: string
          scheduled_at: string | null
          status: Database["public"]["Enums"]["radiology_order_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body_part?: string | null
          created_at?: string
          encounter_id: string
          examination_type: string
          id?: string
          order_number: string
          ordered_by: string
          patient_id: string
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["radiology_order_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body_part?: string | null
          created_at?: string
          encounter_id?: string
          examination_type?: string
          id?: string
          order_number?: string
          ordered_by?: string
          patient_id?: string
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["radiology_order_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "radiology_orders_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "radiology_orders_ordered_by_fkey"
            columns: ["ordered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "radiology_orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "radiology_orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "radiology_orders_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      radiology_reports: {
        Row: {
          created_at: string
          id: string
          order_id: string
          report_content: string | null
          report_status: Database["public"]["Enums"]["radiology_report_status"]
          reported_at: string | null
          reported_by: string | null
          updated_at: string
          updated_by: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          report_content?: string | null
          report_status?: Database["public"]["Enums"]["radiology_report_status"]
          reported_at?: string | null
          reported_by?: string | null
          updated_at?: string
          updated_by?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          report_content?: string | null
          report_status?: Database["public"]["Enums"]["radiology_report_status"]
          reported_at?: string | null
          reported_by?: string | null
          updated_at?: string
          updated_by?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "radiology_reports_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "radiology_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "radiology_reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "radiology_reports_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "radiology_reports_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reference_sequences: {
        Row: {
          created_at: string
          last_value: number
          prefix: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          last_value?: number
          prefix: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          last_value?: number
          prefix?: string
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          floor_number: string | null
          id: string
          is_active: boolean
          room_number: string
          room_type: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          floor_number?: string | null
          id?: string
          is_active?: boolean
          room_number: string
          room_type?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          floor_number?: string | null
          id?: string
          is_active?: boolean
          room_number?: string
          room_type?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_announcements: {
        Row: {
          audience: string
          body: string
          created_at: string
          created_by: string | null
          department_id: string | null
          expires_at: string | null
          id: string
          pinned: boolean
          published_at: string | null
          published_by: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          audience?: string
          body: string
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          expires_at?: string | null
          id?: string
          pinned?: boolean
          published_at?: string | null
          published_by?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string
          body?: string
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          expires_at?: string | null
          id?: string
          pinned?: boolean
          published_at?: string | null
          published_by?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_announcements_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_announcements_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_department_assignments: {
        Row: {
          assigned_at: string
          created_at: string
          created_by: string | null
          department_id: string
          ended_at: string | null
          id: string
          staff_id: string
        }
        Insert: {
          assigned_at?: string
          created_at?: string
          created_by?: string | null
          department_id: string
          ended_at?: string | null
          id?: string
          staff_id: string
        }
        Update: {
          assigned_at?: string
          created_at?: string
          created_by?: string | null
          department_id?: string
          ended_at?: string | null
          id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_department_assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_department_assignments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_department_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_profiles: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string | null
          employment_type: string | null
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          middle_name: string | null
          professional_license_number: string | null
          staff_number: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          employment_type?: string | null
          first_name: string
          id?: string
          is_active?: boolean
          last_name: string
          middle_name?: string | null
          professional_license_number?: string | null
          staff_number: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          employment_type?: string | null
          first_name?: string
          id?: string
          is_active?: boolean
          last_name?: string
          middle_name?: string | null
          professional_license_number?: string | null
          staff_number?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_profiles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_profiles_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transactions: {
        Row: {
          batch_id: string | null
          created_at: string
          id: string
          item_id: string
          performed_at: string
          performed_by: string
          quantity: number
          reason: string | null
          reference_id: string | null
          reference_type: string | null
          transaction_type: Database["public"]["Enums"]["stock_transaction_type"]
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          id?: string
          item_id: string
          performed_at?: string
          performed_by: string
          quantity: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          transaction_type: Database["public"]["Enums"]["stock_transaction_type"]
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          id?: string
          item_id?: string
          performed_at?: string
          performed_by?: string
          quantity?: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          transaction_type?: Database["public"]["Enums"]["stock_transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "stock_transactions_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "inventory_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transactions_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      surgery_cases: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          anesthesia_type: Database["public"]["Enums"]["anesthesia_type"] | null
          anesthesiologist_id: string | null
          case_number: string
          circulating_nurse_id: string | null
          consent_signed: boolean
          created_at: string
          created_by: string
          id: string
          notes: string | null
          patient_id: string
          pre_op_completed: boolean
          priority: Database["public"]["Enums"]["surgery_priority"]
          procedure_code: string
          procedure_name: string
          room_id: string
          safety_checklist_completed: boolean
          scheduled_end: string
          scheduled_start: string
          scrub_nurse_id: string | null
          status: Database["public"]["Enums"]["surgery_status"]
          surgeon_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          anesthesia_type?:
            | Database["public"]["Enums"]["anesthesia_type"]
            | null
          anesthesiologist_id?: string | null
          case_number: string
          circulating_nurse_id?: string | null
          consent_signed?: boolean
          created_at?: string
          created_by: string
          id?: string
          notes?: string | null
          patient_id: string
          pre_op_completed?: boolean
          priority?: Database["public"]["Enums"]["surgery_priority"]
          procedure_code: string
          procedure_name: string
          room_id: string
          safety_checklist_completed?: boolean
          scheduled_end: string
          scheduled_start: string
          scrub_nurse_id?: string | null
          status?: Database["public"]["Enums"]["surgery_status"]
          surgeon_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          anesthesia_type?:
            | Database["public"]["Enums"]["anesthesia_type"]
            | null
          anesthesiologist_id?: string | null
          case_number?: string
          circulating_nurse_id?: string | null
          consent_signed?: boolean
          created_at?: string
          created_by?: string
          id?: string
          notes?: string | null
          patient_id?: string
          pre_op_completed?: boolean
          priority?: Database["public"]["Enums"]["surgery_priority"]
          procedure_code?: string
          procedure_name?: string
          room_id?: string
          safety_checklist_completed?: boolean
          scheduled_end?: string
          scheduled_start?: string
          scrub_nurse_id?: string | null
          status?: Database["public"]["Enums"]["surgery_status"]
          surgeon_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "surgery_cases_anesthesiologist_id_fkey"
            columns: ["anesthesiologist_id"]
            isOneToOne: false
            referencedRelation: "physicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surgery_cases_circulating_nurse_id_fkey"
            columns: ["circulating_nurse_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surgery_cases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surgery_cases_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surgery_cases_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surgery_cases_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "operating_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surgery_cases_scrub_nurse_id_fkey"
            columns: ["scrub_nurse_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surgery_cases_surgeon_id_fkey"
            columns: ["surgeon_id"]
            isOneToOne: false
            referencedRelation: "physicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surgery_cases_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      therapeutic_diets: {
        Row: {
          category_id: string
          created_at: string
          id: string
          indication: string
          is_active: boolean
          name: string
          restrictions: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          indication?: string
          is_active?: boolean
          name: string
          restrictions?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          indication?: string
          is_active?: boolean
          name?: string
          restrictions?: string
        }
        Relationships: [
          {
            foreignKeyName: "therapeutic_diets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "diet_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      transfusion_records: {
        Row: {
          id: string
          reaction_notes: string | null
          reaction_severity: string
          request_id: string
          transfused_at: string
          transfused_by: string
          unit_id: string
        }
        Insert: {
          id?: string
          reaction_notes?: string | null
          reaction_severity?: string
          request_id: string
          transfused_at?: string
          transfused_by: string
          unit_id: string
        }
        Update: {
          id?: string
          reaction_notes?: string | null
          reaction_severity?: string
          request_id?: string
          transfused_at?: string
          transfused_by?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfusion_records_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "blood_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfusion_records_transfused_by_fkey"
            columns: ["transfused_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfusion_records_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: true
            referencedRelation: "blood_units"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          role_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          role_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vital_signs: {
        Row: {
          created_at: string
          diastolic_bp: number | null
          encounter_id: string
          heart_rate: number | null
          height_cm: number | null
          id: string
          oxygen_saturation: number | null
          patient_id: string
          recorded_at: string
          recorded_by: string
          respiratory_rate: number | null
          systolic_bp: number | null
          temperature: number | null
          verification_status: string
          weight_kg: number | null
        }
        Insert: {
          created_at?: string
          diastolic_bp?: number | null
          encounter_id: string
          heart_rate?: number | null
          height_cm?: number | null
          id?: string
          oxygen_saturation?: number | null
          patient_id: string
          recorded_at?: string
          recorded_by: string
          respiratory_rate?: number | null
          systolic_bp?: number | null
          temperature?: number | null
          verification_status?: string
          weight_kg?: number | null
        }
        Update: {
          created_at?: string
          diastolic_bp?: number | null
          encounter_id?: string
          heart_rate?: number | null
          height_cm?: number | null
          id?: string
          oxygen_saturation?: number | null
          patient_id?: string
          recorded_at?: string
          recorded_by?: string
          respiratory_rate?: number | null
          systolic_bp?: number | null
          temperature?: number | null
          verification_status?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vital_signs_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vital_signs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vital_signs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vital_signs_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      medication_stock_balances: {
        Row: {
          brand_name: string | null
          dosage_form: string | null
          generic_name: string | null
          id: string | null
          medication_code: string | null
          nearest_expiration: string | null
          quantity_on_hand: number | null
          reorder_level: number | null
          strength: string | null
          unit: string | null
        }
        Relationships: []
      }
      v_admission_census: {
        Row: {
          admission_date: string | null
          admission_number: string | null
          department_name: string | null
          discharge_date: string | null
          id: string | null
          patient_id: string | null
          status: Database["public"]["Enums"]["admission_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "admissions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      v_appointment_summary: {
        Row: {
          appointment_number: string | null
          department_name: string | null
          duration_minutes: number | null
          id: string | null
          patient_id: string | null
          physician_name: string | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["appointment_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      v_bed_availability: {
        Row: {
          bed_id: string | null
          bed_number: string | null
          department_name: string | null
          room_number: string | null
          status: Database["public"]["Enums"]["bed_status"] | null
        }
        Relationships: []
      }
      v_billing_summary: {
        Row: {
          amount_paid: number | null
          balance: number | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          patient_id: string | null
          status: Database["public"]["Enums"]["invoice_status"] | null
          total_amount: number | null
        }
        Insert: {
          amount_paid?: number | null
          balance?: number | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          patient_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          total_amount?: number | null
        }
        Update: {
          amount_paid?: number | null
          balance?: number | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          patient_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      v_inventory_summary: {
        Row: {
          category_name: string | null
          id: string | null
          item_code: string | null
          name: string | null
          quantity_on_hand: number | null
          reorder_level: number | null
          unit: string | null
        }
        Relationships: []
      }
      v_laboratory_summary: {
        Row: {
          id: string | null
          item_count: number | null
          order_number: string | null
          ordered_at: string | null
          patient_id: string | null
          priority: Database["public"]["Enums"]["laboratory_priority"] | null
          status: Database["public"]["Enums"]["laboratory_order_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "laboratory_orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laboratory_orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      v_patient_summary: {
        Row: {
          date_of_birth: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          medical_record_number: string | null
          middle_name: string | null
          registration_date: string | null
          registration_status:
            | Database["public"]["Enums"]["patient_registration_status"]
            | null
          sex: string | null
        }
        Insert: {
          date_of_birth?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          medical_record_number?: string | null
          middle_name?: string | null
          registration_date?: string | null
          registration_status?:
            | Database["public"]["Enums"]["patient_registration_status"]
            | null
          sex?: string | null
        }
        Update: {
          date_of_birth?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          medical_record_number?: string | null
          middle_name?: string | null
          registration_date?: string | null
          registration_status?:
            | Database["public"]["Enums"]["patient_registration_status"]
            | null
          sex?: string | null
        }
        Relationships: []
      }
      v_pharmacy_summary: {
        Row: {
          id: string | null
          item_count: number | null
          patient_id: string | null
          prescription_date: string | null
          prescription_number: string | null
          status: Database["public"]["Enums"]["prescription_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_summary"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_bed: {
        Args: {
          p_room_id: string
          p_bed_number: string
          p_status?: string
        }
        Returns: string
      }
      add_nursing_note: {
        Args: { p_encounter_id: string; p_note: string; p_patient_id: string }
        Returns: string
      }
      adjust_inventory: {
        Args: {
          p_batch_id?: string
          p_batch_number?: string
          p_expiration_date?: string
          p_item_id: string
          p_quantity: number
          p_reason?: string
          p_transaction_type: string
          p_unit_cost?: number
        }
        Returns: string
      }
      admit_mortuary_case: {
        Args: {
          p_body_tag_number: string
          p_identification_status?: string
          p_next_of_kin_contact?: string
          p_next_of_kin_name?: string
          p_next_of_kin_relationship?: string
          p_notes?: string
          p_patient_id: string
          p_place_of_death?: string
          p_storage_unit_id?: string
        }
        Returns: string
      }
      advance_ambulance_trip: {
        Args: { p_action: string; p_trip_id: string; p_vehicle_id?: string }
        Returns: string
      }
      advance_cleaning_request: {
        Args: {
          p_action: string
          p_chemical?: string
          p_contact_minutes?: number
          p_method?: string
          p_notes?: string
          p_request_id: string
          p_staff_id?: string
        }
        Returns: string
      }
      advance_meal_order: {
        Args: { p_meal_id: string; p_status: string }
        Returns: string
      }
      archive_staff_announcement: {
        Args: { p_announcement_id: string }
        Returns: string
      }
      can_access_patient: { Args: { p_patient_id: string }; Returns: boolean }
      check_edge_account_target: {
        Args: { p_actor: string; p_target: string }
        Returns: undefined
      }
      complete_equipment_work_order: {
        Args: {
          p_cost?: number
          p_parts_used?: string
          p_resolution_notes: string
          p_work_order_id: string
        }
        Returns: string
      }
      create_admission: {
        Args: {
          p_admission_notes: string
          p_admission_type: string
          p_attending_physician_id: string
          p_bed_id: string
          p_department_id: string
          p_patient_id: string
        }
        Returns: string
      }
      create_ambulance_trip: {
        Args: {
          p_destination: string
          p_notes?: string
          p_patient_id: string
          p_pickup_location: string
          p_priority?: string
        }
        Returns: string
      }
      create_appointment: {
        Args: {
          p_appointment_type: string
          p_department_id: string
          p_duration_minutes: number
          p_notes: string
          p_patient_id: string
          p_physician_id: string
          p_reason_for_visit: string
          p_scheduled_at: string
        }
        Returns: string
      }
      create_blood_request: {
        Args: {
          p_blood_type: string
          p_component: string
          p_department_id?: string
          p_notes?: string
          p_patient_id: string
          p_priority?: string
          p_required_by?: string
          p_units_requested: number
        }
        Returns: string
      }
      create_claim: {
        Args: {
          p_amount_claimed: number
          p_claim_type: string
          p_diagnosis: string
          p_lines?: Json
          p_policy_id: string
          p_total_charged: number
        }
        Returns: string
      }
      create_cleaning_request: {
        Args: {
          p_department_id?: string
          p_due_at?: string
          p_location_label: string
          p_location_type: string
          p_notes?: string
          p_priority?: string
          p_request_type: string
        }
        Returns: string
      }
      create_department: {
        Args: { p_code: string; p_description?: string; p_name: string }
        Returns: string
      }
      create_dietary_order: {
        Args: {
          p_allergies?: string[]
          p_meal_schedule?: string[]
          p_notes?: string
          p_patient_id: string
          p_restrictions?: string[]
          p_therapeutic_diet_id: string
        }
        Returns: string
      }
      create_employee_record: {
        Args: {
          p_department_id?: string
          p_employment_type?: string
          p_first_name: string
          p_hire_date: string
          p_last_name: string
          p_leave_balance?: number
          p_license_expiry?: string
          p_middle_name?: string
          p_monthly_rate?: number
          p_position: string
          p_professional_license_number?: string
          p_role_id?: string
          p_staff_number: string
          p_user_id: string
        }
        Returns: string
      }
      create_equipment_work_order: {
        Args: {
          p_equipment_id: string
          p_issue_description: string
          p_notes?: string
          p_priority?: string
        }
        Returns: string
      }
      create_housekeeping_staff: {
        Args: { p_contact_number?: string; p_name: string; p_role?: string }
        Returns: string
      }
      create_hr_employee_details: {
        Args: {
          p_hire_date: string
          p_position: string
          p_staff_profile_id: string
        }
        Returns: string
      }
      create_insurance_policy: {
        Args: {
          p_coverage_type: string
          p_effective_date: string
          p_expiry_date: string
          p_member_number: string
          p_notes?: string
          p_patient_id: string
          p_policy_number: string
          p_provider_id: string
        }
        Returns: string
      }
      create_insurance_provider: {
        Args: {
          p_code: string
          p_contact_number?: string
          p_integration_status?: string
          p_name: string
          p_type: string
        }
        Returns: string
      }
      create_invoice: {
        Args: {
          p_admission_id?: string
          p_discount_amount?: number
          p_encounter_id?: string
          p_items: Json
          p_patient_id: string
        }
        Returns: string
      }
      create_prescription: {
        Args: {
          p_encounter_id: string
          p_items: Json
          p_notes: string
          p_patient_id: string
        }
        Returns: string
      }
      create_room: {
        Args: {
          p_department_id: string
          p_floor_number?: string
          p_room_number: string
          p_room_type?: string
        }
        Returns: string
      }
      create_staff_announcement: {
        Args: {
          p_audience?: string
          p_body: string
          p_department_id?: string
          p_expires_at?: string
          p_pinned?: boolean
          p_publish?: boolean
          p_title: string
        }
        Returns: string
      }
      create_staff_record: {
        Args: {
          p_department_id?: string
          p_employment_type?: string
          p_first_name: string
          p_last_name: string
          p_middle_name?: string
          p_professional_license_number?: string
          p_role_id?: string
          p_staff_number: string
          p_user_id: string
        }
        Returns: string
      }
      crossmatch_blood_unit: {
        Args: { p_request_id: string; p_result: string; p_unit_id: string }
        Returns: string
      }
      current_permissions: { Args: never; Returns: string[] }
      current_staff_department_id: { Args: never; Returns: string }
      discharge_patient: {
        Args: { p_admission_id: string; p_discharge_notes: string }
        Returns: string
      }
      dispense_prescription: {
        Args: { p_prescription_id: string }
        Returns: string
      }
      expire_insurance_policies: { Args: never; Returns: number }
      file_leave_request: {
        Args: {
          p_end_date: string
          p_leave_type: string
          p_reason: string
          p_staff_profile_id: string
          p_start_date: string
        }
        Returns: string
      }
      finalize_clinical_note: { Args: { p_note_id: string }; Returns: string }
      generate_reference_number: { Args: { p_prefix: string }; Returns: string }
      has_permission: { Args: { p_permission: string }; Returns: boolean }
      has_role: { Args: { p_role: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      issue_blood_unit: {
        Args: {
          p_notes?: string
          p_received_by: string
          p_request_id: string
          p_unit_id: string
        }
        Returns: string
      }
      mark_all_notifications_read: { Args: never; Returns: number }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: string
      }
      publish_staff_announcement: {
        Args: { p_announcement_id: string }
        Returns: string
      }
      record_ambulance_fuel: {
        Args: {
          p_cost?: number
          p_fuel_level?: number
          p_fueled_at?: string
          p_liters: number
          p_odometer_km?: number
          p_vehicle_id: string
        }
        Returns: string
      }
      record_ambulance_maintenance: {
        Args: {
          p_cost?: number
          p_maintenance_type: string
          p_next_due_date?: string
          p_notes?: string
          p_performed_at?: string
          p_vehicle_id: string
        }
        Returns: string
      }
      record_attendance: {
        Args: {
          p_attendance_date: string
          p_note?: string
          p_overtime_minutes?: number
          p_staff_profile_id: string
          p_status?: string
          p_time_in?: string
          p_time_out?: string
        }
        Returns: string
      }
      record_blood_donation: {
        Args: {
          p_collection_site?: string
          p_component?: string
          p_donor_id: string
          p_expiry_days?: number
          p_units?: number
        }
        Returns: string
      }
      record_equipment_calibration: {
        Args: {
          p_calibration_type: string
          p_certificate_number: string
          p_equipment_id: string
          p_next_due_date?: string
          p_notes?: string
          p_result: string
        }
        Returns: string
      }
      record_patient_allergy: {
        Args: {
          p_allergen: string
          p_notes?: string
          p_patient_id: string
          p_reaction?: string
          p_severity?: string
        }
        Returns: string
      }
      record_payment: {
        Args: {
          p_amount: number
          p_invoice_id: string
          p_notes?: string
          p_payment_method: string
        }
        Returns: string
      }
      record_vital_signs: {
        Args: {
          p_diastolic_bp?: number
          p_encounter_id: string
          p_heart_rate?: number
          p_height_cm?: number
          p_oxygen_saturation?: number
          p_patient_id: string
          p_respiratory_rate?: number
          p_systolic_bp?: number
          p_temperature?: number
          p_weight_kg?: number
        }
        Returns: string
      }
      refund_payment: {
        Args: { p_payment_id: string; p_reason?: string }
        Returns: string
      }
      register_ambulance_vehicle: {
        Args: {
          p_location?: string
          p_next_service_due?: string
          p_plate_number: string
          p_type: string
          p_vehicle_number: string
        }
        Returns: string
      }
      register_blood_donor: {
        Args: {
          p_address?: string
          p_blood_type: string
          p_contact_number?: string
          p_date_of_birth: string
          p_full_name: string
          p_sex: string
        }
        Returns: string
      }
      register_equipment: {
        Args: {
          p_asset_number: string
          p_category_id?: string
          p_department_id?: string
          p_location?: string
          p_manufacturer?: string
          p_model?: string
          p_name: string
          p_next_calibration_due?: string
          p_next_maintenance_due?: string
          p_serial_number: string
        }
        Returns: string
      }
      register_operating_room: {
        Args: {
          p_department_id: string
          p_notes?: string
          p_room_name: string
          p_status?: string
        }
        Returns: string
      }
      register_patient: {
        Args: {
          p_address_line: string
          p_barangay: string
          p_city: string
          p_civil_status: string
          p_contact_number: string
          p_date_of_birth: string
          p_email: string
          p_emergency_contact_number: string
          p_emergency_full_name: string
          p_emergency_is_primary: boolean
          p_emergency_relationship: string
          p_first_name: string
          p_last_name: string
          p_middle_name: string
          p_nationality: string
          p_postal_code: string
          p_province: string
          p_sex: string
          p_suffix: string
        }
        Returns: string
      }
      release_mortuary_case: {
        Args: {
          p_document_reference?: string
          p_notes?: string
          p_record_id: string
          p_relationship?: string
          p_released_to: string
        }
        Returns: string
      }
      remove_bed: {
        Args: { p_bed_id: string }
        Returns: undefined
      }
      review_leave_request: {
        Args: { p_decision: string; p_leave_id: string }
        Returns: string
      }
      run_payroll: {
        Args: {
          p_deduction_rate?: number
          p_pay_date: string
          p_period_end: string
          p_period_start: string
        }
        Returns: string
      }
      save_notification_preferences: {
        Args: { p_preferences: Json }
        Returns: number
      }
      schedule_shift: {
        Args: {
          p_end_time: string
          p_shift_date: string
          p_shift_type: string
          p_staff_profile_id: string
          p_start_time: string
        }
        Returns: string
      }
      schedule_surgery_case: {
        Args: {
          p_anesthesia_type?: string
          p_notes?: string
          p_patient_id: string
          p_priority: string
          p_procedure_code: string
          p_procedure_name: string
          p_room_id: string
          p_scheduled_end: string
          p_scheduled_start: string
          p_surgeon_id: string
        }
        Returns: string
      }
      screen_blood_unit: {
        Args: { p_notes?: string; p_result: string; p_unit_id: string }
        Returns: string
      }
      set_edge_user_role: {
        Args: { p_grant: boolean; p_role: string; p_target: string }
        Returns: boolean
      }
      set_employee_salary: {
        Args: { p_monthly_rate: number; p_staff_profile_id: string }
        Returns: string
      }
      set_housekeeping_staff_status: {
        Args: { p_staff_id: string; p_status: string }
        Returns: string
      }
      start_emergency_visit: {
        Args: {
          p_arrival_mode?: string
          p_attending_physician_id?: string
          p_chief_complaint: string
          p_patient_id: string
          p_triage_level: string
          p_triage_note?: string
        }
        Returns: string
      }
      transfer_patient: {
        Args: {
          p_admission_id: string
          p_to_bed_id: string
          p_transfer_reason: string
        }
        Returns: string
      }
      try_uuid: { Args: { p_value: string }; Returns: string }
      update_bed_status: {
        Args: {
          p_bed_id: string
          p_expected_status: Database["public"]["Enums"]["bed_status"]
          p_status: Database["public"]["Enums"]["bed_status"]
        }
        Returns: undefined
      }
      update_patient: {
        Args: { p_patch: Json; p_patient_id: string }
        Returns: string
      }
      update_room: {
        Args: {
          p_room_id: string
          p_department_id: string
          p_room_number: string
          p_room_type?: string
          p_floor_number?: string
          p_is_active?: boolean
        }
        Returns: undefined
      }
      update_staff: {
        Args: { p_patch: Json; p_staff_id: string }
        Returns: string
      }
      verify_coverage: {
        Args: {
          p_notes?: string
          p_policy_id: string
          p_reference_number: string
          p_status: string
        }
        Returns: string
      }
      verify_laboratory_result: {
        Args: { p_result_id: string }
        Returns: string
      }
    }
    Enums: {
      admission_status: "admitted" | "transferred" | "discharged" | "cancelled"
      anesthesia_type: "general" | "regional" | "local" | "sedation"
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "waiting"
        | "in_consultation"
        | "completed"
        | "cancelled"
        | "no_show"
      bed_status: "available" | "occupied" | "maintenance" | "reserved"
      clinical_note_status: "draft" | "finalized" | "amended"
      emergency_arrival_mode: "walk_in" | "ambulance" | "referral"
      emergency_disposition: "admit" | "transfer" | "discharge"
      emergency_triage_level:
        | "critical"
        | "emergent"
        | "urgent"
        | "less_urgent"
        | "non_urgent"
      emergency_visit_status:
        | "waiting"
        | "triage"
        | "in_treatment"
        | "observation"
        | "admitted"
        | "transferred"
        | "discharged"
      encounter_status: "open" | "in_progress" | "completed" | "cancelled"
      invoice_status:
        | "unpaid"
        | "partially_paid"
        | "paid"
        | "cancelled"
        | "refunded"
      laboratory_order_status:
        | "pending"
        | "collection"
        | "processing"
        | "completed"
        | "cancelled"
      laboratory_priority: "routine" | "urgent" | "stat"
      laboratory_specimen_status: "pending" | "collected" | "rejected"
      laboratory_verification_status: "pending" | "verified" | "rejected"
      operating_room_status: "available" | "in_use" | "cleaning" | "maintenance"
      patient_registration_status: "active" | "inactive" | "archived"
      payment_status:
        | "pending"
        | "completed"
        | "failed"
        | "refunded"
        | "cancelled"
      prescription_status:
        | "pending"
        | "partially_dispensed"
        | "dispensed"
        | "cancelled"
      radiology_order_status:
        | "pending"
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
      radiology_report_status: "draft" | "verified" | "amended"
      stock_transaction_type:
        | "stock_in"
        | "stock_out"
        | "adjustment"
        | "transfer"
        | "dispensing"
      surgery_priority: "elective" | "urgent" | "emergency"
      surgery_status:
        | "requested"
        | "scheduled"
        | "pre_op"
        | "in_progress"
        | "recovery"
        | "completed"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      admission_status: ["admitted", "transferred", "discharged", "cancelled"],
      anesthesia_type: ["general", "regional", "local", "sedation"],
      appointment_status: [
        "scheduled",
        "confirmed",
        "waiting",
        "in_consultation",
        "completed",
        "cancelled",
        "no_show",
      ],
      bed_status: ["available", "occupied", "maintenance", "reserved"],
      clinical_note_status: ["draft", "finalized", "amended"],
      emergency_arrival_mode: ["walk_in", "ambulance", "referral"],
      emergency_disposition: ["admit", "transfer", "discharge"],
      emergency_triage_level: [
        "critical",
        "emergent",
        "urgent",
        "less_urgent",
        "non_urgent",
      ],
      emergency_visit_status: [
        "waiting",
        "triage",
        "in_treatment",
        "observation",
        "admitted",
        "transferred",
        "discharged",
      ],
      encounter_status: ["open", "in_progress", "completed", "cancelled"],
      invoice_status: [
        "unpaid",
        "partially_paid",
        "paid",
        "cancelled",
        "refunded",
      ],
      laboratory_order_status: [
        "pending",
        "collection",
        "processing",
        "completed",
        "cancelled",
      ],
      laboratory_priority: ["routine", "urgent", "stat"],
      laboratory_specimen_status: ["pending", "collected", "rejected"],
      laboratory_verification_status: ["pending", "verified", "rejected"],
      operating_room_status: ["available", "in_use", "cleaning", "maintenance"],
      patient_registration_status: ["active", "inactive", "archived"],
      payment_status: [
        "pending",
        "completed",
        "failed",
        "refunded",
        "cancelled",
      ],
      prescription_status: [
        "pending",
        "partially_dispensed",
        "dispensed",
        "cancelled",
      ],
      radiology_order_status: [
        "pending",
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
      ],
      radiology_report_status: ["draft", "verified", "amended"],
      stock_transaction_type: [
        "stock_in",
        "stock_out",
        "adjustment",
        "transfer",
        "dispensing",
      ],
      surgery_priority: ["elective", "urgent", "emergency"],
      surgery_status: [
        "requested",
        "scheduled",
        "pre_op",
        "in_progress",
        "recovery",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
