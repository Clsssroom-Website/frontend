import { Link, useLocation } from "react-router-dom";
import { teacherLinks, studentLinks } from "../config/navigation";
import { GraduationCap, X } from "lucide-react";
import clsx from "clsx";
import useAuthStore from "../store/useAuthStore";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const pathname = location.pathname;
  
  const user = useAuthStore((state) => state.user);
  const role = user?.role === "teacher" ? "teacher" : "student";

  const links = role === "teacher" ? teacherLinks : studentLinks;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <Link to="/" className="flex items-center gap-2 text-blue-600">
            <GraduationCap className="w-8 h-8" />
            <span className="text-xl font-bold text-gray-900 tracking-tight">Classroom</span>
          </Link>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 lg:hidden text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
            Menu
          </div>
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => onClose()}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className={clsx("w-5 h-5", isActive ? "text-blue-600" : "text-gray-400")} />
                {link.label}
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
}
