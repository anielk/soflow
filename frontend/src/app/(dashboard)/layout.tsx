import { AppLayout } from '@/components/layout/AppLayout';
import { ToastProvider } from '@/components/ui';
import { WorkspaceProvider } from '@/components/workspace/WorkspaceContext';
import type { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <WorkspaceProvider>
        <AppLayout>{children}</AppLayout>
      </WorkspaceProvider>
    </ToastProvider>
  );
}
