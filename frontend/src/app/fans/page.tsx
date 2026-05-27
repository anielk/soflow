'use client';

import { TopNav } from '../components/TopNav';
import { Sidebar } from '../components/Sidebar';

export default function FansPage() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-64 w-full">
        <TopNav />
        <main className="p-6">
          <h1 className="text-2xl font-bold mb-4">Fans</h1>
          <div className="bg-gray-800 p-6 rounded-lg">
            <p>Fans content placeholder</p>
          </div>
        </main>
      </div>
    </div>
  );
}