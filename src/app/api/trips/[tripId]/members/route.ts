import { NextResponse } from 'next/server';
import { getAuthSession, evaluatePermission } from '@/lib/auth';
import { getTripData, saveTripData } from '@/lib/storage/s3-adapter';
import { TripMember } from '@/types';

export async function POST(request: Request, { params }: { params: { tripId: string } }) {
  const session = await getAuthSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tripId } = params;
  const trip = await getTripData(tripId);
  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  const perm = evaluatePermission(trip, session.user.email);
  if (!perm.isOwner) {
    return NextResponse.json({ error: 'Only trip owner can manage members' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, email, name, canExpense } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const targetEmail = email.trim().toLowerCase();
    let members = [...trip.members];

    if (action === 'add' || action === 'update') {
      const idx = members.findIndex((m) => m.email.toLowerCase() === targetEmail);
      if (idx >= 0) {
        members[idx] = {
          ...members[idx],
          name: name || members[idx].name || targetEmail.split('@')[0],
          canExpense: canExpense !== undefined ? Boolean(canExpense) : members[idx].canExpense,
        };
      } else {
        const newMember: TripMember = {
          email: targetEmail,
          name: name || targetEmail.split('@')[0],
          role: 'editor',
          canExpense: Boolean(canExpense),
          addedAt: new Date().toISOString(),
        };
        members.push(newMember);
      }
    } else if (action === 'remove') {
      if (targetEmail === trip.metadata.ownerEmail.toLowerCase()) {
        return NextResponse.json({ error: 'Cannot remove trip owner' }, { status: 400 });
      }
      members = members.filter((m) => m.email.toLowerCase() !== targetEmail);
    }

    const updatedTrip = {
      ...trip,
      members,
      metadata: { ...trip.metadata, updatedAt: new Date().toISOString() },
    };

    await saveTripData(updatedTrip);

    return NextResponse.json({ members: updatedTrip.members });
  } catch (error: any) {
    console.error('Error managing members:', error);
    return NextResponse.json({ error: 'Failed to update members' }, { status: 500 });
  }
}
