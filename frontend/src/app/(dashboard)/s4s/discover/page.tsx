'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Badge, Button } from '@/components/ui';
import { Search, Users, Heart, Send } from 'lucide-react';
import { formatNumber } from '@/lib/format';

interface S4SCreator {
  id:          string;
  name:        string;
  username:    string;
  category:    string;
  fans:        number;
  postsPerWk:  number;
  engagePct:   number;
  location:    string;
  bio:         string;
  requestSent: boolean;
}

const MOCK_DISCOVER: S4SCreator[] = [
  { id: 'dc1', name: 'FitByNature',     username: 'fitbynature',      category: 'Fitness',       fans: 8400,  postsPerWk: 5, engagePct: 12, location: 'USA',     bio: 'Personal trainer sharing workout routines and healthy recipes.', requestSent: false },
  { id: 'dc2', name: 'TravelWithLuna',  username: 'travelwithluna',   category: 'Travel',        fans: 12300, postsPerWk: 7, engagePct: 9,  location: 'UK',      bio: 'Full-time traveler, documenting life around the world.', requestSent: true  },
  { id: 'dc3', name: 'ChefMark',        username: 'chefmarkofficial', category: 'Lifestyle',     fans: 3200,  postsPerWk: 4, engagePct: 18, location: 'Canada',  bio: 'Michelin-trained chef sharing recipes and cooking tutorials.', requestSent: false },
  { id: 'dc4', name: 'DanceByAlex',     username: 'dancebyalex',      category: 'Entertainment', fans: 5800,  postsPerWk: 6, engagePct: 14, location: 'USA',     bio: 'Professional dancer and choreographer. Dance tutorials weekly.', requestSent: false },
  { id: 'dc5', name: 'YogaWithSarah',   username: 'yogawithsarah',    category: 'Wellness',      fans: 9100,  postsPerWk: 4, engagePct: 11, location: 'Australia', bio: 'Certified yoga instructor. Morning flows and mindfulness.', requestSent: false },
  { id: 'dc6', name: 'GamerZone',       username: 'gamerzone_of',     category: 'Gaming',        fans: 2400,  postsPerWk: 8, engagePct: 22, location: 'Germany', bio: 'Pro gamer sharing highlights, tutorials and behind-the-scenes.', requestSent: false },
];

const CATEGORIES = ['All', 'Fitness', 'Travel', 'Lifestyle', 'Entertainment', 'Wellness', 'Gaming'];

export default function S4SDiscoverPage() {
  const router = useRouter();
  const [query,    setQuery]    = useState('');
  const [category, setCategory] = useState('All');
  const [creators, setCreators] = useState(MOCK_DISCOVER);

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  function sendRequest(id: string) {
    setCreators((prev) => prev.map((c) => c.id === id ? { ...c, requestSent: true } : c));
  }

  const filtered = creators
    .filter((c) => category === 'All' || c.category === category)
    .filter((c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase()),
    );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Discover creators</h1>
        <p className="mt-1 text-sm text-text-muted">
          Find creators to collaborate with through share for share promotions
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Category filters */}
        <div className="flex items-center gap-1 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={[
                'px-2.5 py-1 rounded text-xs font-medium transition-colors duration-150',
                category === cat
                  ? 'bg-violet-600/15 text-violet-400'
                  : 'text-text-muted hover:text-text-secondary hover:bg-bg-subtle border border-bg-border/60',
              ].join(' ')}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 h-8 bg-bg-subtle border border-bg-border/60 rounded-lg flex-1 min-w-[160px] max-w-xs">
          <Search size={13} className="text-text-muted shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search creators…"
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
          />
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-text-muted">{filtered.length} creators found</p>

      {/* Creator cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((creator) => (
          <div
            key={creator.id}
            className="bg-bg-surface border border-bg-border/60 rounded-xl p-5 hover:border-violet-500/20 transition-colors"
          >
            {/* Avatar + name */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400 font-bold">
                  {creator.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-text-primary text-sm">{creator.name}</p>
                  <p className="text-xs text-text-muted">@{creator.username}</p>
                </div>
              </div>
              <Badge variant="default" size="sm">{creator.category}</Badge>
            </div>

            <p className="text-xs text-text-muted leading-relaxed mb-4">{creator.bio}</p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: 'Fans',     value: formatNumber(creator.fans), icon: Users },
                { label: 'Posts/wk', value: String(creator.postsPerWk), icon: Send  },
                { label: 'Engage',   value: `${creator.engagePct}%`,   icon: Heart },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-bg-subtle rounded-lg p-2 text-center">
                  <Icon size={11} className="text-text-disabled mx-auto mb-0.5" />
                  <p className="text-sm font-bold text-text-primary tabular-nums">{value}</p>
                  <p className="text-[10px] text-text-muted">{label}</p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-bg-border/40">
              <span className="text-xs text-text-muted">{creator.location}</span>
              {creator.requestSent ? (
                <span className="text-xs text-success-text font-medium">Request sent</span>
              ) : (
                <Button variant="primary" size="sm" onClick={() => sendRequest(creator.id)}>
                  Request S4S
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
