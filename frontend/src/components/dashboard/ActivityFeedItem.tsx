import { UserPlus, Heart, ShoppingBag, MessageCircle, RefreshCw, Calendar } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { formatCurrency, relativeTime } from '@/lib/format';
import type { ActivityItem, ActivityType } from '@/types/dashboard';

interface ActivityConfig {
  label:  string;
  icon:   LucideIcon;
  color:  string; // hex
  bg:     string; // rgba
}

const CONFIG: Record<ActivityType, ActivityConfig> = {
  new_subscriber: { label: 'subscribed',       icon: UserPlus,      color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  tip:            { label: 'sent a tip',        icon: Heart,         color: '#EC4899', bg: 'rgba(236,72,153,0.12)' },
  ppv_purchase:   { label: 'purchased a post',  icon: ShoppingBag,   color: '#3B82F6', bg: 'rgba(59,130,246,0.12)'  },
  message:        { label: 'paid message',      icon: MessageCircle, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  renewal:        { label: 'renewed',           icon: RefreshCw,     color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  post_scheduled: { label: 'post scheduled',    icon: Calendar,      color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
};

interface ActivityFeedItemProps {
  item: ActivityItem;
}

export function ActivityFeedItem({ item }: ActivityFeedItemProps) {
  const cfg   = CONFIG[item.type];
  const Icon  = cfg.icon;
  const time  = relativeTime(item.timestamp);

  return (
    <div className="flex items-center gap-3 py-2.5 px-4 hover:bg-bg-subtle transition-colors duration-100 group">
      {/* Colored left accent */}
      <div
        className="w-0.5 h-8 rounded-full shrink-0 self-center"
        style={{ backgroundColor: cfg.color }}
        aria-hidden="true"
      />

      {/* Fan avatar */}
      <Avatar name={item.fanName} size="sm" />

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary truncate">
          <span className="font-medium">{item.fanName}</span>
          <span className="text-text-muted"> {cfg.label}</span>
        </p>
      </div>

      {/* Right side: amount + time */}
      <div className="flex items-center gap-3 shrink-0">
        {item.amount != null && (
          <span
            className="text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full"
            style={{ color: cfg.color, backgroundColor: cfg.bg }}
          >
            {formatCurrency(item.amount)}
          </span>
        )}
        <div className="flex items-center gap-1.5">
          <Icon size={12} style={{ color: cfg.color }} className="shrink-0 opacity-60" />
          <span className="text-xs text-text-disabled tabular-nums whitespace-nowrap">{time}</span>
        </div>
      </div>
    </div>
  );
}
