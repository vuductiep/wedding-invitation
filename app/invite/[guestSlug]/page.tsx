import { notFound } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import WeddingInvite from "../../wedding-invite";

export async function generateStaticParams() {
  try {
    const guests = await prisma.guest.findMany({
      select: { slug: true },
    });
    return guests.map((guest) => ({
      guestSlug: guest.slug,
    }));
  } catch (error) {
    console.error("Failed to generate static params:", error);
    return [];
  }
}

export default async function GuestInvitePage({
  params,
}: {
  params: Promise<{ guestSlug: string }>;
}) {
  const { guestSlug } = await params;

  // Fetch guest and guestbook messages in parallel
  const [guest, guestbookMessages] = await Promise.all([
    prisma.guest.findUnique({
      where: { slug: guestSlug },
    }),
    prisma.guestbookMessage.findMany({
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!guest) {
    notFound();
  }

  return (
    <WeddingInvite
      guest={guest}
      initialGuestbook={guestbookMessages.map((msg) => ({
        id: msg.id,
        name: msg.name,
        message: msg.message,
        createdAt: msg.createdAt.toISOString(),
      }))}
    />
  );
}
