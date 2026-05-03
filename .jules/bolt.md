## 2024-05-24 - Batched sequential group membership checks
**Learning:** In Supabase API routes, multiple sequential row lookup queries on the same table (like checking memberships of multiple users in a group) can be optimized into a single `.in('column', [val1, val2])` query to eliminate network overhead and database round-trips.
**Action:** Look for sequential queries requesting single rows from the same table and replace them with batched `select` calls combined with a `.in()` filter.

## 2026-05-03 - Parallelizing sequential database queries in Supabase routes
**Learning:** In Next.js/Supabase routes, independent sequential database queries should be parallelized using Promise.all() to significantly reduce network round-trips. This applies to both batched lookups (like querying user_games and profiles based on memberIds) and unrelated queries (like fetching a group and its members).
**Action:** Look for sequential awaits on database queries that do not depend on each other and combine them using Promise.all() to improve response time.
