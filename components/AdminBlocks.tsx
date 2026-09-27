'use client';

import { useState } from 'react';
import type { DeviceBlockRow } from '@/lib/deviceBlock';

/**
 * Admin → Users "Blocks" section: every browser block (/join "Under 18 / Pass") and account
 * block, with Pending request / All / Cleared pills (same pattern as Feedback's Open / Done).
 * Pending requests sort first (server order). Clear on an account row unblocks the account.
 */

type Tab = 'pending' | 'all' | 'cleared';

const TABS: ReadonlyArray<readonly [Tab, string]> = [
  ['pending', 'Pending request'],
  ['all', 'All'],
  ['cleared', 'Cleared'],
];

function isPending(block: DeviceBlockRow) {
  return Boolean(block.requestedAt) && !block.clearedAt;
}

export default function AdminBlocks({
  blocks,
  onClear,
}: {
  blocks: DeviceBlockRow[];
  onClear: (block: DeviceBlockRow) => Promise<void>;
}) {
  const [tab, setTab] = useState<Tab>('pending');
  const [busyId, setBusyId] = useState<number | null>(null);

  const visible = blocks.filter((block) =>
    tab === 'pending' ? isPending(block) : tab === 'cleared' ? Boolean(block.clearedAt) : true
  );

  return (
    <section className="mt-10">
      <h3 className="text-2xl font-black text-white">Blocks</h3>
      <div className="mb-4 mt-3 flex flex-wrap gap-2">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`min-h-11 rounded-2xl border px-4 text-sm font-black ${
              tab === id
                ? 'border-[#e8c547] bg-[#e8c547]/15 text-[#e8c547]'
                : 'border-white/10 text-[#f6f1e3]/70'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-[#f6f1e3]/55">Nothing here.</p>
      ) : (
        <div className="space-y-3">
          {visible.map((block) => (
            <div key={block.id} className="glass-card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-lg font-black text-white">
                    {block.userId ? `Account · ${block.userName ?? 'ID ' + block.userId}` : 'Browser · Under 18 / Pass'}
                  </p>
                  <p className="mt-1 text-xs text-[#f6f1e3]/40">
                    #{block.id} · blocked {block.createdAt}
                    {block.clearedAt ? ` · cleared ${block.clearedAt}` : ''}
                  </p>
                  {block.requestedAt ? (
                    <div className="mt-3 text-sm text-[#f6f1e3]/80">
                      <p className="font-bold text-[#e8c547]">{block.requestEmail}</p>
                      <p className="mt-1 whitespace-pre-wrap">{block.requestNote}</p>
                      <p className="mt-1 text-xs text-[#f6f1e3]/40">requested {block.requestedAt}</p>
                    </div>
                  ) : null}
                </div>
                {!block.clearedAt ? (
                  <button
                    type="button"
                    disabled={busyId === block.id}
                    onClick={async () => {
                      setBusyId(block.id);
                      await onClear(block);
                      setBusyId(null);
                    }}
                    className="min-h-11 shrink-0 rounded-2xl bg-[#e8c547] px-4 text-sm font-black text-[#1a1404] disabled:opacity-40"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
