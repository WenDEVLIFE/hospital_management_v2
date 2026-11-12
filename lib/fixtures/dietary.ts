import type {
  DietCategory,
  DietaryOrder,
  DietaryOrderDetail,
  DietaryOrderListRow,
  DietaryStats,
  MealOrder,
  MealOrderDetail,
  MealOrderListRow,
  TherapeuticDiet,
} from "@/types/hospital";
import { isoAt, previewUuid, profileIds, profileNameById } from "./base";
import { patientMrnById, patientNameById, patients } from "./patients";

const dietitianName =
  profileNameById.get(profileIds.hospitalAdmin) ?? "Test Clinical Dietitian";

export const dietCategories: DietCategory[] = [
  {
    id: previewUuid(120, 1),
    name: "Regular",
    description: "General hospital diet with no therapeutic modification.",
    is_active: true,
  },
  {
    id: previewUuid(120, 2),
    name: "Soft",
    description: "Soft-textured foods for chewing or swallowing difficulty.",
    is_active: true,
  },
  {
    id: previewUuid(120, 3),
    name: "Full liquid",
    description: "Liquids and foods that are liquid at room temperature.",
    is_active: true,
  },
  {
    id: previewUuid(120, 4),
    name: "Diabetic",
    description: "Consistent carbohydrate distribution for glycemic control.",
    is_active: true,
  },
  {
    id: previewUuid(120, 5),
    name: "Low sodium",
    description: "Sodium-restricted diet for hypertension or heart failure.",
    is_active: true,
  },
  {
    id: previewUuid(120, 6),
    name: "Renal",
    description: "Protein, potassium, phosphorus, and sodium modification.",
    is_active: true,
  },
  {
    id: previewUuid(120, 7),
    name: "Low fat",
    description: "Fat-restricted diet for gallbladder or pancreatic disease.",
    is_active: true,
  },
  {
    id: previewUuid(120, 8),
    name: "NPO",
    description: "Nothing by mouth; no meals are prepared.",
    is_active: true,
  },
];

export const dietCategoryById = new Map(
  dietCategories.map((category) => [category.id, category])
);

export const therapeuticDiets: TherapeuticDiet[] = [
  {
    id: previewUuid(121, 1),
    category_id: dietCategories[0].id,
    name: "Regular hospital diet",
    indication: "No dietary restriction.",
    restrictions: "None.",
    is_active: true,
  },
  {
    id: previewUuid(121, 2),
    category_id: dietCategories[1].id,
    name: "Soft diet",
    indication: "Dysphagia, dental pain, or chewing difficulty.",
    restrictions: "Avoid hard, raw, or fibrous foods.",
    is_active: true,
  },
  {
    id: previewUuid(121, 3),
    category_id: dietCategories[2].id,
    name: "Clear liquid diet",
    indication: "Post-operative advancement or acute gastrointestinal symptoms.",
    restrictions: "Clear fluids only; no solid food.",
    is_active: true,
  },
  {
    id: previewUuid(121, 4),
    category_id: dietCategories[3].id,
    name: "Consistent carbohydrate",
    indication: "Diabetes mellitus or impaired glucose tolerance.",
    restrictions: "Consistent carbohydrate portions; no concentrated sweets.",
    is_active: true,
  },
  {
    id: previewUuid(121, 5),
    category_id: dietCategories[4].id,
    name: "2 g sodium",
    indication: "Hypertension, heart failure, or fluid retention.",
    restrictions: "No added salt; avoid processed and canned foods.",
    is_active: true,
  },
  {
    id: previewUuid(121, 6),
    category_id: dietCategories[5].id,
    name: "Renal diet",
    indication: "Chronic kidney disease or renal replacement therapy.",
    restrictions: "Potassium and phosphorus restriction; individualize protein.",
    is_active: true,
  },
  {
    id: previewUuid(121, 7),
    category_id: dietCategories[6].id,
    name: "Low fat",
    indication: "Gallbladder disease, pancreatitis, or fat malabsorption.",
    restrictions: "Avoid fried and high-fat foods.",
    is_active: true,
  },
  {
    id: previewUuid(121, 8),
    category_id: dietCategories[7].id,
    name: "Nil per os",
    indication: "Pre-operative status or acute abdomen.",
    restrictions: "Nothing by mouth.",
    is_active: true,
  },
];

export const therapeuticDietById = new Map(
  therapeuticDiets.map((diet) => [diet.id, diet])
);

type DietaryOrderSeed = {
  patientIndex: number;
  categoryIndex: number;
  dietIndex: number;
  allergies: string[];
  restrictions: string[];
  status: DietaryOrder["status"];
  mealSchedule: DietaryOrder["meal_schedule"];
  notes: string | null;
  assessedOffset: number;
};

const DIETARY_ORDER_SEEDS: DietaryOrderSeed[] = [
  {
    patientIndex: 0,
    categoryIndex: 3,
    dietIndex: 3,
    allergies: ["Penicillin"],
    restrictions: ["No concentrated sweets"],
    status: "active",
    mealSchedule: ["breakfast", "lunch", "dinner"],
    notes: "Carbohydrate counting education provided.",
    assessedOffset: -2,
  },
  {
    patientIndex: 1,
    categoryIndex: 0,
    dietIndex: 0,
    allergies: [],
    restrictions: ["No pork"],
    status: "active",
    mealSchedule: ["breakfast", "lunch", "dinner"],
    notes: "Patient prefers no pork.",
    assessedOffset: -1,
  },
  {
    patientIndex: 2,
    categoryIndex: 4,
    dietIndex: 4,
    allergies: ["Shellfish"],
    restrictions: ["Fluid restriction 1.5 L/day"],
    status: "active",
    mealSchedule: ["breakfast", "lunch", "dinner"],
    notes: "Heart failure diet instruction completed.",
    assessedOffset: -3,
  },
  {
    patientIndex: 3,
    categoryIndex: 1,
    dietIndex: 1,
    allergies: [],
    restrictions: ["No raw vegetables"],
    status: "active",
    mealSchedule: ["breakfast", "lunch", "dinner"],
    notes: "Dysphagia screening completed.",
    assessedOffset: -1,
  },
  {
    patientIndex: 4,
    categoryIndex: 5,
    dietIndex: 5,
    allergies: ["Dairy"],
    restrictions: ["Potassium restriction"],
    status: "active",
    mealSchedule: ["breakfast", "lunch", "dinner"],
    notes: "Renal dietitian review completed.",
    assessedOffset: -4,
  },
  {
    patientIndex: 5,
    categoryIndex: 7,
    dietIndex: 7,
    allergies: [],
    restrictions: ["Nothing by mouth"],
    status: "active",
    mealSchedule: [],
    notes: "Pre-operative NPO order.",
    assessedOffset: 0,
  },
  {
    patientIndex: 6,
    categoryIndex: 6,
    dietIndex: 6,
    allergies: [],
    restrictions: ["No fried foods"],
    status: "discontinued",
    mealSchedule: [],
    notes: "Discontinued after diet advancement.",
    assessedOffset: -5,
  },
  {
    patientIndex: 7,
    categoryIndex: 0,
    dietIndex: 0,
    allergies: ["Peanuts"],
    restrictions: [],
    status: "pending",
    mealSchedule: [],
    notes: "Awaiting dietitian assessment.",
    assessedOffset: 0,
  },
];

export const dietaryOrders: DietaryOrder[] = DIETARY_ORDER_SEEDS.map(
  (seed, index) => ({
    id: previewUuid(122, index + 1),
    order_number: `DIET-2026-${String(index + 1).padStart(4, "0")}`,
    patient_id: previewUuid(10, seed.patientIndex + 1),
    category_id: dietCategories[seed.categoryIndex].id,
    therapeutic_diet_id: therapeuticDiets[seed.dietIndex].id,
    allergies: seed.allergies,
    restrictions: seed.restrictions,
    assessment_notes: seed.notes,
    ordered_by_name: dietitianName,
    assessed_at: isoAt(seed.assessedOffset, 9),
    status: seed.status,
    meal_schedule: seed.mealSchedule,
  })
);

export const dietaryOrderById = new Map(
  dietaryOrders.map((order) => [order.id, order])
);

const WARD_BY_PATIENT_INDEX = [
  { ward: "Ward 3", room: "301", bed: "A" },
  { ward: "Ward 3", room: "302", bed: "B" },
  { ward: "Ward 4", room: "401", bed: "A" },
  { ward: "Ward 4", room: "402", bed: "B" },
  { ward: "Ward 5", room: "501", bed: "A" },
  { ward: "Ward 5", room: "502", bed: "B" },
  { ward: "Ward 6", room: "601", bed: "A" },
  { ward: "Ward 6", room: "602", bed: "B" },
];

const MEAL_HOURS = {
  breakfast: 7,
  lunch: 12,
  dinner: 18,
  snack: 15,
} as const;

const LUNCH_STATUSES: MealOrder["status"][] = [
  "preparing",
  "ready",
  "preparing",
  "scheduled",
  "ready",
];

export const mealOrders: MealOrder[] = [];

DIETARY_ORDER_SEEDS.forEach((seed, orderIndex) => {
  if (seed.mealSchedule.length === 0) {
    return;
  }

  const order = dietaryOrders[orderIndex];
  const ward = WARD_BY_PATIENT_INDEX[seed.patientIndex];

  seed.mealSchedule.forEach((mealType) => {
    const hour = MEAL_HOURS[mealType];
    const status: MealOrder["status"] =
      mealType === "breakfast"
        ? "delivered"
        : mealType === "lunch"
          ? LUNCH_STATUSES[orderIndex] ?? "scheduled"
          : "scheduled";
    const delivered = status === "delivered";

    mealOrders.push({
      id: previewUuid(123, mealOrders.length + 1),
      meal_number: `MEAL-2026-${String(mealOrders.length + 1).padStart(4, "0")}`,
      dietary_order_id: order.id,
      patient_id: order.patient_id,
      meal_type: mealType,
      scheduled_for: isoAt(0, hour),
      status,
      allergens: seed.allergies,
      notes:
        seed.allergies.length > 0
          ? `Allergy alert: avoid cross-contact with ${seed.allergies.join(", ")}.`
          : null,
      prepared_by_name:
        status === "scheduled" || status === "cancelled"
          ? null
          : "Test Kitchen Staff A",
      delivered_at: delivered ? isoAt(0, hour, 20) : null,
      delivered_by_name: delivered ? "Test Dietary Aide A" : null,
      ward: ward.ward,
      room: ward.room,
      bed: ward.bed,
    });
  });
});

export const mealOrderById = new Map(
  mealOrders.map((meal) => [meal.id, meal])
);

const mealsByOrderId = new Map<string, MealOrder[]>();

for (const meal of mealOrders) {
  const list = mealsByOrderId.get(meal.dietary_order_id) ?? [];
  list.push(meal);
  mealsByOrderId.set(meal.dietary_order_id, list);
}

export const mealOrderListRows: MealOrderListRow[] = mealOrders
  .map((meal) => {
    const order = dietaryOrderById.get(meal.dietary_order_id);
    const category = order ? dietCategoryById.get(order.category_id) : null;
    const diet = order ? therapeuticDietById.get(order.therapeutic_diet_id) : null;

    return {
      ...meal,
      patient_name:
        patientNameById.get(meal.patient_id) ?? "Test Patient",
      patient_mrn:
        patientMrnById.get(meal.patient_id) ?? "MRN-2026-0000",
      category_name: category?.name ?? "Unknown diet",
      diet_name: diet?.name ?? "Unknown therapeutic diet",
    };
  })
  .sort((a, b) =>
    a.scheduled_for === b.scheduled_for
      ? 0
      : a.scheduled_for < b.scheduled_for
        ? -1
        : 1
  );

export const dietaryOrderListRows: DietaryOrderListRow[] = dietaryOrders.map(
  (order) => {
    const category = dietCategoryById.get(order.category_id);
    const diet = therapeuticDietById.get(order.therapeutic_diet_id);
    const meals = mealsByOrderId.get(order.id) ?? [];

    return {
      ...order,
      patient_name:
        patientNameById.get(order.patient_id) ?? "Test Patient",
      patient_mrn:
        patientMrnById.get(order.patient_id) ?? "MRN-2026-0000",
      category_name: category?.name ?? "Unknown diet",
      diet_name: diet?.name ?? "Unknown therapeutic diet",
      meal_count: meals.length,
    };
  }
);

export const dietaryOrderDetailById = new Map<string, DietaryOrderDetail>(
  dietaryOrders.map((order) => {
    const patient = patients.find((item) => item.id === order.patient_id);
    const category = dietCategoryById.get(order.category_id);
    const therapeuticDiet = therapeuticDietById.get(order.therapeutic_diet_id);

    if (!patient || !category || !therapeuticDiet) {
      throw new Error(`Dietary fixture is missing dependencies for ${order.id}`);
    }

    return [
      order.id,
      {
        order,
        patient,
        category,
        therapeuticDiet,
        meals: mealOrderListRows.filter(
          (meal) => meal.dietary_order_id === order.id
        ),
      },
    ];
  })
);

export const mealOrderDetailById = new Map<string, MealOrderDetail>(
  mealOrders.map((meal) => {
    const patient = patients.find((item) => item.id === meal.patient_id);
    const order = dietaryOrderById.get(meal.dietary_order_id);
    const category = order ? dietCategoryById.get(order.category_id) : null;
    const therapeuticDiet = order
      ? therapeuticDietById.get(order.therapeutic_diet_id)
      : null;

    if (!patient || !order || !category || !therapeuticDiet) {
      throw new Error(`Dietary fixture is missing meal dependencies for ${meal.id}`);
    }

    return [
      meal.id,
      {
        meal,
        patient,
        order,
        category,
        therapeuticDiet,
      },
    ];
  })
);

export const dietaryStats: DietaryStats = {
  activeOrders: dietaryOrders.filter((order) => order.status === "active")
    .length,
  mealsToday: mealOrderListRows.length,
  preparationPending: mealOrderListRows.filter(
    (meal) => meal.status === "preparing"
  ).length,
  deliveredToday: mealOrderListRows.filter(
    (meal) => meal.status === "delivered"
  ).length,
  allergyAlerts: dietaryOrders.filter(
    (order) => order.status === "active" && order.allergies.length > 0
  ).length,
  therapeuticDiets: therapeuticDiets.filter((diet) => diet.is_active).length,
};
