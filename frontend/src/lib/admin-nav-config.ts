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
  Mail,
  Activity,
  type LucideIcon,
} from 'lucide-react';

export interface AdminNavItem {
  id:    string;
  label: string;
  href:  string;
  icon:  LucideIcon;
  badge?: string;
}

// `badge: 'Cloudivo'` marks a page that belongs to Cloudivo's shared platform
// administration, not to Leinaflow itself — see docs/deployment/
// Architecture.md's multi-product notes. Those pages stay as UI shells (no
// fabricated data, no working buttons) rather than being built out here.
export const adminNavItems: AdminNavItem[] = [
  { id: 'admin-dashboard',      label: 'Dashboard',       href: '/admin',               icon: LayoutDashboard },
  { id: 'admin-customers',      label: 'Customers',       href: '/admin/customers',     icon: Building2,       badge: 'Cloudivo' },
  { id: 'admin-workspaces',     label: 'Workspaces',      href: '/admin/workspaces',    icon: Layers          },
  { id: 'admin-users',          label: 'Users',           href: '/admin/users',         icon: Users           },
  { id: 'admin-subscriptions',  label: 'Subscriptions',   href: '/admin/subscriptions', icon: CreditCard,      badge: 'Cloudivo' },
  { id: 'admin-billing',        label: 'Billing',         href: '/admin/billing',       icon: Receipt,         badge: 'Cloudivo' },
  { id: 'admin-ai',             label: 'AI',              href: '/admin/ai',            icon: Bot,             badge: 'Cloudivo' },
  { id: 'admin-communication',  label: 'Communication',   href: '/admin/communication', icon: Mail            },
  { id: 'admin-connectors',     label: 'Connectors',      href: '/admin/connectors',    icon: Plug,            badge: 'Cloudivo' },
  { id: 'admin-infrastructure', label: 'Infrastructure',  href: '/admin/infrastructure',icon: Server,          badge: 'Cloudivo' },
  { id: 'admin-logs',           label: 'Logs',            href: '/admin/logs',          icon: ScrollText      },
  { id: 'admin-system',         label: 'System',          href: '/admin/system',        icon: Activity        },
  { id: 'admin-flags',          label: 'Feature Flags',   href: '/admin/feature-flags', icon: ToggleLeft,      badge: 'Cloudivo' },
  { id: 'admin-settings',       label: 'System Settings', href: '/admin/settings',      icon: Settings,        badge: 'Cloudivo' },
];
