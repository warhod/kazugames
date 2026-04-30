## 2024-05-24 - Batched sequential group membership checks
**Learning:** In Supabase API routes, multiple sequential row lookup queries on the same table (like checking memberships of multiple users in a group) can be optimized into a single `.in('column', [val1, val2])` query to eliminate network overhead and database round-trips.
**Action:** Look for sequential queries requesting single rows from the same table and replace them with batched `select` calls combined with a `.in()` filter.
## 2024-11-20 - [Promise.all for independent queries]
**Learning:** In Next.js/Supabase routes with multiple sequential database queries, we can often group independent queries and run them concurrently using \`Promise.all()\` to significantly reduce network round-trips. For example, fetching a group and its members can be done in parallel, followed by fetching related data that depends on the members list.
**Action:** Always look for sequential \`await\` statements that don't depend on each other's results and wrap them in \`Promise.all()\`.
