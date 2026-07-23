import { NextResponse } from 'next/server';
import { getAuthSession, evaluatePermission } from '@/lib/auth';
import { getTripData, saveTripData, deleteTripData } from '@/lib/storage/s3-adapter';

export async function GET(request: Request, { params }: { params: { tripId: string } }) {
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
  if (!perm.isMember) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ trip, userPermission: perm });
}

export async function PUT(request: Request, { params }: { params: { tripId: string } }) {
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
  if (!perm.isMember) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { metadata, itineraries, packingList, expenses, memories } = body;

    // Check expense edit permission if expenses are modified
    if (expenses !== undefined && JSON.stringify(expenses) !== JSON.stringify(trip.expenses)) {
      if (!perm.canExpense) {
        return NextResponse.json({ error: 'Expense edit permission required' }, { status: 403 });
      }
    }

    const updatedTrip = {
      ...trip,
      metadata: metadata ? { ...trip.metadata, ...metadata, updatedAt: new Date().toISOString() } : trip.metadata,
      itineraries: itineraries ?? trip.itineraries,
      packingList: packingList ?? trip.packingList,
      expenses: expenses ?? trip.expenses,
      memories: memories ?? trip.memories,
    };

    await saveTripData(updatedTrip);

    return NextResponse.json({ trip: updatedTrip, userPermission: perm });
  } catch (error: any) {
    console.error('Error updating trip:', error);
    return NextResponse.json({ error: 'Failed to update trip' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { tripId: string } }) {
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
    return NextResponse.json({ error: 'Only trip owner can delete trip' }, { status: 403 });
  }

  await deleteTripData(tripId);
  return NextResponse.json({ success: true });
}
