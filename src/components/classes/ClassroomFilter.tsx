interface ClassroomFilterProps {
  statusFilter: string;
  onFilterChange: (status: string) => void;
}

export function ClassroomFilter({ statusFilter, onFilterChange }: ClassroomFilterProps) {
  return (
    <select 
      value={statusFilter}
      onChange={(e) => onFilterChange(e.target.value)}
      className="bg-white border border-gray-200 px-4 py-2 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
    >
      <option value="All Status">All Status</option>
      <option value="Active">Active</option>
      <option value="Ended">Ended</option>
    </select>
  );
}
