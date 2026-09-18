import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ProfileForm } from './ProfileForm';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    redirect('/login?callbackUrl=/dashboard/profile');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });

  if (!dbUser) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <ProfileForm initialUser={dbUser} />
    </div>
  );
}
