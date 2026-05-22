import AppChrome from "@/components/AppChrome";
import StatusBadge from "@/components/StatusBadge";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import RedeemButton from "./RedeemButton";

export default async function StorePage() {
  const user = await getCurrentUser();
  if (!user) return <AppChrome><div className="surface rounded-lg p-6">Silakan login dahulu.</div></AppChrome>;

  const [rewards, transactions, account] = await Promise.all([
    prisma.reward.findMany({ where: { isActive: true }, orderBy: { creditPrice: "asc" } }),
    prisma.rewardTransaction.findMany({ where: { userId: user.id }, include: { reward: true }, orderBy: { createdAt: "desc" } }),
    prisma.user.findUnique({ where: { id: user.id }, select: { creditBalance: true } }),
  ]);
  const creditBalance = account?.creditBalance || 0;

  return (
    <AppChrome>
      <section className="mb-6 rounded-lg border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#9a6a00]">Credit Store</p>
        <h1 className="mt-2 text-3xl font-black text-[#1f1f1f]">Store</h1>
        <p className="mt-2 text-sm leading-6 text-neutral-600">Credit saya: <strong>{creditBalance}</strong>. Redeem membuat request dan langsung mengurangi credit.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rewards.map((reward) => (
          <article key={reward.id} className="surface rounded-lg p-5">
            <div className="flex h-28 items-center justify-center rounded-lg bg-[#fff7e8] text-sm font-bold text-[#9a6a00]">
              {reward.name}
            </div>
            <h2 className="mt-4 text-lg font-semibold text-neutral-950">{reward.name}</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">{reward.description || "Reward internal Fa Hui Cu."}</p>
            <p className="mt-3 text-sm font-bold text-neutral-900">{reward.creditPrice} credit</p>
            <RedeemButton rewardId={reward.id} disabled={creditBalance < reward.creditPrice} />
          </article>
        ))}
      </section>

      <section className="mt-6 surface rounded-lg p-5">
        <h2 className="text-lg font-semibold text-neutral-950">Riwayat redeem</h2>
        <div className="mt-4 space-y-3">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white p-3">
              <div>
                <p className="text-sm font-semibold text-neutral-900">{transaction.reward.name}</p>
                <p className="text-xs text-neutral-500">{transaction.creditCost} credit • {new Date(transaction.createdAt).toLocaleString("id-ID")}</p>
              </div>
              <StatusBadge value={transaction.status} />
            </div>
          ))}
          {transactions.length === 0 ? <p className="text-sm text-neutral-500">Belum ada transaksi reward.</p> : null}
        </div>
      </section>
    </AppChrome>
  );
}
