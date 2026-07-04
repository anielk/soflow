'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button, Input, Textarea } from '@/components/ui';

const DEMO_EMAIL = 'hello@leinaflow.com';

// There is no backend endpoint for this form (none exists, none is in scope
// for the marketing site) — rather than fake a "message sent" success state,
// submitting genuinely opens a pre-filled email to the team via mailto:.
export function DemoRequestForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = `Demo request from ${name || 'a Leinaflow visitor'}`;
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Company: ${company}`,
      '',
      message,
    ].join('\n');
    const mailto = `mailto:${DEMO_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input
          label="Work email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <Input label="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
      <Textarea
        label="What would you like to see in the demo?"
        rows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <Button type="submit" variant="primary" size="lg" icon={Send} className="self-start">
        Request a Demo
      </Button>
    </form>
  );
}
