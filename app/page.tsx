import { prisma } from "../lib/prisma";
import WeddingInvite from "./wedding-invite";

export default async function Home() {
  // Resiliently fetch default guest and guestbook messages
  const [defaultGuest, guestbookMessages] = await Promise.all([
    prisma.guest
      .findUnique({
        where: { slug: "phuong-mai" },
      })
      .catch(() => null),
    prisma.guestbookMessage
      .findMany({
        orderBy: { createdAt: "desc" },
      })
      .catch(() => []),
  ]);

  const guest = defaultGuest || {
    slug: "phuong-mai",
    name: "Phương Mai",
    message: "Mời chị đến chung vui cùng gia đình trong ngày cưới của chúng em.",
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
    />
  );
}
