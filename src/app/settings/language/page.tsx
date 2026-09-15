import AppChrome from "@/components/AppChrome";
import { normalizeLocale } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/session";
import SettingsPageHeader from "../SettingsPageHeader";
import LanguageForm from "./LanguageForm";

export default async function LanguageSettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <AppChrome>
        <section className="surface rounded-lg p-6">
          <h1 className="text-2xl font-semibold text-[#1f1f1f]">Bahasa</h1>
          <p className="mt-2 text-sm text-neutral-500">Silakan login untuk mengatur akun.</p>
        </section>
      </AppChrome>
    );
  }

  const locale = normalizeLocale(user.languagePreference);

  return (
    <AppChrome>
      <div className="mx-auto max-w-xl">
        <SettingsPageHeader title="Bahasa" />
        <LanguageForm currentLocale={locale} />
      </div>
    </AppChrome>
  );
}
