import AppChrome from "@/components/AppChrome";
import MaterialsManager from "./MaterialsManager";

export default function MaterialsPage() {
  return (
    <AppChrome>
      <section className="surface rounded-lg p-5">
        <div>
          <h1 className="text-2xl font-semibold text-[#1f1f1f]">Materi</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-500">
            Materi hanya tampil untuk peserta event yang sudah approved, trainer/speaker yang ditugaskan,
            dan pengurus/admin sesuai scope cabang.
          </p>
        </div>
        <MaterialsManager />
      </section>
    </AppChrome>
  );
}
