'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Button, Input } from '@/components/ui';
import { CheckCircle2, Settings } from 'lucide-react';

export default function S4SSettingsPage() {
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  // Preference toggles
  const [autoAccept,      setAutoAccept]      = useState(false);
  const [minFans,         setMinFans]         = useState('1000');
  const [maxPerMonth,     setMaxPerMonth]      = useState('4');
  const [requireApproval, setRequireApproval] = useState(true);
  const [notifyEmail,     setNotifyEmail]     = useState(true);
  const [notifyInApp,     setNotifyInApp]     = useState(true);

  // Profile preferences
  const [categories,  setCategories]  = useState('Fitness, Lifestyle, Wellness');
  const [bioTemplate, setBioTemplate] = useState('Check out [creator] for exclusive [category] content!');

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
    return (
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={[
          'relative inline-flex h-5 w-9 rounded-full transition-colors duration-200 shrink-0',
          value ? 'bg-violet-600' : 'bg-bg-overlay',
        ].join(' ')}
      >
        <span className={[
          'inline-block w-3.5 h-3.5 bg-white rounded-full shadow transition-transform duration-200 mt-[3px]',
          value ? 'translate-x-[18px]' : 'translate-x-[3px]',
        ].join(' ')} />
      </button>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Settings size={16} className="text-text-muted" />
          <h1 className="text-xl font-semibold text-text-primary">S4S Settings</h1>
        </div>
        <p className="mt-1 text-sm text-text-muted">
          Configure your share-for-share preferences and rules
        </p>
      </div>

      <form onSubmit={handleSave} className="max-w-xl space-y-6">
        {saved && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded bg-success-subtle border border-success/20 text-success-text text-sm">
            <CheckCircle2 size={14} />
            Settings saved successfully
          </div>
        )}

        {/* Partner requirements */}
        <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-bg-border/40">
            <h3 className="text-sm font-semibold text-text-primary">Partner requirements</h3>
            <p className="text-xs text-text-muted mt-0.5">Minimum criteria for incoming S4S requests</p>
          </div>
          <div className="p-5 space-y-4">
            <Input
              label="Minimum fan count"
              type="number"
              min="0"
              value={minFans}
              onChange={(e) => setMinFans(e.target.value)}
              hint="Requests from creators with fewer fans will be automatically declined."
            />
            <Input
              label="Max S4S per month"
              type="number"
              min="1"
              max="20"
              value={maxPerMonth}
              onChange={(e) => setMaxPerMonth(e.target.value)}
              hint="Prevent S4S fatigue by limiting how many you do each month."
            />
            <Input
              label="Preferred categories"
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
              hint="Comma-separated list of niches you want to partner with."
            />
          </div>
        </div>

        {/* Automation */}
        <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-bg-border/40">
            <h3 className="text-sm font-semibold text-text-primary">Automation</h3>
          </div>
          <div className="divide-y divide-bg-border/40">
            {[
              {
                label:   'Auto-accept qualifying requests',
                desc:    'Automatically accept requests that meet your minimum requirements',
                value:   autoAccept,
                onChange: setAutoAccept,
              },
              {
                label:   'Require manual approval for all',
                desc:    'Always review requests manually before accepting',
                value:   requireApproval,
                onChange: setRequireApproval,
              },
            ].map(({ label, desc, value, onChange }) => (
              <div key={label} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm text-text-primary">{label}</p>
                  <p className="text-xs text-text-muted mt-0.5">{desc}</p>
                </div>
                <Toggle value={value} onChange={onChange} />
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-bg-border/40">
            <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
          </div>
          <div className="divide-y divide-bg-border/40">
            {[
              { label: 'Email notifications', desc: 'Receive an email when a request arrives or status changes', value: notifyEmail, onChange: setNotifyEmail },
              { label: 'In-app notifications', desc: 'Show notification badge in the Leinaflow dashboard', value: notifyInApp, onChange: setNotifyInApp },
            ].map(({ label, desc, value, onChange }) => (
              <div key={label} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm text-text-primary">{label}</p>
                  <p className="text-xs text-text-muted mt-0.5">{desc}</p>
                </div>
                <Toggle value={value} onChange={onChange} />
              </div>
            ))}
          </div>
        </div>

        {/* Shoutout template */}
        <div className="bg-bg-surface border border-bg-border/60 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">Default shoutout template</h3>
          <p className="text-xs text-text-muted">Used when posting a shoutout for an S4S partner. Variables: [creator], [username], [category]</p>
          <textarea
            value={bioTemplate}
            onChange={(e) => setBioTemplate(e.target.value)}
            rows={3}
            className="w-full rounded bg-bg-subtle border border-bg-border text-text-primary placeholder:text-text-muted text-sm p-3 resize-none focus:outline-none focus:border-violet-600 transition-colors"
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="md">Save settings</Button>
        </div>
      </form>
    </div>
  );
}
