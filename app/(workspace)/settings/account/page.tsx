import { redirect } from "next/navigation";
import { connection } from "next/server";

import { PageHeader } from "@/components/layout/page-header";
import {
  AccountSettingsView,
  type AccountSettingsProfile,
} from "@/components/settings/account-settings-view";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Account Settings",
};

type ProfileRow = {
  full_name: string;
  email: string;
  contact_number: string | null;
  is_active: boolean;
  created_at: string;
};

type RoleRow = {
  roles: { name: string } | { name: string }[] | null;
};

type StaffRow = {
  departments: { name: string } | { name: string }[] | null;
};

function firstRelation<T>(value: T | T[] | null): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function AccountSettingsPage() {
  await connection();

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [profileResult, rolesResult, staffResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name,email,contact_number,is_active,created_at")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id),
    supabase
      .from("staff_profiles")
      .select("departments(name)")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const profile = (profileResult.data ?? null) as ProfileRow | null;
  const roleNames = ((rolesResult.data ?? []) as RoleRow[])
    .map((row) => firstRelation(row.roles)?.name)
    .filter((name): name is string => Boolean(name));
  const staff = (staffResult.data ?? null) as StaffRow | null;
  const department = firstRelation(staff?.departments ?? null);

  const account: AccountSettingsProfile = {
    full_name: profile?.full_name || user.email || "Hospital staff account",
    email: profile?.email || user.email || "",
    is_active: profile?.is_active ?? true,
    role_names: roleNames,
    department_name: department?.name ?? null,
    contact_number: profile?.contact_number ?? null,
    last_activity: user.last_sign_in_at ?? null,
    created_at: profile?.created_at ?? user.created_at ?? null,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Account Settings"
        description="Your profile details and sign-in security."
      />

      <AccountSettingsView account={account} />
    </div>
  );
}
