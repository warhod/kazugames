## 2024-05-24 - Batched sequential group membership checks
**Learning:** In Supabase API routes, multiple sequential row lookup queries on the same table (like checking memberships of multiple users in a group) can be optimized into a single `.in('column', [val1, val2])` query to eliminate network overhead and database round-trips.
**Action:** Look for sequential queries requesting single rows from the same table and replace them with batched `select` calls combined with a `.in()` filter.

## 2024-05-25 - Parallelizing independent database queries in Supabase Next.js routes
**Learning:** In Next.js/Supabase routes, independent sequential database queries should be parallelized using Promise.all() to significantly reduce network round-trips.
**Action:** When a route performs several queries that do not depend on each other's results, group them and resolve with Promise.all().
