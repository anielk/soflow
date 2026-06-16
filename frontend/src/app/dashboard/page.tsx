'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken, isAuthenticated, logout } from '@/lib/auth';
import { apiGet } from '@/lib/api';
import { Navigation } from '@/components/Navigation';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        // Fetch user profile
        const userProfile = await apiGet<any>('/v1/users/profile');
        setUser(userProfile);
        
        // Fetch dashboard stats
        const dashboardStats = await apiGet<any>('/v1/dashboard/stats');
        setStats(dashboardStats);
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard error:', err);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* User Profile Section */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile</h2>
          {user && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><span className="font-medium">Username:</span> {user.name || user.email.split('@')[0]}</p>
                <p><span className="font-medium">Email:</span> {user.email}</p>
                <p><span className="font-medium">Account Created:</span> {new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900">Posts</h3>
            <p className="text-3xl font-bold text-indigo-600">{stats?.posts || 0}</p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900">Subscribers</h3>
            <p className="text-3xl font-bold text-indigo-600">{stats?.subscribers || 0}</p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900">Revenue</h3>
            <p className="text-3xl font-bold text-indigo-600">€{stats?.revenue || 0}</p>
          </div>
        </div>

        {/* Creator Profile Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Creator Profile</h2>
          <p className="text-gray-700">Your creator profile is ready to be customized. Click below to edit your profile.</p>
          <button 
            onClick={() => router.push('/creator/edit')}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded"
          >
            Edit Profile
          </button>
        </div>
      </main>
    </div>
  );
}