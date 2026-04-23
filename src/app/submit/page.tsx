import ShiftForm from "@/components/ShiftForm";
import HomeButton from "@/components/HomeButton"; 

export default function SubmitPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        
        <div className="mb-6">
          <HomeButton />
        </div>

        <ShiftForm />

      </div>
    </main>
  );
}