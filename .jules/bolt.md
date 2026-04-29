
## 2024-04-29 - Batching lookups on the same table
**Learning:** Multiple sequential row lookup queries on the same table can be optimized into a single batched query using the `.in()` operator to reduce database round-trips.
**Action:** Always batch lookups into a single `.in()` query whenever multiple queries are made to the same table in sequence.
