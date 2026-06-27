'use server';

import { prisma } from '../../../lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getPendingMessages(token: string) {
  if (token !== process.env.ADMIN_TOKEN) {
    throw new Error('Unauthorized');
  }

  return await prisma.guestbookMessage.findMany({
    where: { approved: false },
    orderBy: { createdAt: 'desc' },
  });
}

export async function approveMessage(token: string, id: string) {
  if (token !== process.env.ADMIN_TOKEN) {
    throw new Error('Unauthorized');
  }

  await prisma.guestbookMessage.update({
    where: { id },
    data: { approved: true },
  });

  revalidatePath('/', 'layout');
}

export async function deleteMessage(token: string, id: string) {
  if (token !== process.env.ADMIN_TOKEN) {
    throw new Error('Unauthorized');
  }

  await prisma.guestbookMessage.delete({
    where: { id },
  });

  revalidatePath('/', 'layout');
}

export async function getStats(token: string) {
  if (token !== process.env.ADMIN_TOKEN) {
    throw new Error('Unauthorized');
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [pending, today, totalApproved] = await Promise.all([
    prisma.guestbookMessage.count({ where: { approved: false } }),
    prisma.guestbookMessage.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.guestbookMessage.count({ where: { approved: true } }),
  ]);

  return { pending, today, totalApproved };
}