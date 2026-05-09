"use client";

import { deletePg } from "./actions";

export default function DeleteButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deletePg}
      onSubmit={(e) => {
        if (!confirm(`Delete "${name}"? This removes the listing and its photos.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-red-300 hover:text-red-600"
      >
        Delete
      </button>
    </form>
  );
}
