import Image from 'next/image';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?:      string | null;
  name?:     string;
  size?:     AvatarSize;
  online?:   boolean;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'w-5 h-5 text-2xs',
  sm: 'w-7 h-7 text-xs',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
  xl: 'w-12 h-12 text-base',
};

const dotSizes: Record<AvatarSize, string> = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2    h-2',
  md: 'w-2    h-2',
  lg: 'w-2.5  h-2.5',
  xl: 'w-3    h-3',
};

const pxSizes: Record<AvatarSize, number> = { xs: 20, sm: 28, md: 32, lg: 40, xl: 48 };

function initials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ src, name, size = 'md', online, className = '' }: AvatarProps) {
  const px = pxSizes[size];

  return (
    <span className={['relative inline-flex shrink-0', sizeClasses[size], className].join(' ')}>
      {src ? (
        <Image
          src={src}
          alt={name ?? 'avatar'}
          width={px}
          height={px}
          className="rounded-full object-cover w-full h-full"
        />
      ) : (
        <span className="rounded-full bg-violet-600/20 text-violet-400 font-medium flex items-center justify-center w-full h-full select-none">
          {initials(name)}
        </span>
      )}
      {online !== undefined && (
        <span
          className={[
            'absolute bottom-0 right-0 rounded-full border-2 border-bg-base',
            dotSizes[size],
            online ? 'bg-success' : 'bg-bg-muted',
          ].join(' ')}
        />
      )}
    </span>
  );
}
