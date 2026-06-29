'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Avatar } from '@/components/ui';
import { CheckCircle2, XCircle, Wifi, Info } from 'lucide-react';
import { relativeTime } from '@/lib/format';
import { MOCK_CREATORS } from '@/lib/mock-creators';

export default function CustomProxyPage() {
  const router = useRouter();
  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  const enabledCount = MOCK_CREATORS.filter((c) => c.proxyEnabled).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Custom proxy</h1>
        <p className="mt-1 text-sm text-text-muted">
          Route each creator&apos;s platform traffic through a dedicated IP address.
        </p>
      </div>

      {/* Info card */}
      <div className="bg-violet-600/[0.07] border border-violet-600/20 rounded-xl px-4 py-3.5 flex items-start gap-3">
        <Info size={15} className="text-violet-400 mt-0.5 shrink-0" />
        <p className="text-sm text-text-secondary leading-relaxed">
          Using a dedicated proxy per creator prevents platforms from flagging logins from shared IPs.
          Use residential or datacenter proxies from the same country as the creator.
          SOCKS5 and HTTP proxies are both supported.
        </p>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-success" />
          <span className="text-xs text-text-muted">{enabledCount} proxies active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-bg-overlay border border-bg-border" />
          <span className="text-xs text-text-muted">{MOCK_CREATORS.length - enabledCount} without proxy</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border/40">
                {['Creator', 'Status', 'Host / IP', 'Port', 'Last verified', ''].map((col) => (
                  <th
                    key={col}
                    className="text-left text-[11px] font-semibold text-text-disabled uppercase tracking-[0.06em] px-4 py-2.5"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-bg-border/40">
              {MOCK_CREATORS.map((creator) => (
                <tr
                  key={creator.id}
                  className="hover:bg-bg-subtle/40 transition-colors duration-100"
                >
                  {/* Creator */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={creator.displayName} size="sm" />
                      <div>
                        <p className="font-medium text-text-primary">{creator.displayName}</p>
                        <p className="text-xs text-text-muted">@{creator.username}</p>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    {creator.proxyEnabled ? (
                      <div className="flex items-center gap-1.5 text-success-text">
                        <CheckCircle2 size={13} />
                        <span className="text-xs font-medium">Active</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-text-muted">
                        <XCircle size={13} />
                        <span className="text-xs">Disabled</span>
                      </div>
                    )}
                  </td>

                  {/* Host */}
                  <td className="px-4 py-3">
                    {creator.proxyHost ? (
                      <code className="text-xs font-mono text-text-secondary bg-bg-subtle px-2 py-0.5 rounded">
                        {creator.proxyHost}
                      </code>
                    ) : (
                      <span className="text-text-disabled">—</span>
                    )}
                  </td>

                  {/* Port */}
                  <td className="px-4 py-3">
                    {creator.proxyPort ? (
                      <code className="text-xs font-mono text-text-secondary">{creator.proxyPort}</code>
                    ) : (
                      <span className="text-text-disabled">—</span>
                    )}
                  </td>

                  {/* Last verified */}
                  <td className="px-4 py-3 text-xs text-text-muted">
                    {creator.proxyLastVerified
                      ? relativeTime(creator.proxyLastVerified)
                      : '—'}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {creator.proxyEnabled && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-violet-400 transition-colors"
                        >
                          <Wifi size={11} />
                          Test
                        </button>
                      )}
                      <button
                        type="button"
                        className="text-xs text-text-muted hover:text-violet-400 transition-colors"
                        onClick={() => router.push(`/creators/${creator.id}?tab=settings`)}
                      >
                        {creator.proxyEnabled ? 'Edit' : 'Configure'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-bg-border/40 bg-bg-subtle/20">
          <p className="text-xs text-text-disabled">
            Proxy settings are applied per creator. Click &quot;Configure&quot; or visit a creator&apos;s Settings tab to add or update proxy credentials.
          </p>
        </div>
      </div>
    </div>
  );
}
