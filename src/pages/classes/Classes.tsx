import { useEffect, useState, useCallback } from "react";
import Cookies from "js-cookie";
import { Link } from "react-router-dom";
import { Plus, Search, MapPin, Users, PenBox, Link as LinkIcon, Trash2 } from "lucide-react";
import { CreateClassModal } from "./components/CreateClassModal";
import { JoinClassModal } from "./components/JoinClassModal";
import { jwtDecode } from "jwt-decode";
interface Classroom {
  classId: string;
  teacherId: string;
  className: string;
  description: string;
  room: string;
  topic: string;
  joinCode: string;
  joinLink: string;
  status: string;
  createdAt: string;
}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export default function ClassroomsPage() {
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);

  // Role State
  const [role] = useState<"student" | "teacher">(() => {
    const token = Cookies.get("token");
    if (!token) return "student";
    try {
      const decoded = jwtDecode<{ role?: "student" | "teacher" }>(token);
      return decoded.role === "teacher" ? "teacher" : "student";
    } catch {
      return "student";
    }
  });

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const fetchClasses = useCallback(async () => {
    try {
      const token = Cookies.get("token");
      const endpoint = role === "teacher" ? `${API_BASE}/api/v1/classes` : `${API_BASE}/api/v1/students/classes`;
      const res = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setClasses(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch classes", error);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchClasses();
  }, [fetchClasses]);

  const handleDelete = async (classId: string) => {
    if (!confirm("Are you sure you want to delete this class?")) return;
    try {
      const token = Cookies.get("token");
      await fetch(`${API_BASE}/api/v1/classes/${classId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      fetchClasses();
    } catch (error) {
      console.error("Failed to delete class", error);
    }
  };

  const filteredClasses = classes.filter((cls) => {
    const matchesSearch = cls.className.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (cls.description && cls.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (cls.room && cls.room.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (statusFilter === "All Status") return matchesSearch;
    const isStatusMatch = statusFilter === "Active" ? cls.status === "ACTIVE" : cls.status !== "ACTIVE";
    return matchesSearch && isStatusMatch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Classrooms</h1>
          <p className="text-gray-500">Manage and monitor all classroom facilities</p>
        </div>
        {role === "teacher" ? (
          <button 
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Add Classroom
          </button>
        ) : (
          <button 
            onClick={() => setShowJoinModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Join Classroom
          </button>
        )}
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search classrooms..." 
            className="w-full pl-10 pr-4 py-2 text-gray-600 bg-gray-50 border border-gray-400 rounded-md outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-gray-200 px-4 py-2 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
        >
          <option>All Status</option>
          <option>Active</option>
          <option>Ended</option>
        </select>
      </div>

      {/* CLASSES GRID */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading classes...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredClasses.map((cls) => (
            <div key={cls.classId} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col group relative">
              <Link to={`/${role}/classes/${cls.classId}`} className="absolute inset-0 z-0"></Link>
              <div className="h-32 bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500"></div>
              
              <div className="p-5 flex flex-col flex-1 space-y-4">
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <Link to={`/${role}/classes/${cls.classId}`} className="hover:underline">
                      <h3 className="font-semibold text-lg text-gray-800 line-clamp-1">{cls.className}</h3>
                    </Link>
                    <p className="text-gray-500 text-sm line-clamp-1">{cls.description || "No description"}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${cls.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {cls.status === "ACTIVE" ? "available" : "end"}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600 flex-1 relative z-10 pointer-events-none">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-gray-400" />
                    <span className="line-clamp-1">Phòng: {cls.room || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-gray-400" />
                    <span>Sĩ số: N/A</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PenBox size={16} className="text-gray-400" />
                    <span>Mã mời: {cls.joinCode}</span>
                  </div>
                </div>

                {role === "teacher" && (
                  <div className="flex gap-2 mt-auto pt-2 border-t border-gray-50 relative z-10">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        navigator.clipboard.writeText(cls.joinCode);
                        alert("Tạo mã mời đã copy!");
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-md hover:bg-gray-50 text-gray-700 text-sm transition-colors"
                    >
                      <LinkIcon size={16} />
                      Copy link
                    </button>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        handleDelete(cls.classId);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-md hover:bg-red-50 text-red-600 text-sm transition-colors"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {filteredClasses.length === 0 && (
             <div className="col-span-full text-center py-12 text-gray-500">No classes found matching your criteria.</div>
          )}
        </div>
      )}

      {/* IMPORTED MODAL COMPONENT */}
      <CreateClassModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        onSuccess={() => {
          setShowModal(false);
          fetchClasses();
        }} 
      />
      <JoinClassModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onSuccess={() => {
          setShowJoinModal(false);
          fetchClasses();
        }}
      />
    </div>
  );
}