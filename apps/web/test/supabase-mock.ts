/**
 * Minimal thenable query builder matching PostgrestFilterBuilder shape used by our API routes.
 * Each `from()` consumes the next queued `{ data, error }` resolution.
 */

export type MockQueryResult = {
  data: unknown;
  error: unknown;
  /** Set for `{ count: 'exact', head: true }` selects (Supabase returns `count` on the response). */
  count?: number | null;
};

function createQueryBuilder(result: MockQueryResult): object {
  const builder: Record<string, unknown> = {};
  const chain = [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'neq',
    'in',
    'or',
    'order',
    'limit',
    'range',
    'ilike',
    'single',
    'maybeSingle',
  ];
  for (const m of chain) {
    builder[m] = () => builder;
  }
  return Object.assign(builder, {
    then(
      onFulfilled?: (value: MockQueryResult & { count: number | null }) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) {
      const payload = {
        data: result.data,
        error: result.error,
        count: result.count ?? null,
      };
      return Promise.resolve(payload).then(onFulfilled as never, onRejected as never);
    },
  });
}

export function createQueuedSupabaseMock(
  authUser: { id: string; email?: string } | null,
  queryQueue: MockQueryResult[],
) {
  return {
    auth: {
      getUser: async () => ({ data: { user: authUser } }),
    },
    from(_table: string) {
      const next = queryQueue.shift();
      if (!next) {
        return createQueryBuilder({
          data: null,
          error: { message: 'mock queue exhausted (unexpected from() call)' },
        });
      }
      return createQueryBuilder(next);
    },
  };
}
