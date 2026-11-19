import type {
  DietCategory,
  DietaryOrder,
  DietaryOrderDetail,
  DietaryOrderListRow,
  DietaryStats,
  MealOrder,
  MealOrderDetail,
  MealOrderListRow,
  Patient,
  TherapeuticDiet,
} from "@/types/hospital";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { manilaDate, pageSlice, sanitizeSearchTerm } from "./query";
import { toDataError, type DataResult, type PagedResult } from "./result";

const ORDER_COLUMNS =
  "*, patients(id, medical_record_number, first_name, middle_name, last_name, suffix), diet_categories(name), therapeutic_diets(name), profiles!dietary_orders_ordered_by_fkey(full_name)";

const MEAL_COLUMNS =
  "*, patients(id, medical_record_number, first_name, middle_name, last_name, suffix), dietary_orders(order_number, category_id, therapeutic_diet_id, diet_categories(name), therapeutic_diets(name))";

type Relation<T> = T | T[] | null;

function firstRelation<T>(value: Relation<T>): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

function fullName(row: {
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
}): string {
  return [row.first_name, row.middle_name, row.last_name, row.suffix]
    .filter(Boolean)
    .join(" ");
}

type OrderJoinRow = DietaryOrder & {
  patients: Relation<{
    id: string;
    medical_record_number: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    suffix: string | null;
  }>;
  diet_categories: Relation<{ name: string }>;
  therapeutic_diets: Relation<{ name: string }>;
  profiles: Relation<{ full_name: string }>;
};

type MealJoinRow = MealOrder & {
  patients: Relation<{
    id: string;
    medical_record_number: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    suffix: string | null;
  }>;
  dietary_orders: Relation<{
    order_number: string;
    category_id: string;
    therapeutic_diet_id: string;
    diet_categories: Relation<{ name: string }>;
    therapeutic_diets: Relation<{ name: string }>;
  }>;
};

function toOrderRow(row: OrderJoinRow): DietaryOrderListRow | null {
  const patient = firstRelation(row.patients);

  if (!patient) {
    return null;
  }

  return {
    id: row.id,
    order_number: row.order_number,
    patient_id: row.patient_id,
    category_id: row.category_id,
    therapeutic_diet_id: row.therapeutic_diet_id,
    allergies: row.allergies ?? [],
    restrictions: row.restrictions ?? [],
    assessment_notes: row.assessment_notes,
    ordered_by_name: firstRelation(row.profiles)?.full_name ?? "Unknown staff",
    assessed_at: row.assessed_at,
    status: row.status,
    meal_schedule: row.meal_schedule ?? [],
    patient_name: fullName(patient),
    patient_mrn: patient.medical_record_number,
    category_name: firstRelation(row.diet_categories)?.name ?? "Uncategorised",
    diet_name: firstRelation(row.therapeutic_diets)?.name ?? "Unspecified",
  } as DietaryOrderListRow;
}

function toMealRow(row: MealJoinRow): MealOrderListRow | null {
  const patient = firstRelation(row.patients);
  const order = firstRelation(row.dietary_orders);

  if (!patient) {
    return null;
  }

  return {
    id: row.id,
    meal_number: row.meal_number,
    dietary_order_id: row.dietary_order_id,
    patient_id: row.patient_id,
    meal_type: row.meal_type,
    scheduled_for: row.scheduled_for,
    status: row.status,
    allergens: row.allergens ?? [],
    notes: row.notes,
    prepared_by_name: null,
    delivered_at: row.delivered_at,
    delivered_by_name: null,
    ward: row.ward,
    room: row.room,
    bed: row.bed,
    patient_name: fullName(patient),
    patient_mrn: patient.medical_record_number,
    category_name: order
      ? firstRelation(order.diet_categories)?.name ?? "Uncategorised"
      : "Uncategorised",
    diet_name: order
      ? firstRelation(order.therapeutic_diets)?.name ?? "Unspecified"
      : "Unspecified",
  } as MealOrderListRow;
}

async function loadOrders(): Promise<DataResult<OrderJoinRow[]>> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("dietary_orders")
    .select(ORDER_COLUMNS)
    .order("assessed_at", { ascending: false });

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return { data: (data ?? []) as OrderJoinRow[], error: null };
}

async function loadMeals(): Promise<DataResult<MealJoinRow[]>> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("meal_orders")
    .select(MEAL_COLUMNS)
    .order("scheduled_for");

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return { data: (data ?? []) as MealJoinRow[], error: null };
}

export async function listDietaryOrders(
  params: {
    q?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<DietaryOrderListRow>> {
  const orderResult = await loadOrders();

  if (orderResult.error) {
    return { data: null, error: orderResult.error };
  }

  const search = sanitizeSearchTerm(params.q)?.toLowerCase() ?? "";

  const rows = orderResult.data
    .map(toOrderRow)
    .filter((row): row is DietaryOrderListRow => row !== null)
    .filter((row) => {
      if (params.status && row.status !== params.status) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [row.order_number, row.patient_name, row.patient_mrn, row.diet_name]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

  return { data: pageSlice(rows, params.page, params.pageSize), error: null };
}

export async function listMealOrders(
  params: {
    q?: string;
    status?: string;
    mealType?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<MealOrderListRow>> {
  const mealResult = await loadMeals();

  if (mealResult.error) {
    return { data: null, error: mealResult.error };
  }

  const search = sanitizeSearchTerm(params.q)?.toLowerCase() ?? "";

  const rows = mealResult.data
    .map(toMealRow)
    .filter((row): row is MealOrderListRow => row !== null)
    .filter((row) => {
      if (params.status && row.status !== params.status) {
        return false;
      }

      if (params.mealType && row.meal_type !== params.mealType) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [row.meal_number, row.patient_name, row.patient_mrn, row.diet_name]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

  return { data: pageSlice(rows, params.page, params.pageSize), error: null };
}

export async function getDietaryCatalog(): Promise<
  DataResult<{ categories: DietCategory[]; diets: TherapeuticDiet[] }>
> {
  const supabase = await getSupabaseServerClient();
  const [categoryResult, dietResult] = await Promise.all([
    supabase.from("diet_categories").select("*").order("name"),
    supabase.from("therapeutic_diets").select("*").order("name"),
  ]);

  if (categoryResult.error) {
    return { data: null, error: toDataError(categoryResult.error) };
  }

  if (dietResult.error) {
    return { data: null, error: toDataError(dietResult.error) };
  }

  return {
    data: {
      categories: (categoryResult.data ?? []) as DietCategory[],
      diets: (dietResult.data ?? []) as TherapeuticDiet[],
    },
    error: null,
  };
}

export async function getDietaryOrderDetail(
  id: string
): Promise<DataResult<DietaryOrderDetail>> {
  const orderResult = await loadOrders();

  if (orderResult.error) {
    return { data: null, error: orderResult.error };
  }

  const row = orderResult.data.find((order) => order.id === id);

  if (!row) {
    return {
      data: null,
      error: { code: "NOT_FOUND", message: "The dietary order could not be found." },
    };
  }

  const supabase = await getSupabaseServerClient();
  const [patientResult, categoryResult, dietResult, mealResult] =
    await Promise.all([
      supabase.from("patients").select("*").eq("id", row.patient_id).maybeSingle(),
      supabase
        .from("diet_categories")
        .select("*")
        .eq("id", row.category_id)
        .maybeSingle(),
      supabase
        .from("therapeutic_diets")
        .select("*")
        .eq("id", row.therapeutic_diet_id)
        .maybeSingle(),
      loadMeals(),
    ]);

  const meals = (mealResult.error ? [] : mealResult.data)
    .map(toMealRow)
    .filter((meal): meal is MealOrderListRow => meal !== null)
    .filter((meal) => meal.dietary_order_id === id);

  return {
    data: {
      order: {
        id: row.id,
        order_number: row.order_number,
        patient_id: row.patient_id,
        category_id: row.category_id,
        therapeutic_diet_id: row.therapeutic_diet_id,
        allergies: row.allergies ?? [],
        restrictions: row.restrictions ?? [],
        assessment_notes: row.assessment_notes,
        ordered_by_name:
          firstRelation(row.profiles)?.full_name ?? "Unknown staff",
        assessed_at: row.assessed_at,
        status: row.status,
        meal_schedule: row.meal_schedule ?? [],
      },
      patient: (patientResult.data ?? {}) as Patient,
      category: (categoryResult.data ?? {}) as DietCategory,
      therapeuticDiet: (dietResult.data ?? {}) as TherapeuticDiet,
      meals,
    },
    error: null,
  };
}

export async function getDietaryOrderDetails(): Promise<
  DataResult<Record<string, DietaryOrderDetail>>
> {
  const orderResult = await loadOrders();

  if (orderResult.error) {
    return { data: null, error: orderResult.error };
  }

  const details: Record<string, DietaryOrderDetail> = {};

  for (const row of orderResult.data.slice(0, 200)) {
    const detail = await getDietaryOrderDetail(row.id);

    if (detail.data) {
      details[row.id] = detail.data;
    }
  }

  return { data: details, error: null };
}

export async function getMealOrderDetail(
  id: string
): Promise<DataResult<MealOrderDetail>> {
  const mealResult = await loadMeals();

  if (mealResult.error) {
    return { data: null, error: mealResult.error };
  }

  const row = mealResult.data.find((meal) => meal.id === id);

  if (!row) {
    return {
      data: null,
      error: { code: "NOT_FOUND", message: "The meal order could not be found." },
    };
  }

  const meal = toMealRow(row);

  if (!meal) {
    return {
      data: null,
      error: { code: "NOT_FOUND", message: "The meal order could not be found." },
    };
  }

  const supabase = await getSupabaseServerClient();
  const [patientResult, orderResult] = await Promise.all([
    supabase.from("patients").select("*").eq("id", row.patient_id).maybeSingle(),
    supabase
      .from("dietary_orders")
      .select(ORDER_COLUMNS)
      .eq("id", row.dietary_order_id)
      .maybeSingle(),
  ]);

  const orderRow = orderResult.data as OrderJoinRow | null;

  return {
    data: {
      meal: {
        id: meal.id,
        meal_number: meal.meal_number,
        dietary_order_id: meal.dietary_order_id,
        patient_id: meal.patient_id,
        meal_type: meal.meal_type,
        scheduled_for: meal.scheduled_for,
        status: meal.status,
        allergens: meal.allergens,
        notes: meal.notes,
        prepared_by_name: meal.prepared_by_name,
        delivered_at: meal.delivered_at,
        delivered_by_name: meal.delivered_by_name,
        ward: meal.ward,
        room: meal.room,
        bed: meal.bed,
      },
      patient: (patientResult.data ?? {}) as Patient,
      order: orderRow
        ? {
            id: orderRow.id,
            order_number: orderRow.order_number,
            patient_id: orderRow.patient_id,
            category_id: orderRow.category_id,
            therapeutic_diet_id: orderRow.therapeutic_diet_id,
            allergies: orderRow.allergies ?? [],
            restrictions: orderRow.restrictions ?? [],
            assessment_notes: orderRow.assessment_notes,
            ordered_by_name:
              firstRelation(orderRow.profiles)?.full_name ?? "Unknown staff",
            assessed_at: orderRow.assessed_at,
            status: orderRow.status,
            meal_schedule: orderRow.meal_schedule ?? [],
          }
        : ({} as DietaryOrder),
      category: (orderRow
        ? firstRelation(orderRow.diet_categories)
        : null) as DietCategory ?? ({} as DietCategory),
      therapeuticDiet: (orderRow
        ? firstRelation(orderRow.therapeutic_diets)
        : null) as TherapeuticDiet ?? ({} as TherapeuticDiet),
    },
    error: null,
  };
}

export async function getMealOrderDetails(): Promise<
  DataResult<Record<string, MealOrderDetail>>
> {
  const mealResult = await loadMeals();

  if (mealResult.error) {
    return { data: null, error: mealResult.error };
  }

  const details: Record<string, MealOrderDetail> = {};

  for (const row of mealResult.data.slice(0, 200)) {
    const detail = await getMealOrderDetail(row.id);

    if (detail.data) {
      details[row.id] = detail.data;
    }
  }

  return { data: details, error: null };
}

export async function getDietaryStats(): Promise<DataResult<DietaryStats>> {
  const supabase = await getSupabaseServerClient();
  const today = manilaDate(new Date().toISOString());
  const [orderResult, mealResult, dietResult] = await Promise.all([
    supabase.from("dietary_orders").select("status"),
    supabase.from("meal_orders").select("status, scheduled_for, delivered_at, allergens"),
    supabase.from("therapeutic_diets").select("id").eq("is_active", true),
  ]);

  if (orderResult.error) {
    return { data: null, error: toDataError(orderResult.error) };
  }

  if (mealResult.error) {
    return { data: null, error: toDataError(mealResult.error) };
  }

  const stats: DietaryStats = {
    activeOrders: 0,
    mealsToday: 0,
    preparationPending: 0,
    deliveredToday: 0,
    allergyAlerts: 0,
    therapeuticDiets: (dietResult.data ?? []).length,
  };

  for (const order of (orderResult.data ?? []) as Array<{ status: string }>) {
    if (order.status === "active") {
      stats.activeOrders += 1;
    }
  }

  for (const meal of (mealResult.data ?? []) as Array<{
    status: string;
    scheduled_for: string;
    delivered_at: string | null;
    allergens: string[] | null;
  }>) {
    if (manilaDate(meal.scheduled_for) === today) {
      stats.mealsToday += 1;
    }

    if (meal.status === "scheduled" || meal.status === "preparing") {
      stats.preparationPending += 1;
    }

    if (
      meal.status === "delivered" &&
      meal.delivered_at &&
      manilaDate(meal.delivered_at) === today
    ) {
      stats.deliveredToday += 1;
    }

    if ((meal.allergens ?? []).length > 0 && meal.status !== "delivered") {
      stats.allergyAlerts += 1;
    }
  }

  return { data: stats, error: null };
}
