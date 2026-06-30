import { prisma } from "../../lib/db";
export async function handleAddCategory(
  payload: any,
  user: any,
  member: any,
  householdId: string | undefined,
) {
  if (!householdId) throw new Error("No household linked");
  await prisma.budgetCategory.create({
    data: {
      id: payload.id,
      householdId,
      label: payload.label,
      limitUsd: payload.limitUsd,
      color: payload.color,
      icon: payload.icon,
    },
  });
}

export async function handleUpdateCategory(
  payload: any,
  user: any,
  member: any,
  householdId: string | undefined,
) {
  if (!householdId) throw new Error("No household linked");
  const cat = await prisma.budgetCategory.findUnique({ where: { id: payload.id } });
  if (!cat || cat.householdId !== householdId) throw new Error("Forbidden");
  await prisma.budgetCategory.update({
    where: { id: payload.id },
    data: {
      label: payload.label,
      limitUsd: payload.limitUsd,
      color: payload.color,
      icon: payload.icon,
    },
  });
}

export async function handleUpdateCategoryLimit(
  payload: any,
  user: any,
  member: any,
  householdId: string | undefined,
) {
  if (!householdId) throw new Error("No household linked");
  // Authorization: verify this category belongs to the user's household
  const cat = await prisma.budgetCategory.findUnique({ where: { id: payload.id } });
  if (!cat || cat.householdId !== householdId) throw new Error("Forbidden");
  await prisma.budgetCategory.update({
    where: { id: payload.id },
    data: { limitUsd: payload.limitUsd },
  });
}

export async function handleDeleteCategory(
  payload: any,
  user: any,
  member: any,
  householdId: string | undefined,
) {
  if (!householdId) throw new Error("No household linked");
  const cat = await prisma.budgetCategory.findUnique({ where: { id: payload.id } });
  if (!cat || cat.householdId !== householdId) throw new Error("Forbidden");
  await prisma.budgetCategory.delete({ where: { id: payload.id } });
}
