import Link from "next/link";
import { ChevronRight, KeyRound, Languages, LayoutGrid, Sparkles, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import AppChrome from "@/components/AppChrome";
import { dictionary, normalizeLocale } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/session";

type SettingsItem = { href: string; label: string; icon: LucideIcon };
type SettingsGroup = { label: string; items: SettingsItem[] };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <AppChrome>
        <section className="surface rounded-lg p-6">
          <h1 className="text-2xl font-semibold text-[#1f1f1f]">Pengaturan</h1>
          <p className="mt-2 text-sm text-neutral-500">Silakan login untuk mengatur akun.</p>
        </section>
      </AppChrome>
    );
  }

  const locale = normalizeLocale(user.languagePreference);
  const t = dictionary[locale].settings;

  const groups: SettingsGroup[] = [
    {
      label: t.akun,
      items: [
        { href: "/settings/profile", label: t.profil, icon: UserRound },
        { href: "/settings/security", label: t.keamanan, icon: KeyRound },
      ],
    },
    {
      label: t.preferensi,
      items: [{ href: "/settings/language", label: t.bahasa, icon: Languages }],
    },
    {
      label: t.workspace,
      items: [{ href: "/settings/workspace", label: t.workspace, icon: LayoutGrid }],
    },
    {
      label: t.aktivitas,
      items: [{ href: "/settings/activity", label: t.ringkasan, icon: Sparkles }],
    },
  ];

  return (
    <AppChrome>
      <div className="mx-auto max-w-xl">
        <h1 className="text-xl font-semibold text-[#1f1f1f]">{t.title}</h1>

        <div className="mt-5 space-y-5">
          {groups.map((group) => (
            <section key={group.label}>
              <p className="px-1 text-xs font-bold uppercase tracking-[0.14em] text-[#9a8b6a]">{group.label}</p>
              <div className="mt-2 overflow-hidden rounded-2xl border border-[#e8ddc4] bg-white">
                {group.items.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3.5 transition hover:bg-[#fff8e8] ${index > 0 ? "border-t border-[#f0e7d0]" : ""}`}
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#fff8e8] text-[#a17700]">
                        <Icon size={18} />
                      </span>
                      <span className="flex-1 text-sm font-semibold text-[#1f1f1f]">{item.label}</span>
                      <ChevronRight size={18} className="shrink-0 text-[#9a8b6a]" />
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </AppChrome>
  );
}
