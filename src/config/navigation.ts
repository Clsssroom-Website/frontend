import { LayoutDashboard, BookOpen, BarChart, Settings } from 'lucide-react';

export const teacherLinks = [
  {
    label: 'Manage Classes',
    href: '/teacher/classes',
    icon: BookOpen,
  },
  {
    label: 'Reports',
    href: '/teacher/reports',
    icon: BarChart,
  },
];

export const studentLinks = [
  {
    label: 'Dashboard',
    href: '/student/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Settings',
    href: '/student/settings',
    icon: Settings,
  }

];
