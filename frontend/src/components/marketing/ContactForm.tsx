'use client';

import { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { Button, Input, Textarea } from '@/components/ui';
import { submitContactForm } from '@/lib/notification';

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await submitContactForm({ name, email, message });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send your message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="flex items-start gap-3 bg-success-subtle border border-success/20 rounded-xl p-4">
        <CheckCircle2 size={18} className="text-success-text shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-text-primary">Message sent</p>
          <p className="text-sm text-text-muted mt-0.5">We&apos;ll get back to you at {email} soon.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input id="contact-name" label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input id="contact-email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Textarea
        id="contact-message"
        label="How can we help?"
        rows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
      />
      {error && <p className="text-sm text-danger-text">{error}</p>}
      <Button type="submit" variant="primary" size="md" icon={Send} loading={submitting} className="self-start">
        Send message
      </Button>
    </form>
  );
}
