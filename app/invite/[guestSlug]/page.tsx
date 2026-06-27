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
  // Next.js 16 may pass URL-encoded slugs (e.g. "b%E1%BA%A1n" for "bạn")
  // without decoding them. The DB stores the decoded UTF-8 form, so look
  // up by the decoded slug.
  const decodedSlug = (() => {
    try {
      return decodeURIComponent(guestSlug);
    } catch {
      return guestSlug;
    }
  })();
  const allowAnonymousGuestbookComments =
    process.env.ALLOW_ANONYMOUS_GUESTBOOK_COMMENTS === "true";

  // Fetch guest and guestbook messages in parallel
  const [guest, guestbookMessages] = await Promise.all([
    prisma.guest.findUnique({
      where: { slug: decodedSlug },
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
      allowAnonymousGuestbookComments={allowAnonymousGuestbookComments}
      isAnonymous={false}
    />
  );
}
