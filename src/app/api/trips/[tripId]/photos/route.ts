import { NextResponse } from 'next/server';
import { getAuthSession, evaluatePermission } from '@/lib/auth';
import { getTripData, saveTripData, saveTripPhoto } from '@/lib/storage/s3-adapter';
import { MemoryItem } from '@/types';

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
  if (!perm.isMember) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { title, base64Data, filename } = body;

    if (!base64Data) {
      return NextResponse.json({ error: 'Missing photo data' }, { status: 400 });
    }

    const safeFilename = `${Date.now()}-${(filename || 'photo.jpg').replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const photoUrl = await saveTripPhoto(tripId, safeFilename, base64Data);

    const newMemory: MemoryItem = {
      id: `mem-${Date.now()}`,
      title: title || '旅の思い出写真',
      type: 'photo',
      content: photoUrl,
      author: session.user.name || session.user.email,
      createdAt: new Date().toISOString(),
    };

    const updatedTrip = {
      ...trip,
      memories: [newMemory, ...trip.memories],
      metadata: { ...trip.metadata, updatedAt: new Date().toISOString() },
    };

    await saveTripData(updatedTrip);

    return NextResponse.json({ memory: newMemory, photoUrl });
  } catch (error: any) {
    console.error('Error uploading photo:', error);
    return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
  }
}
