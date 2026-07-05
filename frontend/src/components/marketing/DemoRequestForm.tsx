'use client';

import { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { Button, Input, Textarea } from '@/components/ui';
import { submitDemoRequest } from '@/lib/notification';

export function DemoRequestForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await submitDemoRequest({ name, email, company: company || undefined, message: message || undefined });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send your demo request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="flex items-start gap-3 bg-success-subtle border border-success/20 rounded-xl p-4">
        <CheckCircle2 size={18} className="text-success-text shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-text-primary">Request sent</p>
          <p className="text-sm text-text-muted mt-0.5">
            Thanks, {name.split(' ')[0] || 'there'} — the Leinaflow team will reach out to {email} shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Input id="demo-name" label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input
          id="demo-email"
          label="Work email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <Input id="demo-company" label="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
      <Textarea
        id="demo-message"
        label="What would you like to see in the demo?"
        rows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      {error && <p className="text-sm text-danger-text">{error}</p>}
      <Button type="submit" variant="primary" size="lg" icon={Send} loading={submitting} className="self-start">
        Request a Demo
      </Button>
    </form>
  );
}
