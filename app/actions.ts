"use server";

import { prisma } from "../lib/prisma";
import { revalidatePath } from "next/cache";
import metadata from "./metadata.json";

export async function submitRSVP(
  slug: string,
  attendance: string,
  accompanyCount: number,
  message: string
) {
  try {
    await prisma.guest.update({
      where: { slug },
      data: {
        rsvpAttendance: attendance,
        rsvpAccompanyCount: accompanyCount,
        rsvpMessage: message,
      },
    });

    revalidatePath(`/invite/${slug}`);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to submit RSVP:", error);
    return { success: false, error: metadata.errors.rsvpFailed };
  }
}

export async function submitGuestbookMessage(name: string, message: string) {
  try {
    const newMsg = await prisma.guestbookMessage.create({
      data: {
        name,
        message,
      },
    });

    revalidatePath("/", "layout");
    return {
      success: true,
      message: {
        id: newMsg.id,
        name: newMsg.name,
        message: newMsg.message,
        createdAt: newMsg.createdAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Failed to submit guestbook message:", error);
    return { success: false, error: metadata.errors.guestbookFailed };
  }
}
