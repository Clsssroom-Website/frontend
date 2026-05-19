import { useState } from "react";
import { Sun, Moon, Laptop } from "lucide-react";
import { useThemeStore, type Theme } from "../../store/useThemeStore";

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);

  const options: { value: Theme; label: string; icon: any }[] = [
    { value: "light", label: "Sáng", icon: Sun },
    { value: "dark", label: "Tối", icon: Moon },
    { value: "system", label: "Hệ thống", icon: Laptop },
  ];

  const CurrentIcon = options.find((opt) => opt.value === theme)?.icon || Sun;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-indigo-400 dark:hover:bg-gray-800/50 rounded-lg transition-colors cursor-pointer flex items-center justify-center border border-transparent hover:border-gray-200 dark:hover:border-gray-700/50"
        title="Thay đổi giao diện"
      >
        <CurrentIcon className="w-5 h-5 transition-transform duration-300 hover:rotate-12" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close the menu when clicking outside */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 mt-2 w-36 rounded-xl border border-gray-150 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg py-1.5 z-20 animate-in fade-in slide-in-from-top-2 duration-150">
            {options.map((opt) => {
              const Icon = opt.icon;
              const isActive = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    setTheme(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3.5 py-2 text-sm flex items-center gap-2.5 transition-colors cursor-pointer ${
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50/50 dark:bg-indigo-950/30"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/40"
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? "text-indigo-600 dark:text-indigo-400" : ""}`} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
