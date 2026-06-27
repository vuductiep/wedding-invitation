import { prisma } from "../lib/prisma";
import WeddingInvite from "./wedding-invite";

export default async function Home() {
  const allowAnonymousGuestbookComments =
    process.env.ALLOW_ANONYMOUS_GUESTBOOK_COMMENTS === "true";

  // Resiliently fetch default guest and guestbook messages
  const [defaultGuest, guestbookMessages] = await Promise.all([
    prisma.guest
      .findUnique({
        where: { slug: "bạn" },
      })
      .catch(() => null),
    prisma.guestbookMessage
      .findMany({
        orderBy: { createdAt: "desc" },
      })
      .catch(() => []),
  ]);

  const guest = defaultGuest || {
    slug: "guest",
    name: "Bạn",
    message: "Mời bạn đến chung vui cùng gia đình trong ngày cưới của chúng tôi.",
  };

  return (
    <WeddingInvite
      guest={guest}
      initialGuestbook={guestbookMessages.map((msg) => ({
        id: msg.id,
        name: msg.name,
        message: msg.message,
        createdAt: msg.createdAt.toISOString(),
      }))}
      isAnonymous={true}
      allowAnonymousGuestbookComments={allowAnonymousGuestbookComments}
    />
  );
}
