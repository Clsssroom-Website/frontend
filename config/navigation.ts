import { LayoutDashboard, Users, BookOpen, BarChart, Settings } from 'lucide-react';

export const sidebarLinks = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Users',
    href: '/users',
    icon: Users,
  },
  {
    label: 'Courses',
    href: '/courses',
    icon: BookOpen,
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: BarChart,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];
