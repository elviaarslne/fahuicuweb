import AppChrome from "@/components/AppChrome";
import { isContentManager } from "@/lib/admin-content";
import { getCurrentUser } from "@/lib/session";
import AdminActivityMonitor from "./AdminActivityMonitor";

export default async function AdminActivityPage() {
  const user = await getCurrentUser();
  if (!isContentManager(user)) {
    return <AppChrome><section className="rounded-3xl border border-[#e8ddc4] bg-white p-6">Akses admin konten diperlukan.</section></AppChrome>;
  }
  return (
    <AppChrome>
      <AdminActivityMonitor />
    </AppChrome>
  );
}
