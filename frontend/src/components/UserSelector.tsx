"use client";

import { useRouter } from "next/navigation";

import type { DemoUser } from "@/lib/api";

interface UserSelectorProps {
  users: DemoUser[];
  selectedUserId?: number;
}

export default function UserSelector({ users, selectedUserId }: UserSelectorProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <label htmlFor="user-select" className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Choisissez un profil utilisateur de démonstration :
      </label>
      <select
        id="user-select"
        defaultValue={selectedUserId ?? ""}
        onChange={(e) => router.push(`/users/${e.target.value}`)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      >
        <option value="" disabled>
          Sélectionner un utilisateur...
        </option>
        {users.map((user) => (
          <option key={user.userId} value={user.userId}>
            Utilisateur #{user.userId} — {user.nRatings} notes — préfère {user.topGenre ?? "?"}
          </option>
        ))}
      </select>
    </div>
  );
}
