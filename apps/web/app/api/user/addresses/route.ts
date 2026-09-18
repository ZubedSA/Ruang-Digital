import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ success: true, data: addresses });
  } catch (error: any) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { label, recipientName, phone, street, subdistrict, city, province, postalCode, isDefault } = body;

    if (!recipientName || !phone || !street || !city || !province || !postalCode) {
      return NextResponse.json({ error: 'Mohon lengkapi field alamat yang wajib diisi' }, { status: 400 });
    }

    // If user has no addresses yet, make this one default automatically
    const existingCount = await prisma.address.count({ where: { userId: user.id } });
    const shouldBeDefault = existingCount === 0 || !!isDefault;

    if (shouldBeDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId: user.id,
        label: label?.trim() || 'Rumah',
        recipientName: recipientName.trim(),
        phone: phone.trim(),
        street: street.trim(),
        subdistrict: subdistrict?.trim() || null,
        city: city.trim(),
        province: province.trim(),
        postalCode: postalCode.trim(),
        isDefault: shouldBeDefault,
      },
    });

    return NextResponse.json({ success: true, data: newAddress }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating address:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, label, recipientName, phone, street, subdistrict, city, province, postalCode, isDefault } = body;

    if (!id) {
      return NextResponse.json({ error: 'Address ID diperlukan' }, { status: 400 });
    }

    const existing = await prisma.address.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Alamat tidak ditemukan' }, { status: 404 });
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id },
      data: {
        label: label?.trim() || existing.label,
        recipientName: recipientName?.trim() || existing.recipientName,
        phone: phone?.trim() || existing.phone,
        street: street?.trim() || existing.street,
        subdistrict: subdistrict !== undefined ? subdistrict?.trim() : existing.subdistrict,
        city: city?.trim() || existing.city,
        province: province?.trim() || existing.province,
        postalCode: postalCode?.trim() || existing.postalCode,
        isDefault: isDefault !== undefined ? !!isDefault : existing.isDefault,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating address:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Address ID diperlukan' }, { status: 400 });
    }

    const existing = await prisma.address.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Alamat tidak ditemukan' }, { status: 404 });
    }

    await prisma.address.delete({ where: { id } });

    // If deleted address was default, set another address as default if exists
    if (existing.isDefault) {
      const nextAddress = await prisma.address.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });
      if (nextAddress) {
        await prisma.address.update({
          where: { id: nextAddress.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Alamat berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting address:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
