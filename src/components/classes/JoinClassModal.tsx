import { useState } from "react";
import { classroomService } from "../../services/classroomService";
import { X } from "lucide-react";
import toast from "react-hot-toast";

interface JoinClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}


export function JoinClassModal({ isOpen, onClose, onSuccess }: JoinClassModalProps) {
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      toast.error("Please enter a valid join code.");
      return;
    }

    setLoading(true);
    try {
      const data: any = await classroomService.joinClass(joinCode.trim());
      
      if (data && data.success) {
        toast.success("Successfully joined the classroom!");
        onSuccess();
      } else {
        toast.error(data?.message || "Failed to join classroom. Please check your join code.");
      }
    } catch (error) {
      console.error("Join class error:", error);
      toast.error("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">Join Classroom</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="joinCode" className="block text-sm font-medium text-gray-700 mb-1">
              Class Code <span className="text-red-500">*</span>
            </label>
            <input 
              id="joinCode"
              type="text" 
              required
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="e.g. ABC123XYZ"
              className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
            />
            <p className="mt-1 text-xs text-gray-500">Ask your teacher for the class code, then enter it here.</p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Joining..." : "Join"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
