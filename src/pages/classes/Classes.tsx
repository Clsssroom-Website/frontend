import { CreateClassModal } from "../../components/classes/CreateClassModal";
import { JoinClassModal } from "../../components/classes/JoinClassModal";
import { ClassroomCard } from "../../components/classes/ClassroomCard";
import { ClassroomSearch } from "../../components/classes/ClassroomSearch";
import { ClassroomFilter } from "../../components/classes/ClassroomFilter";
import { ClassroomActionButton } from "../../components/classes/ClassroomActionButton";
import { useClasses } from "../../hooks/useClasses";

export default function ClassroomsPage() {
  const { 
    loading, role, searchQuery, setSearchQuery, 
    statusFilter, setStatusFilter, filteredClasses, 
    deleteClass, activeModal, openActionModal, 
    closeActionModal, handleActionSuccess 
  } = useClasses();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Classrooms</h1>
          <p className="text-gray-500">Manage and monitor all classroom facilities</p>
        </div>
        <ClassroomActionButton 
          role={role} 
          onClick={openActionModal} 
        />
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="flex gap-4">
        <ClassroomSearch searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <ClassroomFilter statusFilter={statusFilter} onFilterChange={setStatusFilter} />
      </div>

      {/* CLASSES GRID */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading classes...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredClasses.map((cls) => (
            <ClassroomCard key={cls.classId} cls={cls} role={role} onDelete={deleteClass} />
          ))}
          {filteredClasses.length === 0 && (
             <div className="col-span-full text-center py-12 text-gray-500">No classes found matching your criteria.</div>
          )}
        </div>
      )}

      {/* MODALS - Controlled by Facade */}
      <CreateClassModal 
        isOpen={activeModal === "create"} 
        onClose={closeActionModal} 
        onSuccess={handleActionSuccess} 
      />
      <JoinClassModal
        isOpen={activeModal === "join"}
        onClose={closeActionModal}
        onSuccess={handleActionSuccess}
      />
    </div>
  );
}