import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AddressManager } from './AddressManager';

export const dynamic = 'force-dynamic';

export default async function AddressesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login?callbackUrl=/dashboard/addresses');
  }

  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });

  return (
    <div className="space-y-6">
      <AddressManager initialAddresses={addresses} />
    </div>
  );
}
