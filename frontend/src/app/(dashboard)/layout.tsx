import { AppLayout } from '@/components/layout/AppLayout';
import { ToastProvider } from '@/components/ui';
import type { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AppLayout>{children}</AppLayout>
    </ToastProvider>
  );
}
