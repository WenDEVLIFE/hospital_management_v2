"use client";

import * as React from "react";
import Link from "next/link";

import { PageSection } from "@/components/layout/page-section";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";

type FormValues = {
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
  date_of_birth: string;
  sex: string;
  civil_status: string;
  nationality: string;
  contact_number: string;
  email: string;
  address_line: string;
  barangay: string;
  city: string;
  province: string;
  postal_code: string;
  emergency_full_name: string;
  emergency_relationship: string;
  emergency_contact_number: string;
  emergency_is_primary: boolean;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const INITIAL_VALUES: FormValues = {
  first_name: "",
  middle_name: "",
  last_name: "",
  suffix: "",
  date_of_birth: "",
  sex: "",
  civil_status: "",
  nationality: "Filipino",
  contact_number: "",
  email: "",
  address_line: "",
  barangay: "",
  city: "",
  province: "",
  postal_code: "",
  emergency_full_name: "",
  emergency_relationship: "",
  emergency_contact_number: "",
  emergency_is_primary: false,
};

const SEX_OPTIONS = [
  { label: "Select sex", value: "" },
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
];

const CIVIL_STATUS_OPTIONS = [
  { label: "Select civil status", value: "" },
  { label: "Single", value: "Single" },
  { label: "Married", value: "Married" },
  { label: "Widowed", value: "Widowed" },
  { label: "Separated", value: "Separated" },
  { label: "Annulled", value: "Annulled" },
];

const RELATIONSHIP_OPTIONS = [
  { label: "Select relationship", value: "" },
  { label: "Spouse", value: "Spouse" },
  { label: "Parent", value: "Parent" },
  { label: "Sibling", value: "Sibling" },
  { label: "Child", value: "Child" },
  { label: "Guardian", value: "Guardian" },
  { label: "Other", value: "Other" },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_CHARACTER_PATTERN = /^[\d\s+-]+$/;

function isValidContactNumber(value: string): boolean {
  if (!CONTACT_CHARACTER_PATTERN.test(value)) {
    return false;
  }

  const digits = value.replace(/\D/g, "");

  return digits.length >= 7 && digits.length <= 15;
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.first_name.trim()) {
    errors.first_name = "First name is required.";
  }

  if (!values.last_name.trim()) {
    errors.last_name = "Last name is required.";
  }

  if (!values.sex) {
    errors.sex = "Sex is required.";
  }

  if (!values.date_of_birth) {
    errors.date_of_birth = "Date of birth is required.";
  }

  if (!values.emergency_full_name.trim()) {
    errors.emergency_full_name = "Emergency contact name is required.";
  }

  if (!values.emergency_contact_number.trim()) {
    errors.emergency_contact_number = "Emergency contact number is required.";
  } else if (!isValidContactNumber(values.emergency_contact_number.trim())) {
    errors.emergency_contact_number =
      "Enter a valid contact number (7-15 digits).";
  }

  if (
    values.contact_number.trim() &&
    !isValidContactNumber(values.contact_number.trim())
  ) {
    errors.contact_number = "Enter a valid contact number (7-15 digits).";
  }

  if (values.email.trim() && !EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  return errors;
}

export function PatientRegistrationForm() {
  const [values, setValues] = React.useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [showNotice, setShowNotice] = React.useState(false);

  function setField<K extends keyof FormValues>(
    field: K,
    value: FormValues[K]
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setShowNotice(false);
    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];

      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setShowNotice(false);
      return;
    }

    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 350));
    setSubmitting(false);
    setShowNotice(true);
  }

  function handleReset() {
    setValues(INITIAL_VALUES);
    setErrors({});
    setShowNotice(false);
    setSubmitting(false);
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-4">
      {showNotice ? (
        <Alert variant="info" title="Registration is not connected yet">
          The form validated successfully. Patient registration will be saved
          once the Supabase backend is connected.
        </Alert>
      ) : null}

      <PageSection
        title="Personal Information"
        description="Core patient identity and demographic details."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="First name"
            htmlFor="first_name"
            required
            error={errors.first_name}
          >
            <Input
              name="first_name"
              value={values.first_name}
              onChange={(event) =>
                setField("first_name", event.target.value)
              }
              autoComplete="given-name"
            />
          </FormField>

          <FormField
            label="Middle name"
            htmlFor="middle_name"
            hint="Optional."
          >
            <Input
              name="middle_name"
              value={values.middle_name}
              onChange={(event) =>
                setField("middle_name", event.target.value)
              }
              autoComplete="additional-name"
            />
          </FormField>

          <FormField
            label="Last name"
            htmlFor="last_name"
            required
            error={errors.last_name}
          >
            <Input
              name="last_name"
              value={values.last_name}
              onChange={(event) => setField("last_name", event.target.value)}
              autoComplete="family-name"
            />
          </FormField>

          <FormField
            label="Suffix"
            htmlFor="suffix"
            hint="Example: Jr., Sr., III."
          >
            <Input
              name="suffix"
              value={values.suffix}
              onChange={(event) => setField("suffix", event.target.value)}
              autoComplete="honorific-suffix"
            />
          </FormField>

          <FormField
            label="Date of birth"
            htmlFor="date_of_birth"
            required
            error={errors.date_of_birth}
          >
            <Input
              type="date"
              name="date_of_birth"
              value={values.date_of_birth}
              onChange={(event) =>
                setField("date_of_birth", event.target.value)
              }
              autoComplete="bday"
            />
          </FormField>

          <FormField
            label="Sex"
            htmlFor="sex"
            required
            error={errors.sex}
          >
            <Select
              name="sex"
              value={values.sex}
              onChange={(event) => setField("sex", event.target.value)}
              options={SEX_OPTIONS}
            />
          </FormField>

          <FormField label="Civil status" htmlFor="civil_status">
            <Select
              name="civil_status"
              value={values.civil_status}
              onChange={(event) =>
                setField("civil_status", event.target.value)
              }
              options={CIVIL_STATUS_OPTIONS}
            />
          </FormField>

          <FormField label="Nationality" htmlFor="nationality">
            <Input
              name="nationality"
              value={values.nationality}
              onChange={(event) =>
                setField("nationality", event.target.value)
              }
              autoComplete="country-name"
            />
          </FormField>
        </div>
      </PageSection>

      <PageSection
        title="Contact Information"
        description="How the patient can be reached."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Contact number"
            htmlFor="contact_number"
            hint="Digits, spaces, + and - only. 7-15 digits."
            error={errors.contact_number}
          >
            <Input
              type="tel"
              inputMode="tel"
              name="contact_number"
              value={values.contact_number}
              onChange={(event) =>
                setField("contact_number", event.target.value)
              }
              placeholder="0917 000 0000"
              autoComplete="tel"
            />
          </FormField>

          <FormField
            label="Email address"
            htmlFor="email"
            error={errors.email}
          >
            <Input
              type="email"
              name="email"
              value={values.email}
              onChange={(event) => setField("email", event.target.value)}
              placeholder="patient@example.com"
              autoComplete="email"
            />
          </FormField>
        </div>
      </PageSection>

      <PageSection
        title="Address Information"
        description="Where the patient currently resides."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Address line"
            htmlFor="address_line"
            className="sm:col-span-2"
          >
            <Input
              name="address_line"
              value={values.address_line}
              onChange={(event) =>
                setField("address_line", event.target.value)
              }
              autoComplete="street-address"
            />
          </FormField>

          <FormField label="Barangay" htmlFor="barangay">
            <Input
              name="barangay"
              value={values.barangay}
              onChange={(event) => setField("barangay", event.target.value)}
              autoComplete="address-level3"
            />
          </FormField>

          <FormField label="City" htmlFor="city">
            <Input
              name="city"
              value={values.city}
              onChange={(event) => setField("city", event.target.value)}
              autoComplete="address-level2"
            />
          </FormField>

          <FormField label="Province" htmlFor="province">
            <Input
              name="province"
              value={values.province}
              onChange={(event) => setField("province", event.target.value)}
              autoComplete="address-level1"
            />
          </FormField>

          <FormField label="Postal code" htmlFor="postal_code">
            <Input
              name="postal_code"
              value={values.postal_code}
              onChange={(event) =>
                setField("postal_code", event.target.value)
              }
              inputMode="numeric"
              autoComplete="postal-code"
            />
          </FormField>
        </div>
      </PageSection>

      <PageSection
        title="Emergency Contact"
        description="Who to contact in case of an emergency."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Full name"
            htmlFor="emergency_full_name"
            required
            error={errors.emergency_full_name}
          >
            <Input
              name="emergency_full_name"
              value={values.emergency_full_name}
              onChange={(event) =>
                setField("emergency_full_name", event.target.value)
              }
              autoComplete="name"
            />
          </FormField>

          <FormField label="Relationship" htmlFor="emergency_relationship">
            <Select
              name="emergency_relationship"
              value={values.emergency_relationship}
              onChange={(event) =>
                setField("emergency_relationship", event.target.value)
              }
              options={RELATIONSHIP_OPTIONS}
            />
          </FormField>

          <FormField
            label="Contact number"
            htmlFor="emergency_contact_number"
            required
            hint="Digits, spaces, + and - only. 7-15 digits."
            error={errors.emergency_contact_number}
          >
            <Input
              type="tel"
              inputMode="tel"
              name="emergency_contact_number"
              value={values.emergency_contact_number}
              onChange={(event) =>
                setField("emergency_contact_number", event.target.value)
              }
              placeholder="0917 000 0000"
              autoComplete="tel"
            />
          </FormField>

          <FormField
            label="Primary emergency contact"
            htmlFor="emergency_is_primary"
            hint="Mark the contact to reach first."
          >
            <Checkbox
              name="emergency_is_primary"
              checked={values.emergency_is_primary}
              onChange={(event) =>
                setField("emergency_is_primary", event.target.checked)
              }
            />
          </FormField>
        </div>
      </PageSection>

      <PageSection
        title="Additional Registration Information"
        description="System-assigned values applied when the record is saved."
      >
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-medium text-hospital-text-muted">
              Medical Record Number
            </dt>
            <dd className="mt-0.5 text-sm text-hospital-text">
              Assigned by the database on registration
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium text-hospital-text-muted">
              Registration Status
            </dt>
            <dd className="mt-1">
              <StatusBadge status="active" />
            </dd>
          </div>
        </dl>
      </PageSection>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
        <Link href="/patients">
          <Button variant="secondary">Cancel</Button>
        </Link>
        <Button
          type="button"
          variant="secondary"
          onClick={handleReset}
          disabled={submitting}
        >
          Reset form
        </Button>
        <Button type="submit" loading={submitting}>
          Register Patient
        </Button>
      </div>

      <p className="text-[11px] text-hospital-text-muted">
        Medical record numbers are generated by the database and must be
        unique.
      </p>
    </form>
  );
}
