import AppChrome from "@/components/AppChrome";
import { isAllowed } from "@/lib/access-control";
import { getCurrentUser } from "@/lib/session";
import AttendanceEngine from "./AttendanceEngine";

export default async function AttendancePage() {
  const user = await getCurrentUser();
  const roles = user?.systemRoles.map((role) => role.role) || [];
  const canManageAttendance = isAllowed(roles, "manageAttendance");

  return (
    <AppChrome>
      <section>
        <h1 className="text-2xl font-semibold text-[#1f1f1f]">Absensi event</h1>
        {canManageAttendance ? (
          <AttendanceEngine />
        ) : (
          <div className="mt-5 rounded-lg border border-neutral-200 bg-[#fff7e8] p-5 text-sm leading-6 text-neutral-600">
            Halaman koreksi absensi hanya tersedia untuk Ketua, Sub-ketua, Admin, atau Super Admin.
            Peserta tetap melakukan check-in melalui link QR event yang sudah approved.
          </div>
        )}
      </section>
    </AppChrome>
  );
}
