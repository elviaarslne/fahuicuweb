import AppChrome from "@/components/AppChrome";
import { isAllowed } from "@/lib/access-control";
import { normalizeLocale } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/session";
import ScheduleEngine from "./ScheduleEngine";

export default async function SchedulePage() {
  const user = await getCurrentUser();
  const roles = user?.systemRoles.map((role) => role.role) ?? [];
  const locale = normalizeLocale(user?.languagePreference);

  if (!isAllowed(roles, "viewSchedule")) {
    return (
      <AppChrome>
        <div className="surface rounded-lg p-6 text-sm text-neutral-500">Silakan login untuk melihat jadwal.</div>
      </AppChrome>
    );
  }

  return (
    <AppChrome>
      <ScheduleEngine locale={locale} />
    </AppChrome>
  );
}
