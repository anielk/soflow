'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Avatar, Button, Modal, Input, EmptyState, Skeleton, Tooltip, useToast } from '@/components/ui';
import { UserPlus, Search, UsersRound, SearchX, Mail, HelpCircle } from 'lucide-react';
import { listCreators, addCreator } from '@/lib/workspace';
import type { CreatorRecord } from '@/types/workspace';

export default function CreatorsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [creators, setCreators] = useState<CreatorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  const loadCreators = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await listCreators();
      setCreators(result);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load creators');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCreators();
  }, [loadCreators]);

  const isFiltered = query.trim() !== '';
  const filtered = creators.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || (c.email ?? '').toLowerCase().includes(q);
  });

  const addedThisMonth = creators.filter((c) => {
    const created = new Date(c.createdAt);
    const now = new Date();
    return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
  }).length;

  function openAddModal() {
    setNewName('');
    setNewEmail('');
    setAddError(null);
    setShowAddModal(true);
  }

  async function submitAddCreator() {
    if (!newName.trim()) return;
    setAdding(true);
    setAddError(null);
    try {
      await addCreator({ name: newName.trim(), email: newEmail.trim() || undefined });
      setShowAddModal(false);
      await loadCreators();
      showToast('Creator created', 'success');
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add creator');
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-xl font-semibold text-text-primary">Creators</h1>
            <Tooltip content="Creators are the people your team manages content, media, and analytics for." side="right">
              <HelpCircle size={14} className="text-text-disabled hover:text-text-muted transition-colors duration-150" />
            </Tooltip>
          </div>
          <p className="mt-1 text-sm text-text-muted">
            The people your team manages content, media, and analytics for.
          </p>
        </div>
        <Button variant="primary" size="md" icon={UserPlus} onClick={openAddModal}>
          Add creator
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {loading ? (
          <>
            <Skeleton height={68} rounded="lg" />
            <Skeleton height={68} rounded="lg" />
          </>
        ) : (
          [
            { label: 'Total creators', value: String(creators.length), icon: UsersRound, color: '#8B5CF6' },
            { label: 'Added this month', value: String(addedThisMonth), icon: UserPlus, color: '#10B981' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="bg-bg-surface border border-bg-border/60 rounded-xl p-4 flex items-center gap-3"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${color}18` }}
              >
                <Icon size={16} style={{ color }} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-disabled">{label}</p>
                <p className="mt-0.5 text-lg font-bold text-text-primary tabular-nums leading-none">{value}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* List card */}
      <div className="bg-bg-surface border border-bg-border/60 rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-bg-border/40">
          <div className="flex items-center gap-2 px-3 h-8 bg-bg-subtle border border-bg-border/60 rounded-lg flex-1 max-w-sm">
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

        {loadError && (
          <div className="mx-4 my-3 bg-danger-subtle border border-danger/20 rounded-lg px-3 py-2.5 text-sm text-danger-text">
            {loadError}
          </div>
        )}

        {loading ? (
          <div className="divide-y divide-bg-border/40">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                <Skeleton width={32} height={32} rounded="full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton width="30%" height={12} rounded="sm" />
                  <Skeleton width="45%" height={11} rounded="sm" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          isFiltered ? (
            <EmptyState
              icon={SearchX}
              title="No creators match your search"
              description="Try a different name or email."
              action={{ label: 'Clear search', onClick: () => setQuery('') }}
            />
          ) : (
            <EmptyState
              icon={UsersRound}
              title="No creators yet"
              description="Creators are the people your team manages content, media, and analytics for. Add your first one to get started."
              action={{ label: 'Add your first creator', onClick: openAddModal }}
              size="lg"
            />
          )
        ) : (
          <ul className="divide-y divide-bg-border/40">
            {filtered.map((creator) => (
              <li key={creator.id} className="flex items-center gap-3 px-4 py-3.5">
                <Avatar name={creator.name} src={creator.avatarUrl} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{creator.name}</p>
                  {creator.email && (
                    <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                      <Mail size={11} className="shrink-0" />
                      {creator.email}
                    </p>
                  )}
                </div>
                <span className="text-xs text-text-disabled shrink-0">
                  Added {new Date(creator.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add creator modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add creator">
        <div className="space-y-4">
          <Input
            label="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Jamie Rivera"
            autoFocus
          />
          <Input
            label="Email (optional)"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="jamie@example.com"
          />
          {addError && <p className="text-xs text-danger-text">{addError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={adding}
              disabled={!newName.trim()}
              onClick={submitAddCreator}
            >
              Add creator
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
