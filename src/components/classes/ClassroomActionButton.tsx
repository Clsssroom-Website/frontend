import { Plus } from "lucide-react";

interface ClassroomActionButtonProps {
  role: "student" | "teacher";
  onClick: () => void;
}

export function ClassroomActionButton({ role, onClick }: ClassroomActionButtonProps) {
  return (
    <button 
      onClick={onClick}
      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
    >
      <Plus size={20} />
      {role === "teacher" ? "Add Classroom" : "Join Classroom"}
    </button>
  );
}
