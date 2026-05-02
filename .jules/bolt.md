## 2024-05-24 - Batched sequential group membership checks
**Learning:** In Supabase API routes, multiple sequential row lookup queries on the same table (like checking memberships of multiple users in a group) can be optimized into a single `.in('column', [val1, val2])` query to eliminate network overhead and database round-trips.
**Action:** Look for sequential queries requesting single rows from the same table and replace them with batched `select` calls combined with a `.in()` filter.

## 2026-05-02 - Parallelized dependent Supabase queries
**Learning:** When queries depend on an ID or similar param (e.g. `groups` and `group_members` fetching by `id`), they can be parallelized if they do not depend on each other's output. Once the prerequisite fetch is done, dependent batch queries (e.g. `user_games` and `profiles` using a collected list of IDs) can also be parallelized.
**Action:** Use `Promise.all()` to group non-dependent Supabase queries together. Group queries that share inputs or dependencies.
