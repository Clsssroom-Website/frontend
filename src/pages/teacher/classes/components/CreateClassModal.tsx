import { useState } from "react";
import Cookies from "js-cookie";
import { X } from "lucide-react";

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export function CreateClassModal({ isOpen, onClose, onSuccess }: CreateClassModalProps) {
  const [formData, setFormData] = useState({
    className: "",
    description: "",
    room: "",
    topic: "",
  });
  const [creating, setCreating] = useState(false);

  if (!isOpen) return null;

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const token = Cookies.get("token");
      const res = await fetch(`${API_BASE}/api/v1/classes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (res.ok) {
        setFormData({ className: "", description: "", room: "", topic: "" });
        onSuccess();
      } else {
        alert(data.message || "Something went wrong!");
      }
    } catch (error) {
      console.error("Failed to create class", error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-800">Create New Classroom</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleCreateClass} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Class Name <span className="text-red-500">*</span></label>
            <input 
              required
              type="text"
              value={formData.className}
              onChange={(e) => setFormData({...formData, className: e.target.value})}
              className="w-full px-3 py-2 border text-gray-600 border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              placeholder="e.g. Quản lý dự án"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border text-gray-600 border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow resize-none"
              placeholder="Class description..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Room</label>
              <input 
                type="text"
                value={formData.room}
                onChange={(e) => setFormData({...formData, room: e.target.value})}
                className="w-full px-3 py-2 border text-gray-600 border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                placeholder="e.g. 2A33"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Topic</label>
              <input 
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({...formData, topic: e.target.value})}
                className="w-full px-3 py-2 border text-gray-600 border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                placeholder="e.g. HK1-2025"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3 justify-end">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={creating}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {creating ? "Creating..." : "Create Class"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
