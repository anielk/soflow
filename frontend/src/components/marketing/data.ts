import type { LucideIcon } from 'lucide-react';
import {
  FileText,
  Image as ImageIcon,
  BarChart3,
  Sparkles,
  Building2,
  UserCircle,
  Users,
  Zap,
  ShieldCheck,
} from 'lucide-react';

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

// Each of these maps to a real, already-shipped area of the product —
// nothing here describes a capability that doesn't exist.
export const FEATURES: Feature[] = [
  {
    icon: FileText,
    title: 'Content Manager',
    description: 'Plan, schedule, and publish content across every connected platform from a single queue.',
  },
  {
    icon: ImageIcon,
    title: 'Media Library',
    description: 'Upload, organize, and preview images and video with automatic thumbnails and secure storage.',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'Track revenue, engagement, and growth across creators, fans, and teams in real time.',
  },
  {
    icon: Sparkles,
    title: 'AI Assistant',
    description: 'Connect the AI providers you already use to draft, automate, and optimize creator workflows.',
  },
  {
    icon: Building2,
    title: 'Workspace Management',
    description: 'Multi-tenant workspaces with role-based access for agencies managing multiple brands.',
  },
  {
    icon: UserCircle,
    title: 'Creator Profiles',
    description: 'Centralized profiles with performance history, platform connections, and account health.',
  },
  {
    icon: Users,
    title: 'Employee Management',
    description: 'Assign roles, schedules, and permissions for every member of your agency team.',
  },
  {
    icon: Zap,
    title: 'Smart Automation',
    description: 'Automate repetitive growth and messaging tasks so your team can focus on strategy.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Infrastructure',
    description: 'Role-based access control, workspace isolation, and encrypted secrets by default.',
  },
];

export type RoadmapStatus = 'released' | 'in-progress' | 'planned' | 'future';

export interface RoadmapItem {
  status: RoadmapStatus;
  title: string;
  description: string;
}

export const ROADMAP_STATUS_LABEL: Record<RoadmapStatus, string> = {
  released: 'Released',
  'in-progress': 'In Progress',
  planned: 'Planned',
  future: 'Future',
};

// Deliberately no dates — statuses only. Extend this array with real items
// as they ship; nothing else on the roadmap page needs to change.
export const ROADMAP_ITEMS: RoadmapItem[] = [
  {
    status: 'released',
    title: 'Multi-Tenant Workspaces',
    description: 'Role-based workspace foundation for agencies managing multiple teams and creators.',
  },
  {
    status: 'released',
    title: 'Media Library',
    description: 'Upload, thumbnail generation, search, and secure storage for images and video.',
  },
  {
    status: 'released',
    title: 'Admin Platform',
    description: 'Platform-wide administration: users, workspaces, connectors, and system health.',
  },
  {
    status: 'released',
    title: 'Deployment Automation',
    description: 'One-command install, update, backup, and health checks for self-hosted deployments.',
  },
  {
    status: 'in-progress',
    title: 'Advanced AI Workflows',
    description: 'Deeper AI-assisted content drafting and workflow automation across providers.',
  },
  {
    status: 'in-progress',
    title: 'Expanded Analytics',
    description: 'Richer cross-platform reporting and forecasting for agencies and creators.',
  },
  {
    status: 'planned',
    title: 'Mobile App',
    description: 'A native companion app for managing creators and content on the go.',
  },
  {
    status: 'planned',
    title: 'Team Permission Presets',
    description: 'Ready-made role templates for common agency team structures.',
  },
  {
    status: 'future',
    title: 'Marketplace Integrations',
    description: 'Connect additional platforms and third-party tools into the Leinaflow workspace.',
  },
  {
    status: 'future',
    title: 'Public API',
    description: 'A documented API for teams that want to build on top of Leinaflow.',
  },
];

export interface PricingTier {
  name: string;
  tagline: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
  ctaHref: string;
}

// No dollar figures anywhere, per the "do not invent final prices" instruction.
export const PRICING_TIERS: PricingTier[] = [
  {
    name: 'Starter',
    tagline: 'For individual creators and small teams getting started.',
    features: ['Up to 3 team members', 'Content Manager & Media Library', 'Core analytics', 'Email support'],
    cta: 'Start Free Trial',
    ctaHref: '/register',
  },
  {
    name: 'Business',
    tagline: 'For growing agencies managing multiple creators.',
    features: [
      'Unlimited team members',
      'Workspace management',
      'Advanced analytics',
      'AI Assistant access',
      'Priority support',
    ],
    highlighted: true,
    cta: 'Start Free Trial',
    ctaHref: '/register',
  },
  {
    name: 'Enterprise',
    tagline: 'For agencies with advanced security and scale needs.',
    features: [
      'Everything in Business',
      'Dedicated infrastructure',
      'Custom integrations',
      'Dedicated account manager',
    ],
    cta: 'Contact Sales',
    ctaHref: '/contact',
  },
];
