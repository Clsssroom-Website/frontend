import { LayoutDashboard, Users, BookOpen, BarChart, Settings, ClipboardList } from 'lucide-react';

export const teacherLinks = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Manage Users',
    href: '/users',
    icon: Users,
  },
  {
    label: 'Manage Courses',
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

export const studentLinks = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'My Courses',
    href: '/courses',
    icon: BookOpen,
  },
  {
    label: 'My Assignments',
    href: '/assignments',
    icon: ClipboardList,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];
