"use client";

import * as React from "react";
import {
  ChefHatMinimalisticIcon,
  ClipboardListIcon,
  PlateIcon,
} from "@solar-icons/react/linear";

import type {
  DietCategory,
  DietaryOrderDetail,
  DietaryOrderListRow,
  MealOrderDetail,
  MealOrderListRow,
  TherapeuticDiet,
} from "@/types/hospital";
import {
  RecordTable,
  type Column,
  type FilterConfig,
} from "@/components/module/record-table";
import { UNAVAILABLE_MESSAGE, UnavailableAction } from "@/components/module/unavailable-action";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs } from "@/components/ui/tabs";
import { formatDateTime } from "@/lib/format";

const MEAL_STATUS_OPTIONS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const MEAL_TYPE_OPTIONS = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
];

const ORDER_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "discontinued", label: "Discontinued" },
];

export interface DietaryViewProps {
  meals: MealOrderListRow[];
  mealDetails: Record<string, MealOrderDetail>;
  orders: DietaryOrderListRow[];
  orderDetails: Record<string, DietaryOrderDetail>;
  categories: DietCategory[];
  therapeuticDiets: TherapeuticDiet[];
}

function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium text-hospital-text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-hospital-text">{children}</dd>
    </div>
  );
}

function SectionHeading({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-hospital-text-muted">
      <span aria-hidden="true">{icon}</span>
      {title}
    </h3>
  );
}

function AllergenBadges({ allergens }: { allergens: string[] }) {
  if (allergens.length === 0) {
    return <span className="text-[11px] text-hospital-text-muted">None</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {allergens.map((allergen) => (
        <Badge key={allergen} variant="critical">
          {allergen}
        </Badge>
      ))}
    </div>
  );
}

function RestrictionBadges({ restrictions }: { restrictions: string[] }) {
  if (restrictions.length === 0) {
    return <span className="text-[11px] text-hospital-text-muted">None</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {restrictions.map((restriction) => (
        <Badge key={restriction} variant="pending">
          {restriction}
        </Badge>
      ))}
    </div>
  );
}

export function DietaryView({
  meals,
  mealDetails,
  orders,
  orderDetails,
  categories,
  therapeuticDiets,
}: DietaryViewProps) {
  const [tab, setTab] = React.useState("meals");
  const [selectedMeal, setSelectedMeal] =
    React.useState<MealOrderListRow | null>(null);
  const [selectedOrder, setSelectedOrder] =
    React.useState<DietaryOrderListRow | null>(null);
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);

  const mealById = React.useMemo(
    () => new Map(meals.map((meal) => [meal.id, meal])),
    [meals]
  );
  const orderById = React.useMemo(
    () => new Map(orders.map((order) => [order.id, order])),
    [orders]
  );

  const openMeal = React.useCallback(
    (id: string) => {
      const row = mealById.get(id);

      if (row) {
        setPendingAction(null);
        setSelectedMeal(row);
      }
    },
    [mealById]
  );

  const closeMeal = React.useCallback(() => {
    setPendingAction(null);
    setSelectedMeal(null);
  }, []);

  const openOrder = React.useCallback(
    (id: string) => {
      const row = orderById.get(id);

      if (row) {
        setPendingAction(null);
        setSelectedOrder(row);
      }
    },
    [orderById]
  );

  const closeOrder = React.useCallback(() => {
    setPendingAction(null);
    setSelectedOrder(null);
  }, []);

  const mealColumns = React.useMemo<Column<MealOrderListRow>[]>(
    () => [
      {
        key: "meal_number",
        header: "Meal No.",
        sortable: true,
        sortValue: (row) => row.meal_number,
        cell: (row) => (
          <span className="font-mono text-[11px] text-hospital-text">
            {row.meal_number}
          </span>
        ),
      },
      {
        key: "patient",
        header: "Patient",
        sortable: true,
        sortValue: (row) => row.patient_name,
        cell: (row) => (
          <div className="min-w-0">
            <p className="font-medium text-hospital-text">{row.patient_name}</p>
            <p className="font-mono text-[11px] text-hospital-text-muted">
              {row.patient_mrn}
            </p>
          </div>
        ),
      },
      {
        key: "meal_type",
        header: "Meal",
        cell: (row) => <StatusBadge status={row.meal_type} />,
      },
      {
        key: "diet",
        header: "Diet",
        sortable: true,
        sortValue: (row) => row.diet_name,
        cell: (row) => (
          <div className="min-w-0 text-xs">
            <p>{row.diet_name}</p>
            <p className="text-[11px] text-hospital-text-muted">
              {row.category_name}
            </p>
          </div>
        ),
      },
      {
        key: "location",
        header: "Location",
        cell: (row) => `${row.ward} · ${row.room} · ${row.bed}`,
      },
      {
        key: "scheduled",
        header: "Scheduled",
        sortable: true,
        sortValue: (row) => row.scheduled_for,
        cell: (row) => (
          <span className="whitespace-nowrap">
            {formatDateTime(row.scheduled_for)}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "allergens",
        header: "Allergy alert",
        cell: (row) => <AllergenBadges allergens={row.allergens} />,
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        cell: (row) => (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`View meal ${row.meal_number}`}
            onClick={() => openMeal(row.id)}
          >
            View
          </Button>
        ),
      },
    ],
    [openMeal]
  );

  const mealFilters = React.useMemo<FilterConfig<MealOrderListRow>[]>(
    () => [
      {
        key: "status",
        label: "status",
        allLabel: "All statuses",
        options: MEAL_STATUS_OPTIONS,
        accessor: (row) => row.status,
      },
      {
        key: "meal_type",
        label: "meal",
        allLabel: "All meals",
        options: MEAL_TYPE_OPTIONS,
        accessor: (row) => row.meal_type,
      },
    ],
    []
  );

  const orderColumns = React.useMemo<Column<DietaryOrderListRow>[]>(
    () => [
      {
        key: "order_number",
        header: "Order No.",
        sortable: true,
        sortValue: (row) => row.order_number,
        cell: (row) => (
          <span className="font-mono text-[11px] text-hospital-text">
            {row.order_number}
          </span>
        ),
      },
      {
        key: "patient",
        header: "Patient",
        sortable: true,
        sortValue: (row) => row.patient_name,
        cell: (row) => (
          <div className="min-w-0">
            <p className="font-medium text-hospital-text">{row.patient_name}</p>
            <p className="font-mono text-[11px] text-hospital-text-muted">
              {row.patient_mrn}
            </p>
          </div>
        ),
      },
      {
        key: "diet",
        header: "Diet",
        sortable: true,
        sortValue: (row) => row.diet_name,
        cell: (row) => (
          <div className="min-w-0 text-xs">
            <p>{row.diet_name}</p>
            <p className="text-[11px] text-hospital-text-muted">
              {row.category_name}
            </p>
          </div>
        ),
      },
      {
        key: "allergies",
        header: "Allergies",
        cell: (row) => <AllergenBadges allergens={row.allergies} />,
      },
      {
        key: "restrictions",
        header: "Restrictions",
        cell: (row) => <RestrictionBadges restrictions={row.restrictions} />,
      },
      {
        key: "meals",
        header: "Meals",
        align: "center",
        cell: (row) => row.meal_count,
      },
      {
        key: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "assessed",
        header: "Assessed",
        sortable: true,
        sortValue: (row) => row.assessed_at,
        cell: (row) => (
          <div className="whitespace-nowrap text-xs">
            <p>{formatDateTime(row.assessed_at)}</p>
            <p className="text-[11px] text-hospital-text-muted">
              {row.ordered_by_name}
            </p>
          </div>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        cell: (row) => (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`View dietary order ${row.order_number}`}
            onClick={() => openOrder(row.id)}
          >
            View
          </Button>
        ),
      },
    ],
    [openOrder]
  );

  const orderFilters = React.useMemo<FilterConfig<DietaryOrderListRow>[]>(
    () => [
      {
        key: "status",
        label: "status",
        allLabel: "All statuses",
        options: ORDER_STATUS_OPTIONS,
        accessor: (row) => row.status,
      },
      {
        key: "category",
        label: "diet category",
        allLabel: "All categories",
        options: categories.map((category) => ({
          label: category.name,
          value: category.name,
        })),
        accessor: (row) => row.category_name,
      },
    ],
    [categories]
  );

  const mealDetail = selectedMeal
    ? mealDetails[selectedMeal.id] ?? null
    : null;
  const orderDetail = selectedOrder
    ? orderDetails[selectedOrder.id] ?? null
    : null;

  return (
    <>
      <div className="space-y-4">
        <Tabs
          items={[
            { value: "meals", label: "Meal board", count: meals.length },
            { value: "orders", label: "Diet orders", count: orders.length },
            {
              value: "catalog",
              label: "Diet catalog",
              count: categories.length + therapeuticDiets.length,
            },
          ]}
          value={tab}
          onValueChange={setTab}
        />

        {tab === "meals" ? (
          <div className="space-y-3">
            <p className="text-[11px] text-hospital-text-muted">
              Allergy alerts are shown on every tray. Confirm the diet order and
              patient identity before meal service.
            </p>
            <RecordTable
              rows={meals}
              columns={mealColumns}
              rowKey={(row) => row.id}
              caption="Today's meal board"
              searchPlaceholder="Search meal no., patient, diet, or location"
              searchAccessor={(row) =>
                `${row.meal_number} ${row.patient_name} ${row.patient_mrn} ${row.diet_name} ${row.ward} ${row.room} ${row.bed}`
              }
              filters={mealFilters}
              toolbarActions={
                <UnavailableAction
                  label="Create Meal Order"
                  description="Create a meal order from an active dietary order."
                  size="sm"
                  variant="secondary"
                  icon={
                    <ChefHatMinimalisticIcon
                      className="size-4"
                      aria-hidden="true"
                    />
                  }
                />
              }
              emptyTitle="No meals scheduled"
              emptyDescription="There are no meal orders matching your selected filters."
              emptyIcon={
                <ChefHatMinimalisticIcon
                  className="size-5"
                  aria-hidden="true"
                />
              }
              pageSize={10}
            />
          </div>
        ) : null}

        {tab === "orders" ? (
          <RecordTable
            rows={orders}
            columns={orderColumns}
            rowKey={(row) => row.id}
            caption="Patient dietary orders"
            searchPlaceholder="Search order no., patient, diet, allergy, or restriction"
            searchAccessor={(row) =>
              `${row.order_number} ${row.patient_name} ${row.patient_mrn} ${row.diet_name} ${row.category_name} ${row.allergies.join(" ")} ${row.restrictions.join(" ")}`
            }
            filters={orderFilters}
            toolbarActions={
              <UnavailableAction
                label="New Dietary Assessment"
                description="Record a dietary assessment, allergies, restrictions, and a therapeutic diet order."
                size="sm"
                variant="secondary"
                icon={<ClipboardListIcon className="size-4" aria-hidden="true" />}
              />
            }
            emptyTitle="No dietary orders found"
            emptyDescription="There are no dietary orders matching your selected filters."
            emptyIcon={
              <ClipboardListIcon className="size-5" aria-hidden="true" />
            }
            pageSize={10}
          />
        ) : null}

        {tab === "catalog" ? (
          <div className="space-y-4">
            <p className="text-[11px] text-hospital-text-muted">
              Diet categories and therapeutic diets are reference data. Confirm
              the order with the clinical dietitian before meal preparation.
            </p>

            <section className="space-y-2">
              <SectionHeading
                icon={<PlateIcon className="size-3.5" />}
                title="Diet categories"
              />
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="rounded-md border border-hospital-border bg-white p-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-hospital-text">
                        {category.name}
                      </p>
                      <StatusBadge
                        status={category.is_active ? "active" : "inactive"}
                      />
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-hospital-text-muted">
                      {category.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <SectionHeading
                icon={<ChefHatMinimalisticIcon className="size-3.5" />}
                title="Therapeutic diets"
              />
              <div className="grid gap-3 lg:grid-cols-2">
                {therapeuticDiets.map((diet) => {
                  const category = categories.find(
                    (item) => item.id === diet.category_id
                  );

                  return (
                    <div
                      key={diet.id}
                      className="rounded-md border border-hospital-border bg-white p-4 shadow-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium text-hospital-text">
                          {diet.name}
                        </p>
                        <Badge variant="info">
                          {category?.name ?? "Diet"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-[11px] text-hospital-text-muted">
                        Indication: {diet.indication}
                      </p>
                      <p className="mt-1 text-[11px] text-hospital-text-muted">
                        Restrictions: {diet.restrictions}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        ) : null}
      </div>

      <Modal
        open={selectedMeal !== null}
        onClose={closeMeal}
        title={
          selectedMeal
            ? `Meal ${selectedMeal.meal_number}`
            : "Meal order details"
        }
        description="Patient, diet, allergens, preparation, and delivery"
        size="lg"
        footer={
          <Button variant="secondary" onClick={closeMeal}>
            Close
          </Button>
        }
      >
        {selectedMeal ? (
          <div className="space-y-5">
            {pendingAction ? (
              <Alert variant="info" title="Action unavailable">
                {UNAVAILABLE_MESSAGE} Requested action: {pendingAction}.
              </Alert>
            ) : null}

            {selectedMeal.allergens.length > 0 ? (
              <Alert variant="warning" title="Allergy alert">
                This tray must avoid cross-contact with:{" "}
                {selectedMeal.allergens.join(", ")}.
              </Alert>
            ) : null}

            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Patient">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-medium">{selectedMeal.patient_name}</span>
                  <span className="font-mono text-[11px] text-hospital-text-muted">
                    {selectedMeal.patient_mrn}
                  </span>
                </div>
              </DetailField>
              <DetailField label="Meal">
                <StatusBadge status={selectedMeal.meal_type} />
              </DetailField>
              <DetailField label="Diet">
                {selectedMeal.diet_name}
              </DetailField>
              <DetailField label="Category">
                {selectedMeal.category_name}
              </DetailField>
              <DetailField label="Location">
                {selectedMeal.ward} · Room {selectedMeal.room} · Bed{" "}
                {selectedMeal.bed}
              </DetailField>
              <DetailField label="Scheduled">
                {formatDateTime(selectedMeal.scheduled_for)}
              </DetailField>
              <DetailField label="Status">
                <StatusBadge status={selectedMeal.status} />
              </DetailField>
              <DetailField label="Prepared by">
                {selectedMeal.prepared_by_name ?? "Not prepared"}
              </DetailField>
              <DetailField label="Delivered">
                {selectedMeal.delivered_at
                  ? formatDateTime(selectedMeal.delivered_at)
                  : "Not delivered"}
              </DetailField>
              <DetailField label="Delivered by">
                {selectedMeal.delivered_by_name ?? "Not delivered"}
              </DetailField>
            </dl>

            {selectedMeal.notes ? (
              <p className="rounded-md border border-hospital-border-subtle bg-hospital-surface px-3 py-2 text-xs text-hospital-text-muted">
                {selectedMeal.notes}
              </p>
            ) : null}

            {mealDetail ? (
              <section className="space-y-2">
                <SectionHeading
                  icon={<ClipboardListIcon className="size-3.5" />}
                  title="Dietary order"
                />
                <div className="rounded-md border border-hospital-border p-3">
                  <p className="text-sm font-medium text-hospital-text">
                    {mealDetail.order.order_number}
                  </p>
                  <p className="mt-0.5 text-[11px] text-hospital-text-muted">
                    {mealDetail.category.name} ·{" "}
                    {mealDetail.therapeuticDiet.name}
                  </p>
                  <div className="mt-2">
                    <p className="text-[11px] font-medium text-hospital-text-muted">
                      Allergies
                    </p>
                    <div className="mt-1">
                      <AllergenBadges allergens={mealDetail.order.allergies} />
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-[11px] font-medium text-hospital-text-muted">
                      Restrictions
                    </p>
                    <div className="mt-1">
                      <RestrictionBadges
                        restrictions={mealDetail.order.restrictions}
                      />
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPendingAction("Mark meal preparing")}
              >
                Mark preparing
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPendingAction("Mark meal ready")}
              >
                Mark ready
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPendingAction("Confirm meal delivery")}
              >
                Confirm delivery
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={selectedOrder !== null}
        onClose={closeOrder}
        title={
          selectedOrder
            ? `Dietary order ${selectedOrder.order_number}`
            : "Dietary order details"
        }
        description="Assessment, therapeutic diet, allergies, and scheduled meals"
        size="lg"
        footer={
          <Button variant="secondary" onClick={closeOrder}>
            Close
          </Button>
        }
      >
        {selectedOrder ? (
          <div className="space-y-5">
            {pendingAction ? (
              <Alert variant="info" title="Action unavailable">
                {UNAVAILABLE_MESSAGE} Requested action: {pendingAction}.
              </Alert>
            ) : null}

            {selectedOrder.allergies.length > 0 ? (
              <Alert variant="warning" title="Allergy alert">
                {selectedOrder.allergies.join(", ")}.
              </Alert>
            ) : null}

            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Patient">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-medium">
                    {selectedOrder.patient_name}
                  </span>
                  <span className="font-mono text-[11px] text-hospital-text-muted">
                    {selectedOrder.patient_mrn}
                  </span>
                </div>
              </DetailField>
              <DetailField label="Status">
                <StatusBadge status={selectedOrder.status} />
              </DetailField>
              <DetailField label="Diet">
                {selectedOrder.diet_name}
              </DetailField>
              <DetailField label="Category">
                {selectedOrder.category_name}
              </DetailField>
              <DetailField label="Assessed">
                {formatDateTime(selectedOrder.assessed_at)}
              </DetailField>
              <DetailField label="Ordered by">
                {selectedOrder.ordered_by_name}
              </DetailField>
              <DetailField label="Scheduled meals">
                {selectedOrder.meal_count}
              </DetailField>
            </dl>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-medium text-hospital-text-muted">
                  Allergies
                </p>
                <div className="mt-1">
                  <AllergenBadges allergens={selectedOrder.allergies} />
                </div>
              </div>
              <div>
                <p className="text-[11px] font-medium text-hospital-text-muted">
                  Restrictions
                </p>
                <div className="mt-1">
                  <RestrictionBadges
                    restrictions={selectedOrder.restrictions}
                  />
                </div>
              </div>
            </div>

            {selectedOrder.assessment_notes ? (
              <p className="rounded-md border border-hospital-border-subtle bg-hospital-surface px-3 py-2 text-xs text-hospital-text-muted">
                {selectedOrder.assessment_notes}
              </p>
            ) : null}

            {orderDetail ? (
              <section className="space-y-2">
                <SectionHeading
                  icon={<ChefHatMinimalisticIcon className="size-3.5" />}
                  title="Scheduled meals"
                />
                {orderDetail.meals.length === 0 ? (
                  <p className="text-xs text-hospital-text-muted">
                    No meals scheduled for this order.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {orderDetail.meals.map((meal) => (
                      <li
                        key={meal.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-hospital-border-subtle bg-hospital-surface px-3 py-2"
                      >
                        <div>
                          <p className="font-mono text-[11px] text-hospital-text">
                            {meal.meal_number} · {meal.meal_type}
                          </p>
                          <p className="text-[11px] text-hospital-text-muted">
                            {formatDateTime(meal.scheduled_for)} · {meal.ward} ·{" "}
                            {meal.room} · {meal.bed}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={meal.status} />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openMeal(meal.id)}
                          >
                            View
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPendingAction("Update dietary order")}
              >
                Update order
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPendingAction("Discontinue dietary order")}
              >
                Discontinue
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPendingAction("Create meal order")}
              >
                Create meal order
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
