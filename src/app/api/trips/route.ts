import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { getTripIndex, saveTripData } from '@/lib/storage/s3-adapter';
import { TripData } from '@/types';

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userEmail = session.user.email.toLowerCase();
  const index = await getTripIndex();

  // Filter trips where user is owner or member
  const accessibleTrips = index.trips.filter((trip) => {
    if (trip.ownerEmail.toLowerCase() === userEmail) return true;
    return trip.members.some((m) => m.toLowerCase() === userEmail);
  });

  return NextResponse.json({ trips: accessibleTrips });
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, destination, startDate, endDate, description, coverImage } = body;

    if (!title || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const ownerEmail = session.user.email.toLowerCase();
    const tripId = `trip-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    const newTrip: TripData = {
      metadata: {
        id: tripId,
        title,
        destination: destination || title,
        startDate,
        endDate,
        description: description || '',
        coverImage: coverImage || '🌴',
        ownerEmail,
        createdAt: now,
        updatedAt: now,
      },
      members: [
        {
          email: ownerEmail,
          name: session.user.name || ownerEmail.split('@')[0],
          role: 'owner',
          canExpense: true,
          addedAt: now,
        },
      ],
      itineraries: [
        {
          id: `item-${Date.now()}-1`,
          dayIndex: 0,
          time: '10:00',
          title: '集合 & 出発',
          location: destination || '羽田空港 / 東京駅',
          category: 'transport',
          transportType: 'car',
          notes: '旅のスタート！忘れ物がないか確認しよう',
        },
      ],
      packingList: [
        { id: `pack-${Date.now()}-1`, category: 'documents', title: '保険証・身分証明書', isPacked: false },
        { id: `pack-${Date.now()}-2`, category: 'electronics', title: 'スマホ充電器・モバイルバッテリー', isPacked: false },
        { id: `pack-${Date.now()}-3`, category: 'clothes', title: '着替え（日数を考慮）', isPacked: false },
        { id: `pack-${Date.now()}-4`, category: 'medicine', title: '常備薬・酔い止め', isPacked: false },
      ],
      expenses: [],
      memories: [
        {
          id: `mem-${Date.now()}-1`,
          title: '旅のワクワクメモ',
          type: 'note',
          content: '楽しみな場所や行きたいお店をここに追加しよう！',
          author: session.user.name || ownerEmail,
          createdAt: now,
        },
      ],
    };

    await saveTripData(newTrip);

    return NextResponse.json({ trip: newTrip }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating trip:', error);
    return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 });
  }
}
