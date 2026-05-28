import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

function isTrainingCategory(category?: string | null) {
  const normalized = (category || "").toLowerCase();
  return normalized.includes("training") || normalized.includes("pelatihan");
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Akun aktif diperlukan." }, { status: 401 });
    }

    const now = new Date();
    const twoWeeks = new Date(now);
    twoWeeks.setDate(twoWeeks.getDate() + 14);

    const events = await prisma.event.findMany({
      where: {
        status: { in: ["PUBLISHED", "REGISTRATION_OPEN", "ONGOING", "FEEDBACK_COLLECTION", "COMPLETED"] },
      },
      include: {
        hostingBranch: true,
        targetClass: true,
        sessions: { orderBy: [{ orderNumber: "asc" }, { startAt: "asc" }] },
        participants: { where: { userId: user.id } },
        attendances: { where: { userId: user.id } },
        feedbacks: { where: { userId: user.id } },
        eventReflections: { where: { userId: user.id } },
      },
      orderBy: { startAt: "asc" },
    });

    const sidangDharmaEvents = events.filter((event) => !isTrainingCategory(event.category));

    return NextResponse.json({
      events: sidangDharmaEvents,
      today: sidangDharmaEvents.filter((event) => event.startAt.toDateString() === now.toDateString()),
      nextTwoWeeks: sidangDharmaEvents.filter((event) => event.startAt > now && event.startAt <= twoWeeks),
      future: sidangDharmaEvents.filter((event) => event.startAt > twoWeeks),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengambil acara.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
