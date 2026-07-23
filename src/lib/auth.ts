import { NextAuthOptions, getServerSession } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getTripIndex, getTripData } from './storage/s3-adapter';
import { TripData } from '@/types';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

export const authOptions: NextAuthOptions = {
  providers: [
    ...(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
          }),
        ]
      : [
          // Demo / Dev Mode Fallback Provider when Google OAuth env vars aren't provided yet
          CredentialsProvider({
            name: 'デモログイン (Google未設定時)',
            credentials: {
              email: { label: 'メールアドレス', type: 'email', placeholder: 'family@example.com' },
              name: { label: '名前', type: 'text', placeholder: 'たろう' },
            },
            async authorize(credentials) {
              if (!credentials?.email) return null;
              return {
                id: credentials.email,
                name: credentials.name || credentials.email.split('@')[0],
                email: credentials.email.toLowerCase(),
                image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(credentials.name || 'User')}`,
              };
            },
          }),
        ]),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const userEmail = user.email.toLowerCase();

      // Check global email whitelist if configured
      const index = await getTripIndex();
      if (index.allowedGlobalEmails && index.allowedGlobalEmails.length > 0) {
        const isAllowed = index.allowedGlobalEmails.some((allowed) => {
          if (allowed.startsWith('@')) {
            // Domain check e.g. "@gmail.com"
            return userEmail.endsWith(allowed);
          }
          return userEmail === allowed.toLowerCase();
        });
        if (!isAllowed) return false;
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email.toLowerCase();
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
  secret: process.env.NEXTAUTH_SECRET || 'tabibookmark-secret-key-change-in-production',
};

export async function getAuthSession() {
  return await getServerSession(authOptions);
}

export interface PermissionResult {
  isMember: boolean;
  isOwner: boolean;
  canExpense: boolean;
  role: 'owner' | 'editor' | 'viewer' | 'none';
}

export function evaluatePermission(trip: TripData, userEmail: string | null | undefined): PermissionResult {
  if (!userEmail) {
    return { isMember: false, isOwner: false, canExpense: false, role: 'none' };
  }
  const email = userEmail.toLowerCase();

  // Owner check
  if (trip.metadata.ownerEmail.toLowerCase() === email) {
    return { isMember: true, isOwner: true, canExpense: true, role: 'owner' };
  }

  // Member check
  const member = trip.members.find((m) => m.email.toLowerCase() === email);
  if (member) {
    return {
      isMember: true,
      isOwner: false,
      canExpense: Boolean(member.canExpense),
      role: member.role,
    };
  }

  return { isMember: false, isOwner: false, canExpense: false, role: 'none' };
}
