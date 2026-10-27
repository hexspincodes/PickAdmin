import {
  LayoutDashboard,
  UsersRound,
  UserCog,
  Wallet,
  ClipboardList,
  Newspaper,
  Mail,
  BarChart3,
  Sparkles,
  TicketPercent,
} from 'lucide-react';
import { ROLES } from '../utils/roles';

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: [ROLES.SA, ROLES.A, ROLES.MARKETING], group: 'main' },
  { to: '/maids', label: 'Maids Management', icon: ClipboardList, roles: [ROLES.SA, ROLES.A], group: 'main' },
  { to: '/blog', label: 'Blog Management', icon: Newspaper, roles: [ROLES.SA, ROLES.MARKETING], group: 'main' },
  { to: '/contact', label: 'Contact Messages', icon: Mail, roles: [ROLES.SA, ROLES.A], group: 'main' },
  { to: '/skills', label: 'Skills Management', icon: Sparkles, roles: [ROLES.SA, ROLES.A], group: 'main' },
  { to: '/customers', label: 'Customers Management', icon: UsersRound, roles: [ROLES.SA], group: 'other' },
  { to: '/payments', label: 'Payment Management', icon: Wallet, roles: [ROLES.SA], group: 'other' },
  { to: '/coupons', label: 'Coupon Management', icon: TicketPercent, roles: [ROLES.SA], group: 'other' },
  { to: '/team', label: 'Admin Team', icon: UserCog, roles: [ROLES.SA], group: 'other' },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, roles: [ROLES.SA], group: 'other' },
];
