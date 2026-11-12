import { connection } from "next/server";
import {
  CheckCircleIcon,
  ChefHatMinimalisticIcon,
  ClipboardListIcon,
  ClockCircleIcon,
  DangerCircleIcon,
  PlateIcon,
  UserRoundedIcon,
} from "@solar-icons/react/linear";

import { PageHeader } from "@/components/layout/page-header";
import { DietaryView } from "@/components/dietary/dietary-view";
import { DietaryWorkflowStrip } from "@/components/dietary/dietary-workflow-strip";
import { ErrorState } from "@/components/module/error-state";
import { StatCard } from "@/components/module/stat-card";
import { UnavailableAction } from "@/components/module/unavailable-action";
import { Alert } from "@/components/ui/alert";
import {
  getDietaryCatalog,
  getDietaryOrderDetails,
  getDietaryStats,
  getMealOrderDetails,
  listDietaryOrders,
  listMealOrders,
} from "@/lib/data/dietary";

export const metadata = {
  title: "Dietary",
};

export default async function DietaryPage() {
  await connection();

  const [
    statsResult,
    mealsResult,
    mealDetailsResult,
    ordersResult,
    orderDetailsResult,
    catalogResult,
  ] = await Promise.all([
    getDietaryStats(),
    listMealOrders({ pageSize: 200 }),
    getMealOrderDetails(),
    listDietaryOrders({ pageSize: 200 }),
    getDietaryOrderDetails(),
    getDietaryCatalog(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dietary"
        description="Dietary assessments, therapeutic diets, meal preparation, and delivery."
        actions={
          <>
            <UnavailableAction
              label="New Dietary Assessment"
              description="Record a dietary assessment, allergies, restrictions, and a therapeutic diet order."
              variant="secondary"
              icon={<ClipboardListIcon className="size-4" aria-hidden="true" />}
            />
            <UnavailableAction
              label="Create Meal Order"
              description="Create a meal tray order from an active dietary order."
              icon={<ChefHatMinimalisticIcon className="size-4" aria-hidden="true" />}
            />
          </>
        }
      />

      <Alert variant="info" title="Dietitian review required">
        Diet orders and allergy information must be verified by clinical
        dietitians or nutrition staff. Therapeutic diets are reference data; the
        system does not calculate them automatically.
      </Alert>

      {statsResult.error ? (
        <ErrorState error={statsResult.error} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              label="Active diet orders"
              value={statsResult.data.activeOrders}
              hint="Patients with active orders"
              icon={<UserRoundedIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Meals today"
              value={statsResult.data.mealsToday}
              hint="Scheduled trays"
              icon={<ChefHatMinimalisticIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Preparing"
              value={statsResult.data.preparationPending}
              hint="Kitchen preparation pending"
              tone="warning"
              icon={<ClockCircleIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Delivered"
              value={statsResult.data.deliveredToday}
              hint="Delivery confirmed"
              tone="success"
              icon={<CheckCircleIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Allergy alerts"
              value={statsResult.data.allergyAlerts}
              hint="Active orders with allergies"
              tone="danger"
              icon={<DangerCircleIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Therapeutic diets"
              value={statsResult.data.therapeuticDiets}
              hint="Configured diets"
              icon={<PlateIcon className="size-4" aria-hidden="true" />}
            />
          </div>

          <DietaryWorkflowStrip stats={statsResult.data} />
        </>
      )}

      {mealsResult.error ? (
        <ErrorState error={mealsResult.error} />
      ) : (
        <DietaryView
          meals={mealsResult.data.rows}
          mealDetails={mealDetailsResult.error ? {} : mealDetailsResult.data}
          orders={ordersResult.error ? [] : ordersResult.data.rows}
          orderDetails={
            orderDetailsResult.error ? {} : orderDetailsResult.data
          }
          categories={catalogResult.error ? [] : catalogResult.data.categories}
          therapeuticDiets={
            catalogResult.error ? [] : catalogResult.data.diets
          }
        />
      )}
    </div>
  );
}
