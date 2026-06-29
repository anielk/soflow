import {
  LayoutDashboard,
  Home,
  FilePlus,
  Bell,
  MessageSquare,
  Archive,
  Library,
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
  id:        string;
  label:     string;
  href:      string;
  icon:      LucideIcon;
  badge?:    number | string;
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
  | ({ kind: 'item' }    & NavItem)
  | ({ kind: 'group' }   & NavGroup)
  | ({ kind: 'divider';    id: string });

export const navConfig: NavEntry[] = [
  {
    kind:  'item',
    id:    'dashboard',
    label: 'Dashboard',
    href:  '/dashboard',
    icon:  LayoutDashboard,
  },
  {
    kind:        'group',
    id:          'creator-manager',
    label:       'Creator Manager',
    collapsible: true,
    defaultOpen: false,
    items: [
      { id: 'cm-home',          label: 'Home',               href: '/creator-manager',              icon: Home          },
      { id: 'cm-new-post',      label: 'New post',           href: '/creator-manager/new-post',     icon: FilePlus      },
      { id: 'cm-notifications', label: 'Notifications',      href: '/creator-manager/notifications',icon: Bell, badge: 3 },
      { id: 'cm-inbox',         label: 'Inbox',              href: '/messages',                     icon: MessageSquare },
      { id: 'cm-vault',         label: 'Media Library',      href: '/creator-manager/vault',        icon: Library       },
      { id: 'cm-queue',         label: 'Publishing Queue',   href: '/creator-manager/queue',        icon: ListOrdered   },
      { id: 'cm-collections',   label: 'Content Collections',href: '/creator-manager/collections',  icon: FolderOpen    },
      { id: 'cm-statements',    label: 'Revenue Statements', href: '/creator-manager/statements',   icon: Receipt       },
      { id: 'cm-analytics',     label: 'Analytics',          href: '/analytics',                    icon: BarChart3     },
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
      { id: 'analytics-audience',  label: 'Audience reports', href: '/analytics/fans',      icon: FileText  },
      { id: 'analytics-messages',  label: 'Message dashboard',href: '/analytics/messages',  icon: Activity  },
    ],
  },
  {
    kind:  'item',
    id:    'inbox-pro',
    label: 'Inbox Pro',
    href:  '/messages-pro',
    icon:  MessageSquare,
    badge: 0,
  },
  {
    kind:        'group',
    id:          'growth',
    label:       'Growth',
    collapsible: true,
    defaultOpen: false,
    items: [
      { id: 'growth-smart-messages', label: 'Smart Messages',      href: '/growth/smart-messages',  icon: Zap        },
      { id: 'growth-smart-lists',    label: 'Smart Lists',         href: '/growth/smart-lists',     icon: List       },
      { id: 'growth-auto-follow',    label: 'Auto-follow',         href: '/growth/auto-follow',     icon: UserPlus   },
      { id: 'growth-vault-pro',      label: 'Media Library Pro',   href: '/growth/vault-pro',       icon: Archive    },
      { id: 'growth-templates',      label: 'Message Templates',   href: '/growth/scripts',         icon: ScrollText },
      { id: 'growth-promotion',      label: 'Profile promotion',   href: '/growth/promotion',       icon: Megaphone  },
      { id: 'growth-free-trial',     label: 'Free trial links',    href: '/growth/free-trial',      icon: Link2      },
      { id: 'growth-tracking',       label: 'Tracking links',      href: '/growth/tracking',        icon: Tag        },
      { id: 'growth-sensitive',      label: 'Sensitive words',     href: '/growth/sensitive-words', icon: ScrollText },
      { id: 'growth-ai-copilot',     label: 'AI Copilot',          href: '/growth/ai-copilot',      icon: Bot        },
    ],
  },
  {
    kind:        'group',
    id:          's4s',
    label:       'Collaborations',
    collapsible: true,
    defaultOpen: false,
    items: [
      { id: 's4s-discover',  label: 'Discover creators', href: '/s4s/discover',  icon: Compass       },
      { id: 's4s-requests',  label: 'Requests',          href: '/s4s/requests',  icon: UsersRound    },
      { id: 's4s-schedule',  label: 'Schedule',          href: '/s4s/schedule',  icon: CalendarClock },
      { id: 's4s-settings',  label: 'Settings',          href: '/s4s/settings',  icon: Settings2     },
    ],
  },
  {
    kind:        'group',
    id:          'creators',
    label:       'Creator Accounts',
    collapsible: true,
    defaultOpen: false,
    items: [
      { id: 'creators-manage', label: 'Manage accounts', href: '/creators',       icon: UsersRound },
      { id: 'creators-proxy',  label: 'Network proxy',   href: '/creators/proxy', icon: Globe      },
    ],
  },
  {
    kind:        'group',
    id:          'employees',
    label:       'Team',
    collapsible: true,
    defaultOpen: false,
    items: [
      { id: 'employees-manage',   label: 'Manage team',    href: '/employees',          icon: UserCog },
      { id: 'employees-schedule', label: 'Shift schedule', href: '/employees/schedule', icon: Clock   },
    ],
  },
];
