import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { LoanStatus } from '@/lib/database.types';

const VALID_TRANSITIONS: Record<LoanStatus, LoanStatus[]> = {
  requested: ['approved', 'declined'],
  approved: ['returned'],
  declined: [],
  returned: [],
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { status } = body as { status?: LoanStatus };

  if (!status) {
    return NextResponse.json({ error: 'status is required' }, { status: 400 });
  }

  const { data: loan } = await supabase
    .from('game_loans')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!loan) {
    return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
  }

  const isOwner = loan.owner_id === user.id;
  const isBorrower = loan.borrower_id === user.id;
  const requesterId = loan.requested_by_id ?? loan.borrower_id;
  const requesteeId = requesterId === loan.owner_id ? loan.borrower_id : loan.owner_id;

  if (!isOwner && !isBorrower) {
    return NextResponse.json({ error: 'Not a participant in this loan' }, { status: 403 });
  }

  if (status === 'approved' || status === 'declined') {
    if (user.id !== requesteeId) {
      return NextResponse.json(
        { error: 'Only the request recipient can approve or decline' },
        { status: 403 },
      );
    }
  }

  if (status === 'returned') {
    if (!isOwner && !isBorrower) {
      return NextResponse.json(
        { error: 'Only participants can mark as returned' },
        { status: 403 },
      );
    }
  }

  const currentStatus = loan.status as LoanStatus;
  const allowed = VALID_TRANSITIONS[currentStatus] ?? [];
  if (!allowed.includes(status)) {
    return NextResponse.json(
      { error: `Cannot transition from '${currentStatus}' to '${status}'` },
      { status: 400 },
    );
  }

  const { data: updated, error } = await supabase
    .from('game_loans')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select('*, game:games(*)')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(updated);
}
