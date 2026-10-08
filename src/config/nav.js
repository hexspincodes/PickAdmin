import {
  LayoutDashboard,
  UsersRound,
  UserCog,
  Wallet,
  ClipboardList,
  Briefcase,
  Newspaper,
  Mail,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { ROLES } from '../utils/roles';

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: [ROLES.SA, ROLES.A, ROLES.MARKETING], group: 'main' },
  { to: '/maids', label: 'Maids', icon: ClipboardList, roles: [ROLES.SA, ROLES.A], group: 'main' },
  { to: '/jobs', label: 'Job Listings', icon: Briefcase, roles: [ROLES.SA, ROLES.A], group: 'main' },
  { to: '/blog', label: 'Blog', icon: Newspaper, roles: [ROLES.SA, ROLES.MARKETING], group: 'main' },
  { to: '/contact', label: 'Contact Messages', icon: Mail, roles: [ROLES.SA, ROLES.A], group: 'main' },
  { to: '/skills', label: 'Skills', icon: Sparkles, roles: [ROLES.SA, ROLES.A], group: 'main' },
  { to: '/customers', label: 'Customers', icon: UsersRound, roles: [ROLES.SA], group: 'other' },
  { to: '/payments', label: 'Payments', icon: Wallet, roles: [ROLES.SA], group: 'other' },
  { to: '/team', label: 'Admin Team', icon: UserCog, roles: [ROLES.SA], group: 'other' },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, roles: [ROLES.SA], group: 'other' },
];
