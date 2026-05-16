import { Search } from "lucide-react";

interface ClassroomSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function ClassroomSearch({ searchQuery, onSearchChange }: ClassroomSearchProps) {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
      <input 
        type="text" 
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search classrooms..." 
        className="w-full pl-10 pr-4 py-2 text-gray-600 bg-gray-50 border border-gray-400 rounded-md outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}
