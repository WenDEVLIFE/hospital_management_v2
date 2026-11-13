import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Sign In",
};

// The sign-in page reads searchParams (error/next), so it must block rather
// than prerender under Cache Components.
export const instant = false;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;

  return (
    <LoginForm
      initialError={params.error ?? null}
      initialNext={params.next ?? null}
    />
  );
}
