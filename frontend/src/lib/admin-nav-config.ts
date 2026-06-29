import {
  LayoutDashboard,
  Building2,
  Layers,
  Users,
  CreditCard,
  Receipt,
  Bot,
  Plug,
  Server,
  ScrollText,
  ToggleLeft,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface AdminNavItem {
  id:    string;
  label: string;
  href:  string;
  icon:  LucideIcon;
  badge?: string;
}

export const adminNavItems: AdminNavItem[] = [
  { id: 'admin-dashboard',      label: 'Dashboard',       href: '/admin',               icon: LayoutDashboard },
  { id: 'admin-customers',      label: 'Customers',       href: '/admin/customers',     icon: Building2       },
  { id: 'admin-workspaces',     label: 'Workspaces',      href: '/admin/workspaces',    icon: Layers          },
  { id: 'admin-users',          label: 'Users',           href: '/admin/users',         icon: Users           },
  { id: 'admin-subscriptions',  label: 'Subscriptions',   href: '/admin/subscriptions', icon: CreditCard      },
  { id: 'admin-billing',        label: 'Billing',         href: '/admin/billing',       icon: Receipt         },
  { id: 'admin-ai',             label: 'AI',              href: '/admin/ai',            icon: Bot             },
  { id: 'admin-connectors',     label: 'Connectors',      href: '/admin/connectors',    icon: Plug            },
  { id: 'admin-infrastructure', label: 'Infrastructure',  href: '/admin/infrastructure',icon: Server          },
  { id: 'admin-logs',           label: 'Logs',            href: '/admin/logs',          icon: ScrollText      },
  { id: 'admin-flags',          label: 'Feature Flags',   href: '/admin/feature-flags', icon: ToggleLeft      },
  { id: 'admin-settings',       label: 'System Settings', href: '/admin/settings',      icon: Settings        },
];
