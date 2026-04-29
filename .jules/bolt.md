
## 2024-04-29 - Batching lookups on the same table
**Learning:** Multiple sequential row lookup queries on the same table can be optimized into a single batched query using the `.in()` operator to reduce database round-trips.
**Action:** Always batch lookups into a single `.in()` query whenever multiple queries are made to the same table in sequence.
## 2024-05-24 - Batched sequential group membership checks
**Learning:** In Supabase API routes, multiple sequential row lookup queries on the same table (like checking memberships of multiple users in a group) can be optimized into a single `.in('column', [val1, val2])` query to eliminate network overhead and database round-trips.
**Action:** Look for sequential queries requesting single rows from the same table and replace them with batched `select` calls combined with a `.in()` filter.
