import { NextResponse } from "next/server";
import { z } from "zod";
import { canAccess } from "@/lib/access-control";
import { branchScopedWhere } from "@/lib/branch-scope";
import { average } from "@/lib/feedback-options";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const rating = z.coerce.number().int().min(1).max(5);

const feedbackSchema = z.object({
  eventId: z.string().min(1),
  materialPurposeRating: rating,
  deliveryClarityRating: rating,
  timeEffectivenessRating: rating,
  flowClarityRating: rating,
  perspectiveChangeRating: rating,
  joinAgainRating: rating,
  understandingRating: rating,
  registrationEaseRating: rating,
  coordinationClarityRating: rating,
  locationComfortRating: rating,
  insightText: z.string().min(3),
  learnedText: z.string().min(3),
  improvementText: z.string().min(3),
});

function summarizeFeedback(feedbacks: Array<{
  materialPurposeRating: number | null;
  deliveryClarityRating: number | null;
  timeEffectivenessRating: number | null;
  flowClarityRating: number | null;
  perspectiveChangeRating: number | null;
  joinAgainRating: number | null;
  understandingRating: number | null;
  registrationEaseRating: number | null;
  coordinationClarityRating: number | null;
  locationComfortRating: number | null;
}>) {
  const objective = average(feedbacks.flatMap((item) => [
    item.materialPurposeRating,
    item.deliveryClarityRating,
    item.timeEffectivenessRating,
    item.flowClarityRating,
  ]));
  const transformation = average(feedbacks.flatMap((item) => [
    item.perspectiveChangeRating,
    item.joinAgainRating,
    item.understandingRating,
  ]));
  const operational = average(feedbacks.flatMap((item) => [
    item.registrationEaseRating,
    item.coordinationClarityRating,
    item.locationComfortRating,
  ]));
  const purposeAchievement = average([objective, transformation]);

  return { objective, transformation, operational, purposeAchievement };
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Silakan login dahulu." }, { status: 401 });
    }

    const roles = user.systemRoles.map((role) => role.role);
    const eventScope = branchScopedWhere(user);
    const feedbackAccess = canAccess(roles, "viewFeedbackSummary");
    const canSeeAllSummary = feedbackAccess === "allow";
    const canSeePartialSummary = feedbackAccess === "partial";

    const events = await prisma.event.findMany({
      where: {
        AND: [
          eventScope,
          {
            OR: [
              { status: "COMPLETED" },
              { status: "FEEDBACK_COLLECTION" },
              { feedbacks: { some: {} } },
              { participants: { some: { userId: user.id } } },
            ],
          },
        ],
      },
      orderBy: { startAt: "desc" },
      include: {
        participants: {
          where: canSeePartialSummary && !canSeeAllSummary ? { userId: user.id, role: { in: ["TRAINER", "SPEAKER"] } } : undefined,
          include: { user: true },
        },
        feedbacks: {
          include: { user: true },
        },
        _count: { select: { participants: true, feedbacks: true } },
      },
    });

    const data = events.map((event) => {
      const userFeedback = event.feedbacks.find((feedback) => feedback.userId === user.id) || null;
      const userParticipant = event.participants.find((participant) => participant.userId === user.id);
      const canSubmit =
        event.status === "FEEDBACK_COLLECTION" &&
        Boolean(userParticipant || roles.includes("ADMIN") || roles.includes("KETUA") || roles.includes("SUB_KETUA"));
      const canViewSummary =
        canSeeAllSummary ||
        (canSeePartialSummary && event.participants.some((participant) => ["TRAINER", "SPEAKER"].includes(participant.role)));

      return {
        id: event.id,
        title: event.title,
        category: event.category,
        purpose: event.purpose,
        expectedOutcome: event.expectedOutcome,
        status: event.status,
        startAt: event.startAt,
        participantCount: event._count.participants,
        feedbackCount: event._count.feedbacks,
        canSubmit,
        alreadySubmitted: Boolean(userFeedback),
        userFeedback,
        summary: canViewSummary ? summarizeFeedback(event.feedbacks) : null,
        comments: canViewSummary
          ? event.feedbacks.map((feedback) => ({
              id: feedback.id,
              user: { fullName: feedback.user.fullName, chineseName: feedback.user.chineseName },
              insightText: feedback.insightText || feedback.learnedText,
              improvementText: feedback.improvementText,
            }))
          : [],
      };
    });

    return NextResponse.json({ events: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengambil feedback.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Akun aktif diperlukan untuk mengirim feedback." }, { status: 401 });
    }

    const parsed = feedbackSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data feedback tidak valid." }, { status: 400 });
    }

    const data = parsed.data;
    const event = await prisma.event.findUnique({
      where: { id: data.eventId },
      include: { participants: { where: { userId: user.id } } },
    });

    if (!event) {
      return NextResponse.json({ error: "Event tidak ditemukan." }, { status: 404 });
    }

    if (event.status !== "FEEDBACK_COLLECTION") {
      return NextResponse.json({ error: "Feedback hanya dibuka pada tahap Feedback Collection." }, { status: 400 });
    }

    const approvedParticipant = event.participants.find((participant) => participant.registrationStatus === "APPROVED");
    if (!approvedParticipant && !user.systemRoles.some((role) => ["ADMIN", "SUPER_ADMIN", "KETUA", "SUB_KETUA"].includes(role.role))) {
      return NextResponse.json({ error: "Hanya participant event yang bisa mengirim feedback." }, { status: 403 });
    }

    const objectiveAverage = Math.round((data.materialPurposeRating + data.deliveryClarityRating + data.timeEffectivenessRating + data.flowClarityRating) / 4);
    const transformationAverage = Math.round((data.perspectiveChangeRating + data.joinAgainRating + data.understandingRating) / 3);

    const feedback = await prisma.feedback.upsert({
      where: {
        eventId_userId: {
          eventId: data.eventId,
          userId: user.id,
        },
      },
      update: {
        purposeAchievedRating: Math.round((objectiveAverage + transformationAverage) / 2),
        topicMatchRating: data.materialPurposeRating,
        speakerClarityRating: data.deliveryClarityRating,
        dharmaUsefulnessRating: data.understandingRating,
        materialPurposeRating: data.materialPurposeRating,
        deliveryClarityRating: data.deliveryClarityRating,
        timeEffectivenessRating: data.timeEffectivenessRating,
        flowClarityRating: data.flowClarityRating,
        perspectiveChangeRating: data.perspectiveChangeRating,
        joinAgainRating: data.joinAgainRating,
        understandingRating: data.understandingRating,
        registrationEaseRating: data.registrationEaseRating,
        coordinationClarityRating: data.coordinationClarityRating,
        locationComfortRating: data.locationComfortRating,
        insightText: data.insightText,
        learnedText: data.learnedText,
        improvementText: data.improvementText,
      },
      create: {
        eventId: data.eventId,
        userId: user.id,
        purposeAchievedRating: Math.round((objectiveAverage + transformationAverage) / 2),
        topicMatchRating: data.materialPurposeRating,
        speakerClarityRating: data.deliveryClarityRating,
        dharmaUsefulnessRating: data.understandingRating,
        materialPurposeRating: data.materialPurposeRating,
        deliveryClarityRating: data.deliveryClarityRating,
        timeEffectivenessRating: data.timeEffectivenessRating,
        flowClarityRating: data.flowClarityRating,
        perspectiveChangeRating: data.perspectiveChangeRating,
        joinAgainRating: data.joinAgainRating,
        understandingRating: data.understandingRating,
        registrationEaseRating: data.registrationEaseRating,
        coordinationClarityRating: data.coordinationClarityRating,
        locationComfortRating: data.locationComfortRating,
        insightText: data.insightText,
        learnedText: data.learnedText,
        improvementText: data.improvementText,
      },
    });

    await prisma.eventParticipant.updateMany({
      where: { eventId: data.eventId, userId: user.id },
      data: { feedbackSubmitted: true },
    });

    return NextResponse.json({ feedback });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menyimpan feedback.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
