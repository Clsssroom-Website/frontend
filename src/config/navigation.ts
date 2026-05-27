import { LayoutDashboard, BookOpen, Settings, ClipboardCheck } from 'lucide-react';

export const teacherLinks = [
  {
    label: 'Dashboard',
    href: '/teacher/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Quản lý lớp học',
    href: '/teacher/classes',
    icon: BookOpen,
  },
  {
    label: 'Chấm bài',
    href: '/teacher/submissions',
    icon: ClipboardCheck,
  },
  {
    label: 'Settings',
    href: '/teacher/settings',
    icon: Settings,
  },
];

export const studentLinks = [
  {
    label: 'Dashboard',
    href: '/student/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'My Classes',
    href: '/student/classes',
    icon: BookOpen,
  },
  {
    label: 'Settings',
    href: '/student/settings',
    icon: Settings,
  }
];
