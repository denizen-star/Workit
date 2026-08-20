'use client';

import { useRouter } from 'next/navigation';
import { UserRound, UserPlus } from 'lucide-react';
import { useState } from 'react';
import AddPersonModal from '@/components/AddPersonModal';
import EditProfileModal from '@/components/EditProfileModal';

interface UserHeaderProps {
  userName: string;
  userEmail?: string;
  showAddPerson?: boolean;
  onProfileSaved?: (profile: { name: string; email: string | null }) => void;
}

export default function UserHeader({
  userName,
  userEmail = '',
  showAddPerson = false,
  onProfileSaved,
}: UserHeaderProps) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const switchUser = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/who');
    router.refresh();
  };

  return (
    <>
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => setShowEdit(true)}
          className="inline-flex min-h-11 max-w-[8rem] items-center gap-2 truncate rounded-2xl px-2 text-sm text-[#f6f1e3]/65 hover:text-white sm:max-w-none"
        >
          <UserRound className="h-4 w-4 text-[#e8c547]" />
          {userName}
        </button>
        {showAddPerson && (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-2xl border border-white/10 px-3 py-2 text-sm font-semibold text-[#f6f1e3]/75 hover:border-[#e8c547]/40 hover:text-white"
          >
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Add person</span>
          </button>
        )}
        <button
          type="button"
          onClick={switchUser}
          className="min-h-11 rounded-2xl border border-[#e8c547]/40 px-3 py-2 text-sm font-semibold text-[#e8c547]"
        >
          Switch
        </button>
      </div>

      <AddPersonModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={() => router.refresh()}
      />
      <EditProfileModal
        open={showEdit}
        currentName={userName}
        currentEmail={userEmail}
        onClose={() => setShowEdit(false)}
        onSaved={(profile) => {
          onProfileSaved?.(profile);
          router.refresh();
        }}
      />
    </>
  );
}
