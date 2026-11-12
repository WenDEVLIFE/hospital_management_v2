import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/module/error-state";
import { AccountSettingsView } from "@/components/settings/account-settings-view";
import { listUsers } from "@/lib/data/users";

export const metadata = {
  title: "Account Settings",
};

export default async function AccountSettingsPage() {
  // TODO(supabase): read the authenticated profile directly instead of
  // filtering the staff directory by the preview session email.
  const listResult = await listUsers({ pageSize: 200 });
  const users = listResult.error ? [] : listResult.data.rows;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Account Settings"
        description="Your profile details and sign-in security."
      />

      {listResult.error ? (
        <ErrorState error={listResult.error} />
      ) : (
        <AccountSettingsView users={users} />
      )}
    </div>
  );
}
