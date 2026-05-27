import { getApiBaseUrl } from '@/lib/api';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-start justify-center gap-4 px-6">
      <h1 className="text-4xl font-bold">Creator Platform</h1>
      <p className="text-slate-300">
        Phase 1 foundation is ready. Frontend is connected to backend API base URL:
      </p>
      <code className="rounded-md bg-slate-900 px-3 py-2 text-sm text-cyan-300">{getApiBaseUrl()}</code>
    </main>
  );
}
