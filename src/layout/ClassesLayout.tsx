import type { ReactNode } from "react";
import { ClassroomSearch } from "../components/classes/ClassroomSearch";
import { ClassroomFilter } from "../components/classes/ClassroomFilter";

interface ClassesLayoutProps {
  title: string;
  description: string;
  actionButton?: ReactNode;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onFilterChange: (status: string) => void;
  loading: boolean;
  isEmpty: boolean;
  children: ReactNode;
  modals?: ReactNode;
}

export function ClassesLayout({
  title,
  description,
  actionButton,
  searchQuery,
  onSearchChange,
  statusFilter,
  onFilterChange,
  loading,
  isEmpty,
  children,
  modals
}: ClassesLayoutProps) {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
          <p className="text-gray-500">{description}</p>
        </div>
        {actionButton}
      </div>

      <div className="flex gap-4">
        <ClassroomSearch searchQuery={searchQuery} onSearchChange={onSearchChange} />
        <ClassroomFilter statusFilter={statusFilter} onFilterChange={onFilterChange} />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading classes...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {children}
          {isEmpty && (
            <div className="col-span-full text-center py-12 text-gray-500">No classes found matching your criteria.</div>
          )}
        </div>
      )}

      {modals}
    </div>
  );
}
