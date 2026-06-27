"use server";

import { prisma } from "../lib/prisma";
import { revalidatePath } from "next/cache";
import metadata from "./metadata.json";
import spamFilterConfig from "../spam-filter.json";

// Helper: build a regex from an array of patterns (escaped)
function buildRegex(patterns: string[], flags: string = ""): RegExp {
  if (!patterns || patterns.length === 0) return /^$/; // matches nothing
  const escaped = patterns.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(escaped.join("|"), flags);
}

// Build regexes once at module load
const spamFilter = {
  badWords: buildRegex(spamFilterConfig.badWords ?? [], "i"),
  urlPatterns: buildRegex(spamFilterConfig.urlPatterns ?? [], "i"),
  repeatedChar: new RegExp(spamFilterConfig.repeatedChar ?? "", ""),
  excessivePunct: new RegExp(spamFilterConfig.excessivePunct ?? "", ""),
  htmlTags: new RegExp(spamFilterConfig.htmlTags ?? "", "")
};

const allowAnonymousGuestbookComments =
  process.env.ALLOW_ANONYMOUS_GUESTBOOK_COMMENTS === "true";

// Module-level constants for isMeaningful (built once, reused per request)
const INVISIBLE_CHARS_REGEX = /\p{Cf}/gu; // ZWSP, ZWNJ, ZWJ, BOM, soft hyphen, bidi marks, ...
const LETTER_REGEX = /\p{Letter}/u;       // Unicode letters only (excludes Mn / combining marks)
// English vowels + Vietnamese vowels. After .normalize('NFC'), precomposed
// forms (ú, ế, ứ, ọ, ...) are single code points, NOT base+combining-mark
// pairs — so /u/i alone won't match them. List the precomposed vowels
// explicitly.
const VOWEL_REGEX =
  /[aeiouyàáâãèéêìíòóôõùúýăĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/iu;
const MIN_TEXT_LENGTH = 2;
const MIN_LETTER_COUNT = 2;
const MIN_LETTER_RATIO = 0.3;

function isMeaningful(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  // 1. NFC-normalize so Vietnamese diacritics compare consistently across
  //    macOS (which produces NFD: "a" + combining breve) and Windows (NFC).
  // 2. Strip invisible "Format" chars (ZWSP/ZWNJ/ZWJ, BOM, soft hyphen, bidi
  //    marks) that Vietnamese IMEs and copy-paste sometimes inject — these
  //    would otherwise inflate the length and bypass the letter-ratio check.
  // 3. Trim surrounding whitespace.
  const cleaned = text
    .normalize('NFC')
    .replace(INVISIBLE_CHARS_REGEX, '')
    .trim();

  if (cleaned.length < MIN_TEXT_LENGTH) {
    return false;
  }

  // Count Unicode code points so emoji / surrogate pairs count as 1 char
  // (UTF-16 .length would otherwise count a single emoji as 2 units).
  const codePoints = Array.from(cleaned);
  const totalChars = codePoints.length;

  // Count real letters only — Latin, Vietnamese extended, etc. Combining
  // marks, digits, punctuation, and symbols are excluded.
  const lettersCount = codePoints.reduce(
    (count, ch) => count + (LETTER_REGEX.test(ch) ? 1 : 0),
    0,
  );

  // Require an absolute minimum of letters — catches emoji-only padding
  // around a single letter ("💖 a 💖") and similar low-content cases.
  if (lettersCount < MIN_LETTER_COUNT) {
    return false;
  }

  // Require a sensible letter ratio — rejects mostly-punctuation/symbol input.
  const letterRatio = lettersCount / totalChars;
  if (letterRatio < MIN_LETTER_RATIO) {
    return false;
  }

  // Reject a single character repeated ("aaaa", "🌹🌹🌹", "🔥🔥🔥🔥").
  if (new Set(codePoints).size === 1) {
    return false;
  }

  // Reject consonant-only gibberish like "xyz", "bcdfgh", or "bsmj".
  // Real Vietnamese and English words always contain at least one vowel;
  // Vietnamese vowels include ă, â, ê, ô, ơ, ư in addition to a/e/i/o/u.
  // For Korean, we accept any Hangul syllable as implicitly containing vowels.
  const hasVowel = VOWEL_REGEX.test(cleaned);
  const hasHangul = /[가-힯]/.test(cleaned);
  if (!hasVowel && !hasHangul) {
    return false;
  }

  return true;
}

function isSpam(text: string): boolean {
  return (
    spamFilter.badWords.test(text) ||
    spamFilter.urlPatterns.test(text) ||
    spamFilter.repeatedChar.test(text) ||
    spamFilter.excessivePunct.test(text) ||
    spamFilter.htmlTags.test(text)
  );
}

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

export async function submitGuestbookMessage(name: string, message: string, guestSlug?: string, website?: string) {
  try {
    // Honeypot check: if website field is filled, treat as spam
    if (website && website.trim() !== '') {
      // Log or monitor spam attempts if needed
      console.warn('Spam attempt detected via honeypot');
      // Return success but do not save the message to avoid tipping off the bot
      return {
        success: true,
        message: {
          id: '0', // dummy id
          name: '',
          message: '',
          createdAt: new Date().toISOString(),
        },
      };
    }

    // Check if the message is meaningful
    if (!isMeaningful(message)) {
      return {
        success: false,
        error: metadata.errors.guestbookFailed
      };
    }

    // Content-based spam check
    const combined = `${name} ${message}`;
    if (isSpam(combined)) {
      console.warn('Guestbook submission blocked by content filter:', { name, message, guestSlug });
      // Return generic failure to avoid leaking filter details to bots
      return {
        success: false,
        error: metadata.errors.guestbookFailed
      };
    }

    let guestId: string | undefined;

    // If we have a guest slug, find the guest to link the message to
    if (guestSlug) {
      const guest = await prisma.guest.findUnique({
        where: { slug: guestSlug },
        select: { id: true },
      });

      if (guest) {
        guestId = guest.id;
      }
    }

    const isAnonymousSubmission = !guestId;
    if (!allowAnonymousGuestbookComments && isAnonymousSubmission) {
      return {
        success: false,
        error: metadata.errors.guestbookFailed,
      };
    }

    if (guestId) {
      // Upsert: update if exists, else create
      const upserted = await prisma.guestbookMessage.upsert({
        where: { guestId: guestId },
        update: { name, message, approved: false },
        create: { name, message, guestId, approved: false },
      });

      revalidatePath("/", "layout");
      return {
        success: true,
        message: {
          id: upserted.id,
          name: upserted.name,
          message: upserted.message,
          createdAt: upserted.createdAt.toISOString(),
        },
      };
    } else {
      // No guest slug -> create new anonymous message
      const newMsg = await prisma.guestbookMessage.create({
        data: { name, message, approved: false },
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
    }
  } catch (error) {
    console.error("Failed to submit guestbook message:", error);
    return { success: false, error: metadata.errors.guestbookFailed };
  }
}