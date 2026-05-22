import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const memberCategoryCn: Record<string, string> = {
  BAN_SHI_JEN_YUAN: "辦事人員",
  JIANG_YUAN: "講員",
  TAN_ZHU: "壇主",
  JIANG_SHI: "講師",
};

export async function getCurrentUser() {
  const userId = (await cookies()).get("fhc_user_id")?.value;
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      systemRoles: true,
      currentClass: true,
      homeBranch: true,
    },
  });
}

export function getDisplayTitle(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (!user) return "訪客";
  if (user.memberCategory) return memberCategoryCn[user.memberCategory] || "會員";
  if (user.systemRoles.some((role) => role.role === "SUPER_ADMIN")) return "總管理員";
  if (user.systemRoles.some((role) => role.role === "ADMIN")) return "管理員";
  if (user.systemRoles.some((role) => role.role === "KETUA")) return "會長";
  if (user.systemRoles.some((role) => role.role === "SUB_KETUA")) return "副會長";
  return "會員";
}
