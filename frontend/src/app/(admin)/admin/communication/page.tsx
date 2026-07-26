'use client';

import { useEffect, useState } from 'react';
import { Mail, Send, CheckCircle2, AlertCircle, Server, ArrowRight } from 'lucide-react';
import { Button, Skeleton } from '@/components/ui';
import { getNotificationConfig, sendTestEmail, type NotificationConfig } from '@/lib/notification';

const ARCHITECTURE_STEPS = ['Controllers & business logic', '→', 'NotificationService', '→', 'NotificationProvider', '→', 'SmtpProvider'];

export default function CommunicationPage() {
  const [config, setConfig] = useState<NotificationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    getNotificationConfig()
      .then(setConfig)
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load communication settings'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSendTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await sendTestEmail();
      setTestResult({ ok: true, message: `Test email sent to ${result.sentTo}. Check your inbox.` });
    } catch (err) {
      setTestResult({ ok: false, message: err instanceof Error ? err.message : 'Failed to send test email.' });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-600/15 flex items-center justify-center shrink-0">
            <Mail size={15} className="text-violet-400" />
          </div>
          <h1 className="text-lg font-semibold text-text-primary">Communication</h1>
        </div>
        <p className="mt-1.5 text-sm text-text-muted">
          Notification architecture, SMTP configuration, and delivery testing for the whole platform.
        </p>
      </div>

      {/* Architecture callout */}
      <div className="bg-violet-600/10 border border-violet-500/20 rounded-xl p-4">
        <p className="text-xs font-semibold text-violet-300 mb-1.5">Provider-based notification architecture</p>
        <p className="text-xs text-text-muted leading-relaxed">
          All outbound notifications go through <code className="text-violet-300">NotificationService</code>, which
          delegates to whichever <code className="text-violet-300">NotificationProvider</code> is configured. SMTP is
          the only channel implemented today — Teams, Slack, Discord, push, SMS, and Cloudivo Operations Center (COC) alerts can be added later as
          new providers without changing any call site. Moving to <code className="text-violet-300">smtp.cloudivo.com</code>{' '}
          later is a configuration change only.
        </p>
        <div className="flex items-center gap-2 flex-wrap mt-3 text-xs">
          {ARCHITECTURE_STEPS.map((item, i) =>
            item === '→' ? (
              <ArrowRight key={i} size={12} className="text-text-disabled" />
            ) : (
              <span key={i} className="px-2 py-1 bg-violet-600/15 border border-violet-500/20 rounded-lg text-violet-300 font-medium">
                {item}
              </span>
            ),
          )}
        </div>
      </div>

      {/* SMTP configuration (read-only — set via backend environment variables) */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        <div className="border-b border-bg-border/40 px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">SMTP configuration</h2>
            <p className="text-xs text-text-muted mt-0.5">Configured via environment variables — no secrets are shown here.</p>
          </div>
          <Server size={16} className="text-text-disabled shrink-0" />
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={16} rounded="sm" />)}
          </div>
        ) : loadError ? (
          <div className="p-4 text-sm text-danger-text">{loadError}</div>
        ) : config ? (
          <dl className="divide-y divide-bg-border/40">
            {[
              { label: 'Driver', value: config.driver.toUpperCase() },
              { label: 'Host', value: config.smtpHost },
              { label: 'Port', value: String(config.smtpPort) },
              { label: 'Encryption', value: config.smtpSecure ? 'TLS' : 'None (STARTTLS if offered)' },
              { label: 'Authentication', value: config.smtpUserConfigured ? 'Configured' : 'Not configured' },
              { label: 'Default sender', value: `${config.fromName} <${config.fromEmail}>` },
              { label: 'Reply-To', value: config.replyTo ?? '— (replies go to From address)' },
              { label: 'Notification defaults · Team inbox', value: config.teamEmail },
            ].map(({ label, value }) => (
              <div key={label} className="flex gap-4 px-4 py-2.5">
                <dt className="text-xs text-text-muted w-52 shrink-0">{label}</dt>
                <dd className="text-sm text-text-primary font-mono">{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>

      {/* Test email */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-text-primary">Send a test email</h2>
        <p className="text-xs text-text-muted mt-0.5 mb-4">
          Verifies the SMTP connection and sends a real email to your own account&apos;s address.
        </p>
        <Button variant="primary" size="md" icon={Send} loading={testing} onClick={handleSendTest}>
          Send test email
        </Button>
        {testResult && (
          <div
            className={[
              'mt-3 flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-sm',
              testResult.ok
                ? 'bg-success-subtle border border-success/20 text-success-text'
                : 'bg-danger-subtle border border-danger/20 text-danger-text',
            ].join(' ')}
          >
            {testResult.ok ? <CheckCircle2 size={15} className="shrink-0 mt-0.5" /> : <AlertCircle size={15} className="shrink-0 mt-0.5" />}
            <span>{testResult.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
