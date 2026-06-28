import {
  LayoutDashboard,
  Home,
  FilePlus,
  Bell,
  MessageSquare,
  Archive,
  ListOrdered,
  FolderOpen,
  Receipt,
  BarChart3,
  Users,
  FileText,
  UserCheck,
  Activity,
  Zap,
  List,
  UserPlus,
  ScrollText,
  Megaphone,
  Link2,
  Tag,
  Bot,
  Compass,
  CalendarClock,
  Settings2,
  UsersRound,
  Globe,
  UserCog,
  Clock,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  id:      string;
  label:   string;
  href:    string;
  icon:    LucideIcon;
  badge?:  number | string;
  disabled?: boolean;
}

export interface NavGroup {
  id:           string;
  label:        string;
  collapsible:  boolean;
  defaultOpen?: boolean;
  items:        NavItem[];
}

export type NavEntry =
  | ({ kind: 'item' } & NavItem)
  | ({ kind: 'group' } & NavGroup)
  | ({ kind: 'divider'; id: string });

export const navConfig: NavEntry[] = [
  {
    kind:     'item',
    id:       'dashboard',
    label:    'Dashboard',
    href:     '/dashboard',
    icon:     LayoutDashboard,
  },
  {
    kind:        'group',
    id:          'of-manager',
    label:       'OF Manager',
    collapsible: true,
    defaultOpen: false,
    items: [
      { id: 'of-home',          label: 'Home',          href: '/of-manager',              icon: Home       },
      { id: 'of-new-post',      label: 'New post',      href: '/of-manager/new-post',     icon: FilePlus   },
      { id: 'of-notifications', label: 'Notifications', href: '/of-manager/notifications',icon: Bell,  badge: 3 },
      { id: 'of-messages',      label: 'Messages Basic',href: '/messages',                icon: MessageSquare },
      { id: 'of-vault',         label: 'Vault',         href: '/of-manager/vault',        icon: Archive    },
      { id: 'of-queue',         label: 'Queue',         href: '/of-manager/queue',        icon: ListOrdered },
      { id: 'of-collections',   label: 'Collections',   href: '/of-manager/collections',  icon: FolderOpen },
      { id: 'of-statements',    label: 'Statements',    href: '/of-manager/statements',   icon: Receipt    },
      { id: 'of-statistics',    label: 'Statistics',    href: '/analytics',               icon: BarChart3  },
    ],
  },
  {
    kind:        'group',
    id:          'analytics',
    label:       'Analytics',
    collapsible: true,
    defaultOpen: false,
    items: [
      { id: 'analytics-creators',  label: 'Creator reports',  href: '/analytics/creators',  icon: Users     },
      { id: 'analytics-employees', label: 'Employee reports', href: '/analytics/employees', icon: UserCheck },
      { id: 'analytics-fans',      label: 'Fan reports',      href: '/analytics/fans',      icon: FileText  },
      { id: 'analytics-messages',  label: 'Message dashboard',href: '/analytics/messages',  icon: Activity  },
    ],
  },
  {
    kind:    'item',
    id:      'messages-pro',
    label:   'Messages Pro',
    href:    '/messages-pro',
    icon:    MessageSquare,
    badge:   0,
  },
  {
    kind:        'group',
    id:          'growth',
    label:       'Growth',
    collapsible: true,
    defaultOpen: false,
    items: [
      { id: 'growth-smart-messages', label: 'Smart Messages',     href: '/growth/smart-messages',    icon: Zap        },
      { id: 'growth-smart-lists',    label: 'Smart Lists',        href: '/growth/smart-lists',       icon: List       },
      { id: 'growth-auto-follow',    label: 'Auto-follow',        href: '/growth/auto-follow',       icon: UserPlus   },
      { id: 'growth-vault-pro',      label: 'Vault Pro',          href: '/growth/vault-pro',         icon: Archive    },
      { id: 'growth-scripts',        label: 'Scripts',            href: '/growth/scripts',           icon: ScrollText },
      { id: 'growth-promotion',      label: 'Profile promotion',  href: '/growth/promotion',         icon: Megaphone  },
      { id: 'growth-free-trial',     label: 'Free trial links',   href: '/growth/free-trial',        icon: Link2      },
      { id: 'growth-tracking',       label: 'Tracking links',     href: '/growth/tracking',          icon: Tag        },
      { id: 'growth-sensitive',      label: 'Sensitive words',    href: '/growth/sensitive-words',   icon: ScrollText },
      { id: 'growth-ai-copilot',     label: 'AI Copilot',         href: '/growth/ai-copilot',        icon: Bot        },
    ],
  },
  {
    kind:        'group',
    id:          's4s',
    label:       'Share for Share',
    collapsible: true,
    defaultOpen: false,
    items: [
      { id: 's4s-discover',  label: 'Discover creators', href: '/s4s/discover',  icon: Compass      },
      { id: 's4s-requests',  label: 'Requests',          href: '/s4s/requests',  icon: UsersRound   },
      { id: 's4s-schedule',  label: 'S4S schedule',      href: '/s4s/schedule',  icon: CalendarClock},
      { id: 's4s-settings',  label: 'S4S settings',      href: '/s4s/settings',  icon: Settings2    },
    ],
  },
  {
    kind:        'group',
    id:          'creators',
    label:       'Creators',
    collapsible: true,
    defaultOpen: false,
    items: [
      { id: 'creators-manage', label: 'Manage creators', href: '/creators',       icon: UsersRound },
      { id: 'creators-proxy',  label: 'Custom proxy',    href: '/creators/proxy', icon: Globe      },
    ],
  },
  {
    kind:        'group',
    id:          'employees',
    label:       'Employees',
    collapsible: true,
    defaultOpen: false,
    items: [
      { id: 'employees-manage',   label: 'Manage employees', href: '/employees',          icon: UserCog },
      { id: 'employees-schedule', label: 'Shift schedule',   href: '/employees/schedule', icon: Clock   },
    ],
  },
];
