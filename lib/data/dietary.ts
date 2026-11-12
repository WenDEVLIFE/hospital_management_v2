import type {
  DietCategory,
  DietaryOrderDetail,
  DietaryOrderListRow,
  DietaryStats,
  MealOrderDetail,
  MealOrderListRow,
  TherapeuticDiet,
} from "@/types/hospital";
import {
  dietCategories,
  dietaryOrderDetailById,
  dietaryOrderListRows,
  dietaryStats,
  mealOrderDetailById,
  mealOrderListRows,
  therapeuticDiets,
} from "@/lib/fixtures";
import { isPreviewMode } from "./config";
import {
  emptyPage,
  matchesQuery,
  pageSlice,
  sortByDateDesc,
} from "./query";
import type { DataResult, PagedResult } from "./result";

const MEAL_NOT_FOUND = {
  code: "NOT_FOUND",
  message: "The requested meal order could not be found.",
} as const;

const DIET_ORDER_NOT_FOUND = {
  code: "NOT_FOUND",
  message: "The requested dietary order could not be found.",
} as const;

function emptyStats(): DietaryStats {
  return {
    activeOrders: 0,
    mealsToday: 0,
    preparationPending: 0,
    deliveredToday: 0,
    allergyAlerts: 0,
    therapeuticDiets: 0,
  };
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
  // TODO(supabase): replace with supabase.from("meal_orders").select("*")
  if (!isPreviewMode) {
    return emptyPage<MealOrderListRow>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = mealOrderListRows.filter((meal) => {
    if (params.status && meal.status !== params.status) {
      return false;
    }

    if (params.mealType && meal.meal_type !== params.mealType) {
      return false;
    }

    return matchesQuery(params.q, [
      meal.meal_number,
      meal.patient_name,
      meal.patient_mrn,
      meal.diet_name,
      meal.ward,
      meal.room,
      meal.bed,
    ]);
  });

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function getMealOrderDetails(): Promise<
  DataResult<Record<string, MealOrderDetail>>
> {
  // TODO(supabase): replace with a joined meal detail query
  if (!isPreviewMode) {
    return { data: {}, error: null };
  }

  await Promise.resolve();

  return {
    data: Object.fromEntries(mealOrderDetailById),
    error: null,
  };
}

export async function getMealOrderDetail(
  id: string
): Promise<DataResult<MealOrderDetail>> {
  // TODO(supabase): replace with supabase.from("meal_orders").select("*").eq("id", id)
  if (!isPreviewMode) {
    return { data: null, error: MEAL_NOT_FOUND };
  }

  await Promise.resolve();

  const detail = mealOrderDetailById.get(id);

  if (!detail) {
    return { data: null, error: MEAL_NOT_FOUND };
  }

  return { data: detail, error: null };
}

export async function listDietaryOrders(
  params: {
    q?: string;
    status?: string;
    category?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<DietaryOrderListRow>> {
  // TODO(supabase): replace with supabase.from("dietary_orders").select("*")
  if (!isPreviewMode) {
    return emptyPage<DietaryOrderListRow>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = sortByDateDesc(
    dietaryOrderListRows.filter((order) => {
      if (params.status && order.status !== params.status) {
        return false;
      }

      if (params.category && order.category_name !== params.category) {
        return false;
      }

      return matchesQuery(params.q, [
        order.order_number,
        order.patient_name,
        order.patient_mrn,
        order.category_name,
        order.diet_name,
        order.allergies.join(" "),
        order.restrictions.join(" "),
      ]);
    }),
    (order) => order.assessed_at
  );

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function getDietaryOrderDetails(): Promise<
  DataResult<Record<string, DietaryOrderDetail>>
> {
  // TODO(supabase): replace with a joined dietary order detail query
  if (!isPreviewMode) {
    return { data: {}, error: null };
  }

  await Promise.resolve();

  return {
    data: Object.fromEntries(dietaryOrderDetailById),
    error: null,
  };
}

export async function getDietaryOrderDetail(
  id: string
): Promise<DataResult<DietaryOrderDetail>> {
  // TODO(supabase): replace with supabase.from("dietary_orders").select("*").eq("id", id)
  if (!isPreviewMode) {
    return { data: null, error: DIET_ORDER_NOT_FOUND };
  }

  await Promise.resolve();

  const detail = dietaryOrderDetailById.get(id);

  if (!detail) {
    return { data: null, error: DIET_ORDER_NOT_FOUND };
  }

  return { data: detail, error: null };
}

export async function getDietaryCatalog(): Promise<
  DataResult<{ categories: DietCategory[]; diets: TherapeuticDiet[] }>
> {
  // TODO(supabase): replace with supabase.from("diet_categories") and diet tables
  if (!isPreviewMode) {
    return { data: { categories: [], diets: [] }, error: null };
  }

  await Promise.resolve();

  return {
    data: { categories: dietCategories, diets: therapeuticDiets },
    error: null,
  };
}

export async function getDietaryStats(): Promise<DataResult<DietaryStats>> {
  // TODO(supabase): replace with aggregate queries over diet orders and meals
  if (!isPreviewMode) {
    return { data: emptyStats(), error: null };
  }

  await Promise.resolve();

  return { data: dietaryStats, error: null };
}
