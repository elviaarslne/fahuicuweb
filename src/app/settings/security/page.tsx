import AppChrome from "@/components/AppChrome";
import { getCurrentUser } from "@/lib/session";
import SettingsPageHeader from "../SettingsPageHeader";
import SecurityForm from "./SecurityForm";

export default async function SecuritySettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <AppChrome>
        <section className="surface rounded-lg p-6">
          <h1 className="text-2xl font-semibold text-[#1f1f1f]">Keamanan</h1>
          <p className="mt-2 text-sm text-neutral-500">Silakan login untuk mengatur akun.</p>
        </section>
      </AppChrome>
    );
  }

  return (
    <AppChrome>
      <div className="mx-auto max-w-xl">
        <SettingsPageHeader title="Keamanan" />
        <SecurityForm />
      </div>
    </AppChrome>
  );
}
