import { LogoIcon } from '@/components/brand/Logo';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center w-16 h-16">
          <div
            className="absolute inset-0 rounded-full animate-spin"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0%, #7C3AED 35%, #A855F7 55%, transparent 75%)',
              WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))',
              mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))',
            }}
          />
          <LogoIcon size={40} />
        </div>
        <p className="text-sm text-text-secondary tracking-wide">Loading…</p>
      </div>
    </div>
  );
}
