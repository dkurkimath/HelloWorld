// Pure helpers for the folder tree (categories with an optional parent_id).
// No database access here, so they're easy to test and safe to import anywhere.

export type FolderLike = { id: string; label: string; parent_id: string | null; sort_order: number };

const byOrder = (a: FolderLike, b: FolderLike) => a.sort_order - b.sort_order || a.label.localeCompare(b.label);

export function childrenOf<T extends FolderLike>(all: T[], parentId: string | null): T[] {
  return all.filter(f => (f.parent_id ?? null) === parentId).sort(byOrder);
}

// Root → … → folder. Stops if the data ever contains a cycle.
export function pathTo<T extends FolderLike>(all: T[], id: string): T[] {
  const byId = new Map(all.map(f => [f.id, f]));
  const out: T[] = [];
  const seen = new Set<string>();
  let cur = byId.get(id);
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    out.unshift(cur);
    cur = cur.parent_id ? byId.get(cur.parent_id) : undefined;
  }
  return out;
}

// The folder itself plus every folder nested under it.
export function subtreeIds(all: FolderLike[], id: string): Set<string> {
  const ids = new Set<string>([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const f of all) {
      if (f.parent_id && ids.has(f.parent_id) && !ids.has(f.id)) { ids.add(f.id); grew = true; }
    }
  }
  return ids;
}

// Flat, depth-first list with "Parent / Child" labels — for <select> menus.
export function folderOptions<T extends FolderLike>(all: T[]): { id: string; label: string; depth: number }[] {
  const out: { id: string; label: string; depth: number }[] = [];
  const walk = (parentId: string | null, prefix: string, depth: number, guard: Set<string>) => {
    for (const f of childrenOf(all, parentId)) {
      if (guard.has(f.id)) continue;
      const label = prefix ? `${prefix} / ${f.label}` : f.label;
      out.push({ id: f.id, label, depth });
      walk(f.id, label, depth + 1, new Set(Array.from(guard).concat(f.id)));
    }
  };
  walk(null, "", 0, new Set());
  return out;
}
