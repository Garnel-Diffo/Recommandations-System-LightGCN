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
      <label
        htmlFor="user-select"
        className="text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        Choisissez un profil utilisateur de démonstration :
      </label>
      <div className="relative w-full sm:w-auto sm:flex-1">
        <select
          id="user-select"
          defaultValue={selectedUserId ?? ""}
          onChange={(e) => router.push(`/users/${e.target.value}`)}
          className="w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-9 text-sm text-slate-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="" disabled>
            Sélectionner un utilisateur...
          </option>
          {users.map((user) => (
            <option key={user.userId} value={user.userId}>
              Utilisateur #{user.userId} - {user.nRatings} notes - préfère {user.topGenre ?? "?"}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors dark:text-slate-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
