'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface FaqEntry {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqEntry[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const panelId = `faq-panel-${index}`;
        const buttonId = `faq-button-${index}`;
        return (
          <div key={item.question} className="rounded-xl border border-bg-border bg-bg-surface overflow-hidden">
            <button
              type="button"
              id={buttonId}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="text-sm font-medium text-text-primary">{item.question}</span>
              <ChevronDown
                size={18}
                className={['shrink-0 text-text-muted transition-transform duration-200', isOpen ? 'rotate-180' : ''].join(
                  ' ',
                )}
              />
            </button>
            {isOpen && (
              <div id={panelId} role="region" aria-labelledby={buttonId} className="px-5 pb-4 text-sm text-text-muted leading-relaxed animate-fade-in">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
