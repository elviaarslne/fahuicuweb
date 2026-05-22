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
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Attendance Engine</p>
        <h1 className="mt-2 text-2xl font-semibold text-[#1f1f1f]">Absensi event</h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-500">
          V1 memakai QR check-in only. V2 sudah disiapkan secara data dengan check-out, tetapi belum dipakai untuk menghitung kehadiran.
        </p>
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
