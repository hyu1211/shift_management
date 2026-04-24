import HomeButton from "@/components/common/HomeButton";
import ShiftForm from "@/features/shift/components/ShiftForm";

export default function SubmitPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 via-slate-50 to-zinc-100/80 p-6 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6 md:space-y-8">
        <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-xl shadow-zinc-200/50 backdrop-blur-md">
          <HomeButton />
        </div>

        <ShiftForm />
      </div>
    </main>
  );
}
