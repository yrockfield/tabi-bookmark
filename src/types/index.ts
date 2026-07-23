export type MemberRole = 'owner' | 'editor' | 'viewer';

export interface TripMember {
  email: string;
  name?: string;
  role: MemberRole;
  canExpense: boolean;
  addedAt: string;
}

export interface TripMetadata {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverImage?: string;
  description?: string;
  ownerEmail: string;
  createdAt: string;
  updatedAt: string;
}

export type ItineraryCategory = 'spot' | 'food' | 'transport' | 'hotel' | 'other';
export type TransportType = 'car' | 'train' | 'flight' | 'walk' | 'bus';

export interface ItineraryItem {
  id: string;
  dayIndex: number; // 0-based
  time: string; // e.g. "09:30"
  title: string;
  location?: string;
  googleMapsUrl?: string;
  category: ItineraryCategory;
  transportType?: TransportType;
  notes?: string;
  cost?: number;
}

export type PackingCategory = 'shared' | 'clothes' | 'electronics' | 'documents' | 'medicine' | 'other';

export interface PackingItem {
  id: string;
  category: PackingCategory;
  title: string;
  assignee?: string;
  isPacked: boolean;
}

export type ExpenseCategory = 'food' | 'transport' | 'hotel' | 'shopping' | 'activity' | 'other';

export interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  paidBy: string;
  splitAmong: string[]; // List of names or emails
  date: string;
  notes?: string;
}

export interface MemoryItem {
  id: string;
  title: string;
  type: 'note' | 'photo';
  content: string; // Text note content or Photo URL/data
  author: string;
  createdAt: string;
}

export interface TripData {
  metadata: TripMetadata;
  members: TripMember[];
  itineraries: ItineraryItem[];
  packingList: PackingItem[];
  expenses: ExpenseItem[];
  memories: MemoryItem[];
}

export interface TripIndexItem {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverImage?: string;
  ownerEmail: string;
  members: string[]; // Emails allowed to access
  updatedAt: string;
}

export interface TripIndex {
  allowedGlobalEmails: string[]; // Whitelist if specified in config/env
  trips: TripIndexItem[];
}
