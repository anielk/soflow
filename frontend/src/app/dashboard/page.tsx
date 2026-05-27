'use client';

import { TopNav } from '../components/TopNav';
import { Sidebar } from '../components/Sidebar';

export default function DashboardPage() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-64 w-full">
        <TopNav />
        <main className="p-6">
          <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Overview</h2>
              <p>Dashboard content placeholder</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Analytics</h2>
              <p>Analytics content placeholder</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Recent Activity</h2>
              <p>Activity content placeholder</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}