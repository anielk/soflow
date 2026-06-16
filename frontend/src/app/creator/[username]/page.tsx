'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { Navigation } from '@/components/Navigation';

export default function PublicCreatorPage({ params }: { params: Promise<{ username: string }> }) {
  const [creator, setCreator] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchCreator = async () => {
      try {
        const { username } = await params;
        const creatorData = await apiGet(`/v1/creators/${username}`);
        setCreator(creatorData);
        setLoading(false);
      } catch (err) {
        setError('Creator not found');
        console.error('Creator error:', err);
        setLoading(false);
      }
    };

    fetchCreator();
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading creator profile...</div>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center mb-6">
            {creator.avatarUrl ? (
              <img 
                src={creator.avatarUrl} 
                alt={creator.name || creator.email}
                className="w-24 h-24 rounded-full object-cover mr-6"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mr-6">
                <span className="text-gray-500 text-2xl">👤</span>
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{creator.name || creator.email.split('@')[0]}</h2>
              <p className="text-gray-600">{creator.email}</p>
            </div>
          </div>

          {creator.bio && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Bio</h3>
              <p className="text-gray-700">{creator.bio}</p>
            </div>
          )}

          {creator.website && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Website</h3>
              <a 
                href={creator.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800"
              >
                {creator.website}
              </a>
            </div>
          )}

          {creator.creatorProfile?.socialLinks && Object.keys(creator.creatorProfile.socialLinks).length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Social Links</h3>
              <div className="flex space-x-4">
                {Object.entries(creator.creatorProfile.socialLinks).map(([platform, url]) => (
                   <a 
                     key={platform}
                     href={String(url)}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}