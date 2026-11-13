This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Database seed (demo)

`supabase/seed.sql` creates synthetic demo data for every public table plus 12
Supabase Auth users. Apply it after the schema migrations, either from the
Supabase Dashboard SQL Editor or with `psql`:

```bash
psql "$DATABASE_URL" -f supabase/seed.sql
```

All demo accounts share the password `SpmcDemo!2026`:

| Email | Role |
|---|---|
| `superadmin@spmc.test` | `super_admin` |
| `admin@spmc.test` | `hospital_admin` |
| `reception@spmc.test` | `receptionist` |
| `physician@spmc.test` | `physician` |
| `physician2@spmc.test` | `physician` |
| `nurse@spmc.test` | `nurse` |
| `nurse2@spmc.test` | `nurse` |
| `lab@spmc.test` | `laboratory_staff` |
| `radiology@spmc.test` | `radiology_staff` |
| `pharmacy@spmc.test` | `pharmacist` |
| `billing@spmc.test` | `billing_staff` |
| `inventory@spmc.test` | `inventory_staff` |

The seed is demo-only and must never be run against a production project.

The app signs in through Supabase Auth. Add `http://localhost:3000/auth/callback`
and your deployed callback URL to the Supabase Auth redirect allowlist so
password reset emails return to the app. Password reset delivery also requires
SMTP to be configured in the Supabase project.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
