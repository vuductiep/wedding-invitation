import { notFound } from "next/navigation";
import { getGuest, guests } from "../../guests";
import WeddingInvite from "../../wedding-invite";

export function generateStaticParams() {
  return Object.values(guests).map((guest) => ({
    guestSlug: guest.slug,
  }));
}

export default async function GuestInvitePage({
  params,
}: {
  params: Promise<{ guestSlug: string }>;
}) {
  const { guestSlug } = await params;
  const guest = getGuest(guestSlug);

  if (!guest) {
    notFound();
  }

  return <WeddingInvite guest={guest} />;
}
