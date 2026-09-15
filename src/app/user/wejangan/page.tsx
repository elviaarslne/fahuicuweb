import AppChrome from "@/components/AppChrome";
import { isSameJakartaDay } from "@/lib/jakarta-time";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import WejanganReflectionForm from "./WejanganReflectionForm";
import WejanganHistoryNav from "./WejanganHistoryNav";

export default async function WejanganPage({
  searchParams,
}: {
  searchParams?: Promise<{ id?: string }> | { id?: string };
}) {
  const user = await getCurrentUser();
  if (!user) return <AppChrome><div className="surface rounded-lg p-6">Silakan login dahulu.</div></AppChrome>;

  const resolvedSearchParams = searchParams ? await searchParams : {};

  const wejangan = await prisma.dailyWejangan.findMany({
    include: { reflections: { where: { userId: user.id } } },
    orderBy: { uploadDate: "desc" },
    take: 30,
  });

  const requestedIndex = resolvedSearchParams.id
    ? wejangan.findIndex((item) => item.id === resolvedSearchParams.id)
    : -1;
  const todayIndex = wejangan.findIndex((item) => isSameJakartaDay(item.uploadDate));

  const currentIndex = requestedIndex >= 0 ? requestedIndex : todayIndex;
  const current = currentIndex >= 0 ? wejangan[currentIndex] : null;
  const isToday = current ? isSameJakartaDay(current.uploadDate) : false;

  const previousItem = currentIndex >= 0 ? wejangan[currentIndex + 1] : null;
  const nextItem = currentIndex > 0 ? wejangan[currentIndex - 1] : null;

  return (
    <AppChrome>
      <section className="mb-4 rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-black text-[#1f1f1f]">Wejangan Harian</h1>
      </section>

      {current ? (
        <article className="surface rounded-lg p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9a6a00]">
              {isToday ? "Hari ini" : new Date(current.uploadDate).toLocaleDateString("id-ID")} • {current.source || "Sumber internal"}
            </p>
            <WejanganHistoryNav previousId={previousItem?.id} nextId={nextItem?.id} />
          </div>
          <h2 className="mt-2 text-2xl font-black text-neutral-950">{current.title}</h2>
          <p className="mt-4 whitespace-pre-line text-sm leading-7 text-neutral-700">{current.content}</p>

          {isToday ? (
            <>
              {current.reflectionQuestion ? (
                <div className="mt-5 rounded-lg bg-[#fff7e8] p-4">
                  <p className="text-sm font-semibold text-neutral-900">{current.reflectionQuestion}</p>
                  <p className="mt-1 text-xs text-neutral-500">Reward refleksi: {current.creditReward} credit.</p>
                </div>
              ) : null}
              <WejanganReflectionForm
                wejanganId={current.id}
                initialAnswer={current.reflections[0]?.answer}
              />
            </>
          ) : (
            <div className="mt-5 rounded-lg border border-black/10 bg-[#f8f1de] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#6b6254]">Refleksi saya (pribadi)</p>
              {current.reflections[0] ? (
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-neutral-800">{current.reflections[0].answer}</p>
              ) : (
                <p className="mt-2 text-sm text-neutral-500">Refleksi hanya bisa diisi pada hari wejangan tersebut ditampilkan sebagai hari ini.</p>
              )}
            </div>
          )}
        </article>
      ) : (
        <div className="surface rounded-lg p-6 text-sm text-neutral-500">Belum ada wejangan untuk hari ini.</div>
      )}

      {wejangan.length > 1 ? (
        <section className="mt-4 surface rounded-lg p-4">
          <h2 className="text-lg font-semibold text-neutral-950">Riwayat</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {wejangan.filter((item) => item.id !== current?.id).map((item) => (
              <a key={item.id} href={`/user/wejangan?id=${item.id}`} className="block rounded-lg border border-neutral-200 bg-white p-4 transition hover:bg-[#fff7e8]">
                <p className="text-xs text-neutral-500">{new Date(item.uploadDate).toLocaleDateString("id-ID")}</p>
                <p className="mt-1 font-semibold text-neutral-900">{item.title}</p>
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </AppChrome>
  );
}
