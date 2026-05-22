import AppChrome from "@/components/AppChrome";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import WejanganReflectionForm from "./WejanganReflectionForm";

export default async function WejanganPage() {
  const user = await getCurrentUser();
  if (!user) return <AppChrome><div className="surface rounded-lg p-6">Silakan login dahulu.</div></AppChrome>;

  const wejangan = await prisma.dailyWejangan.findMany({
    include: { reflections: { where: { userId: user.id } } },
    orderBy: { uploadDate: "desc" },
    take: 10,
  });
  const latest = wejangan[0];

  return (
    <AppChrome>
      <section className="mb-4 rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-black text-[#1f1f1f]">Wejangan Harian</h1>
      </section>

      {latest ? (
        <article className="surface rounded-lg p-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9a6a00]">{new Date(latest.uploadDate).toLocaleDateString("id-ID")} • {latest.source || "Sumber internal"}</p>
          <h2 className="mt-2 text-2xl font-black text-neutral-950">{latest.title}</h2>
          <p className="mt-4 whitespace-pre-line text-sm leading-7 text-neutral-700">{latest.content}</p>
          {latest.reflectionQuestion ? (
            <div className="mt-5 rounded-lg bg-[#fff7e8] p-4">
              <p className="text-sm font-semibold text-neutral-900">{latest.reflectionQuestion}</p>
              <p className="mt-1 text-xs text-neutral-500">Reward refleksi: {latest.creditReward} credit.</p>
            </div>
          ) : null}
          <WejanganReflectionForm
            wejanganId={latest.id}
            initialAnswer={latest.reflections[0]?.answer}
            title={latest.title}
            source={latest.source}
            uploadDate={latest.uploadDate}
            content={latest.content}
            creditReward={latest.creditReward}
          />
        </article>
      ) : (
        <div className="surface rounded-lg p-6 text-sm text-neutral-500">Belum ada wejangan harian.</div>
      )}

      <section className="mt-4 surface rounded-lg p-4">
        <h2 className="text-lg font-semibold text-neutral-950">Sebelumnya</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {wejangan.slice(1).map((item) => (
            <div key={item.id} className="rounded-lg border border-neutral-200 bg-white p-4">
              <p className="text-xs text-neutral-500">{new Date(item.uploadDate).toLocaleDateString("id-ID")}</p>
              <p className="mt-1 font-semibold text-neutral-900">{item.title}</p>
            </div>
          ))}
        </div>
      </section>
    </AppChrome>
  );
}
