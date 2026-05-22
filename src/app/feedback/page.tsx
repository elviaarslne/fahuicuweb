import AppChrome from "@/components/AppChrome";
import FeedbackEngine from "./FeedbackEngine";

export default function FeedbackPage() {
  return (
    <AppChrome>
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Feedback Engine</p>
        <h1 className="mt-2 text-2xl font-semibold text-[#1f1f1f]">Evaluasi tujuan acara</h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-500">
          Feedback tidak dibuat untuk menilai rasa suka saja, tetapi mengukur objective, transformation, dan operational quality.
        </p>
        <FeedbackEngine />
      </section>
    </AppChrome>
  );
}
