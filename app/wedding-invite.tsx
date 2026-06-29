"use client";

import React, { type ComponentPropsWithoutRef, type SubmitEvent, type TouchEvent, useEffect, useRef, useState } from "react";
import { submitRSVP, submitGuestbookMessage } from "./actions";
import metadata from "./metadata.json";

export type GuestInvite = {
  slug: string;
  name: string;
  message: string;
  rsvpAttendance?: string | null;
  rsvpAccompanyCount?: number | null;
  rsvpMessage?: string | null;
};

export interface GuestbookMessage {
  id: string;
  name: string;
  message: string;
  createdAt: string;
};

const defaultGuest: GuestInvite = {
  slug: "guest",
  name: "Bạn",
  message: "Mời bạn đến chung vui cùng gia đình trong ngày cưới của chúng tôi.",
};

const mediaBase = "/images";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getImageUrl(path?: string) {
  if (!path) return "";
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("/") ||
    path.startsWith("data:")
  ) {
    return path;
  }
  return `${mediaBase}/${path}`;
}

const photos = metadata.gallery.photos;

const timeline = metadata.timeline;
const GUESTBOOK_PAGE_SIZE = 6;

function Img({
  src,
  alt,
  className,
  style,
  ...props
}: Readonly<{
  src: string;
  alt: string;
  className?: string;
  style?: ComponentPropsWithoutRef<"img">["style"];
} & ComponentPropsWithoutRef<"img">>) {
  return <img className={className} src={src} alt={alt} loading="lazy" style={style} {...props} />;
}

export default function WeddingInvite({
  guest = defaultGuest,
  initialGuestbook = [],
  isAnonymous = false,
  allowAnonymousGuestbookComments = false,
}: Readonly<{
  guest?: GuestInvite;
  initialGuestbook?: GuestbookMessage[];
  /**
   * True when the visitor arrived without a valid invite slug (e.g. the
   * home page). Anonymous visitors can read the guestbook, may leave a
   * guestbook entry only when `allowAnonymousGuestbookComments` is true,
   * and must never see an RSVP entry point.
   */
  isAnonymous?: boolean;
  allowAnonymousGuestbookComments?: boolean;
}>) {
  // Anonymous visitors may write to the guestbook only when the env flag
  // allows it. Valid (invited) guests can always write.
  const canSubmitGuestbook = !isAnonymous || allowAnonymousGuestbookComments;
  // Only invited guests may RSVP. Anonymous visitors never see a way to
  // confirm attendance regardless of any other flag.
  const canRsvp = !isAnonymous;
  const [opened, setOpened] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [attendance, setAttendance] = useState(guest.rsvpAttendance || "");
  const [toast, setToast] = useState("");
  const [guestbook, setGuestbook] = useState<GuestbookMessage[]>(initialGuestbook);
  const [visibleGuestbookCount, setVisibleGuestbookCount] = useState(
    Math.min(GUESTBOOK_PAGE_SIZE, initialGuestbook.length)
  );
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);
  const [isSubmittingGuestbook, setIsSubmittingGuestbook] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const pinchStateRef = useRef<{ distance: number; scale: number } | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [countdown, setCountdown] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  useEffect(() => {
    setGuestbook(initialGuestbook);
    setVisibleGuestbookCount(Math.min(GUESTBOOK_PAGE_SIZE, initialGuestbook.length));
  }, [initialGuestbook]);

  useEffect(() => {
    // Re-scan after every render that touches the guestbook list (new message,
    // "load more" pagination) so newly-added [data-reveal] elements become
    // visible — otherwise they stay at opacity: 0 forever since the observer
    // only ran once on initial mount.
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-visible)"));

    if (elements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [guestbook, visibleGuestbookCount]);

  useEffect(() => {
    const targetDate = metadata.guestbook.countdownTarget || "2026-07-29T10:30:00+07:00";
    const target = new Date(targetDate).getTime();

    const updateCountdown = () => {
      const diff = Math.max(0, target - Date.now());
      const day = 1000 * 60 * 60 * 24;
      const hour = 1000 * 60 * 60;
      const minute = 1000 * 60;
      setCountdown({
        days: Math.floor(diff / day).toString().padStart(2, "0"),
        hours: Math.floor((diff % day) / hour).toString().padStart(2, "0"),
        minutes: Math.floor((diff % hour) / minute).toString().padStart(2, "0"),
        seconds: Math.floor((diff % minute) / 1000).toString().padStart(2, "0"),
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  // Initialize audio element
  useEffect(() => {
    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      // Try MP3 first, then WAV as fallback
      const audio = new Audio('/music/wedding-music.mp3');
      audio.loop = true; // Loop the music
      audio.volume = 0.3; // Set volume to 50%
      audioRef.current = audio;

      // Handle audio errors (file not found, etc.)
      audio.addEventListener('error', (e: Event) => {
        console.warn('Audio file not found or cannot be played:', e);
        // Try with .wav extension as fallback
        const audioWav = new Audio('/music/wedding-music.wav');
        audioWav.loop = true;
        audioWav.volume = 0.3;
        audioRef.current = audioWav;
      });
    }

    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Autoplay music when invitation opens
  useEffect(() => {
    if (opened && audioRef.current && !isMusicPlaying) {
      audioRef.current.play().catch((error) => {
        console.error("Error autoplay audio:", error);
      });
      setIsMusicPlaying(true);
    }
  }, [opened]);

  // Handle ESC key and body scroll lock for active modals
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setGiftOpen(false);
        setRsvpOpen(false);
      }
    };

    if (giftOpen || rsvpOpen) {
      window.addEventListener("keydown", handleKeyDown);
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = originalStyle;
      };
    }
  }, [giftOpen, rsvpOpen]);

  useEffect(() => {
    if (selectedPhotoIndex === null) {
      return;
    }

    setZoom(1);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedPhotoIndex(null);
      } else if (event.key === "ArrowRight") {
        setSelectedPhotoIndex((prev) => (prev === null ? null : (prev + 1) % photos.length));
      } else if (event.key === "ArrowLeft") {
        setSelectedPhotoIndex((prev) => {
          if (prev === null) return null;
          return prev === 0 ? photos.length - 1 : prev - 1;
        });
      }
    };

    globalThis.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      globalThis.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedPhotoIndex]);

  const openGalleryPhoto = (index: number) => {
    setSelectedPhotoIndex(index);
    setZoom(1);
  };
  const closeGalleryPhoto = () => {
    setSelectedPhotoIndex(null);
    setZoom(1);
    pinchStateRef.current = null;
  };
  const showPreviousPhoto = () => {
    setSelectedPhotoIndex((prev) => {
      if (prev === null) return null;
      return prev === 0 ? photos.length - 1 : prev - 1;
    });
    setZoom(1);
  };
  const showNextPhoto = () => {
    setSelectedPhotoIndex((prev) => (prev === null ? null : (prev + 1) % photos.length));
    setZoom(1);
  };
  const handleGalleryTouchStart = (event: TouchEvent<HTMLElement>) => {
    if (event.touches.length === 2) {
      const [touchA, touchB] = Array.from(event.touches);
      pinchStateRef.current = {
        distance: Math.hypot(touchA.clientX - touchB.clientX, touchA.clientY - touchB.clientY),
        scale: zoom,
      };
      return;
    }

    setTouchStartX(event.touches[0]?.clientX ?? null);
  };
  const handleGalleryTouchMove = (event: TouchEvent<HTMLElement>) => {
    if (event.touches.length === 2 && pinchStateRef.current) {
      const [touchA, touchB] = Array.from(event.touches);
      const distance = Math.hypot(touchA.clientX - touchB.clientX, touchA.clientY - touchB.clientY);
      const nextScale = clamp((pinchStateRef.current.scale * distance) / pinchStateRef.current.distance, 1, 3);
      setZoom(nextScale);
    }
  };
  const handleGalleryTouchEnd = (event: TouchEvent<HTMLElement>) => {
    if (event.touches.length > 0) {
      return;
    }

    pinchStateRef.current = null;

    if (zoom > 1 || touchStartX === null) {
      setTouchStartX(null);
      return;
    }

    const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStartX;
    if (delta > 60) {
      showPreviousPhoto();
    } else if (delta < -60) {
      showNextPhoto();
    }
    setTouchStartX(null);
  };

  async function handleRsvpSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmittingRsvp(true);
    const formData = new FormData(event.currentTarget);
    const attendanceVal = formData.get("attendance") as string;
    const accompanyVal = Number.parseInt(formData.get("accompany") as string || "0", 10);
    const noteVal = formData.get("note") as string || "";

    const result = await submitRSVP(guest.slug, attendanceVal, accompanyVal, noteVal);
    setIsSubmittingRsvp(false);

    if (result.success) {
      setToast(metadata.toast.rsvpSuccess);
      setRsvpOpen(false);
    } else {
      setToast(result.error || metadata.errors.rsvpFailed);
    }
    globalThis.setTimeout(() => setToast(""), 3000);
  }

  async function handleGuestbookSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmittingGuestbook(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const nameVal = formData.get("name") as string;
    const messageVal = formData.get("message") as string;
    const websiteVal = formData.get("website") as string;

    // Use guest name if anonymous comments are not allowed and name is empty.
    // If anonymous comments are allowed and the name is empty, use an "Anonymous" label.
    const anonymousLabel = (metadata.guestbook as any).anonymousLabel ?? "Ẩn danh";
    const finalName = nameVal.trim() === ""
      ? (allowAnonymousGuestbookComments ? anonymousLabel : guest.name)
      : nameVal.trim();

    const result = await submitGuestbookMessage(finalName, messageVal, guest.slug, websiteVal);
    setIsSubmittingGuestbook(false);

    if (result.success && result.message) {
      setToast(metadata.toast.guestbookSuccess);
      const newEntry: GuestbookMessage = {
        id: result.message.id,
        name: result.message.name,
        message: result.message.message,
        createdAt: result.message.createdAt.toString(),
      };
      setGuestbook((prev) => {
        // If there's an existing entry with the same id, replace it; otherwise, prepend.
        const index = prev.findIndex((msg) => msg.id === newEntry.id);
        if (index === -1) {
          // New entry, prepend
          return [newEntry, ...prev];
        } else {
          // Replace the existing entry
          const updated = [...prev];
          updated[index] = newEntry;
          return updated;
        }
      });
      form.reset();
    } else {
      setToast(result.error || metadata.errors.guestbookFailed);
    }
    globalThis.setTimeout(() => setToast(""), 3000);
  }

  const toggleMusic = () => {
    if (!audioRef.current) return;

    if (isMusicPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((error) => {
        console.error("Error playing audio:", error);
        // Show toast if audio fails to play (e.g., due to autoplay restrictions)
        setToast("Unable to play audio. Please interact with the page first.");
        globalThis.setTimeout(() => setToast(""), 3000);
      });
    }
    setIsMusicPlaying(!isMusicPlaying);
  };

  const visibleGuestbook = guestbook.slice(0, visibleGuestbookCount);

  const handleLoadMoreGuestbook = () => {
    setVisibleGuestbookCount((prev) => Math.min(prev + GUESTBOOK_PAGE_SIZE, guestbook.length));
  };

  return (
    <main className={`site-shell ${opened ? "opened" : ""}`}>
      {!opened && (
        <section className="guest-popup">
          <div className="guest-card">
            <div className="guest-flower" />
            <p className="overline">{metadata.popup.overline}</p>
            <h1 className="name-script">{metadata.popup.coupleNames}</h1>
            <p className="guest-date">{metadata.popup.date}</p>
            <p className="guest-label">{metadata.popup.guestLabel}</p>
            <h2>{guest.name}</h2>
            <p className="host-message">&quot;{guest.message}&quot;</p>
            <button className="primary-button" onClick={() => setOpened(true)}>
              {metadata.popup.button}
            </button>
          </div>
        </section>
      )}

      <div className="card-wrapper">
        <section
          className="hero"
          style={{
            backgroundImage: `url(${getImageUrl(metadata.images.heroBg)})`,
          }}
        >
          <div className="hero-content scroll-reveal" data-reveal>
            <div className="hero-badge">Wedding Invitation</div>
            <p className="hero-subtitle">{metadata.hero.subtitle}</p>
            <div className="hero-names">
              <h1>
                <span className="name-script">{metadata.hero.groom}</span>
              </h1>
              <span className="ampersand">{metadata.hero.ampersand}</span>
              <h1>
                <span className="name-script">{metadata.hero.bride}</span>
              </h1>
            </div>
            <div className="hero-meta">
              <time>{metadata.hero.date}</time>
              <span className="hero-divider" />
              <p>Ninh Bình, Việt Nam</p>
            </div>
          </div>
        </section>

        <section className="paper couple-section scroll-reveal" data-reveal>
          <section className="paper save-date scroll-reveal" data-reveal>
            <h2 dangerouslySetInnerHTML={{ __html: metadata.saveDate.message }} />
            <div className="save-title">
              <span className="save-word save">{metadata.saveDate.save}</span>
              <em className="save-the">{metadata.saveDate.the}</em>
              <span className="save-word date">{metadata.saveDate.date}</span>
            </div>
            <div className="save-time">
              <time aria-label={`Date: ${metadata.saveDate.time}`}>{metadata.saveDate.time}</time>
            </div>
          </section>

          <div className="couple-grid">
            <div className="person left">
              <p>{metadata.coupleSection.groomLabel}</p>
              <h2 className="name-script">{metadata.coupleSection.groomName}</h2>
            </div>
            <div className="person right">
              <p>{metadata.coupleSection.brideLabel}</p>
              <h2 className="name-script">{metadata.coupleSection.brideName}</h2>
            </div>
          </div>
          <div className="couple-grid">
            <Img
                src={getImageUrl(metadata.images.coupleLeft)}
                alt={metadata.imageAlts.weddingPortrait}
            />
            <Img
                src={getImageUrl(metadata.images.coupleRight)}
                alt={metadata.imageAlts.weddingPortrait}
            />
          </div>
        </section>

        <Img
          className="full-photo"
          src={getImageUrl(metadata.images.fullPhoto1)}
          alt={metadata.imageAlts.weddingCouple}
        />

        <section className="paper info-section scroll-reveal" data-reveal>
          <div className="parents">
            <div>
              <strong>{metadata.parents.groomSide.title}</strong>
              <p>{metadata.parents.groomSide.father}</p>
              <p>{metadata.parents.groomSide.mother}</p>
            </div>
            <div>
              <strong>{metadata.parents.brideSide.title}</strong>
              <p>{metadata.parents.brideSide.father}</p>
              <p>{metadata.parents.brideSide.mother}</p>
            </div>
          </div>
          <p className="invite-line">
            {metadata.inviteLine.part1}
            <br />
            <span className="guest-name">{guest.name}</span>
            <br />
            {metadata.inviteLine.part2}
          </p>
          <h2>
            <span className="name-script">{metadata.infoSection.groomName}</span> <span>{metadata.infoSection.and}</span> <span className="name-script">{metadata.infoSection.brideName}</span>
          </h2>
          <div className="event-list">
            {metadata.eventCards.map((card, index) => (
              <EventCard
                key={"key-" + index}
                delay={index * 110}
                title={card.title}
                venue={card.venue}
                address={card.address}
                time={card.time}
                month={card.month}
                day={card.day}
                year={card.year}
                lunar={card.lunar}
                mapUrl={card.mapUrl}
                subevent={card?.subevent}
              />
            ))}
          </div>
        </section>

        <section className="paper-timeline timeline-section scroll-reveal" data-reveal>
          <h2>
            <span>{metadata.timelineSection.prefix}</span> {metadata.timelineSection.suffix}
          </h2>
          <div className="timeline">
            {timeline.map(([time, text], index) => (
                <div className="timeline-item scroll-reveal" data-reveal style={{ transitionDelay: `${index * 90}ms` }} key={time}>
                  <div className="timeline-icon">✦</div>
                  <strong>{time}</strong>
                  <p>{text}</p>
                </div>
            ))}
          </div>
        </section>

        <section className="story scroll-reveal" data-reveal>
          <Img
            src={getImageUrl(metadata.images.story)}
            alt={metadata.imageAlts.coupleStory}
          />
          <div>
            <p>{metadata.story.content[0]}</p>
            <h2>{metadata.story.title}</h2>
          </div>
        </section>

        <section className="paper gallery-section scroll-reveal" data-reveal>
          <h2>
            <span>{metadata.gallery.titleParts[0]}</span>
            {metadata.gallery.titleParts[1]}
          </h2>
          <div className="gallery">
            {photos.map((photo, index) => (
              <Img
                key={photo}
                className="scroll-reveal"
                data-reveal
                style={{ transitionDelay: `${index * 80}ms` }}
                src={getImageUrl(photo)}
                alt={`Wedding album ${index + 1}`}
                role="button"
                tabIndex={0}
                onClick={() => openGalleryPhoto(index)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openGalleryPhoto(index);
                  }
                }}
              />
            ))}
          </div>
        </section>

        <section className="paper-gift giftbox-section scroll-reveal" data-reveal>
          <h2>
            <span>Hộp mừng cưới</span>
          </h2>
          <Img
              src={getImageUrl("giftbox.png")}
              alt={"Open wedding gift"}
              onClick={() => setGiftOpen(true)}
          />
        </section>

        <section className="paper guestbook scroll-reveal" data-reveal>
          <h2>
            <span>{metadata.guestbook.prefix}</span> {metadata.guestbook.suffix}
          </h2>
          <p>{metadata.guestbook.description}</p>
          {canSubmitGuestbook && (
            <form onSubmit={handleGuestbookSubmit}>
              <input
                name="name"
                defaultValue={guest.name}
                placeholder={metadata.guestbook.inputPlaceholder}
                disabled={isSubmittingGuestbook}
                required
              />
              <textarea
                name="message"
                placeholder={metadata.guestbook.textareaPlaceholder}
                required
                disabled={isSubmittingGuestbook}
              />
              {/* Honeypot field to catch bots */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                style={{ position: 'absolute', left: '-9999px' }}
                aria-hidden="true"
              />
              <div className="form-actions">
                <button type="submit" disabled={isSubmittingGuestbook}>
                  {isSubmittingGuestbook ? metadata.guestbook.submittingLabel : metadata.guestbook.submitButton}
                </button>
                {canRsvp && (
                  <button type="button" onClick={() => setRsvpOpen(true)} disabled={isSubmittingGuestbook}>
                    {metadata.guestbook.rsvpButton}
                  </button>
                )}
              </div>
            </form>
          )}

          {guestbook.length > 0 ? (
            <>
              <div className="guestbook-summary">
                <span>
                  {`Đang hiển thị ${Math.min(visibleGuestbookCount, guestbook.length)} / ${guestbook.length} lời chúc`}
                </span>
              </div>
              <div className="guestbook-list">
                {visibleGuestbook.map((msg, index) => (
                  <div key={msg.id} className="guestbook-item scroll-reveal" data-reveal style={{ transitionDelay: `${index * 70}ms` }}>
                    <div className="guestbook-item-header">
                      <strong>{msg.name}</strong>
                      <span className="guestbook-item-date">
                        {new Date(msg.createdAt).toLocaleDateString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="guestbook-item-body">{msg.message}</p>
                  </div>
                ))}
              </div>
              {visibleGuestbookCount < guestbook.length && (
                <button type="button" className="guestbook-load-more" onClick={handleLoadMoreGuestbook}>
                  {metadata.guestbook.loadMoreButton}
                </button>
              )}
            </>
          ) : (
            <p className="guestbook-empty">{metadata.guestbook.emptyState}</p>
          )}
          <div className="countdown scroll-reveal" data-reveal>
            <h3>{metadata.guestbook.countdownTitle}</h3>
            <div className="countdown-container">
              <div className="countdown-unit">
                <span className="countdown-value">{countdown.days}</span>
                <span className="countdown-label">Days</span>
              </div>
              <div className="countdown-divider">:</div>
              <div className="countdown-unit">
                <span className="countdown-value">{countdown.hours}</span>
                <span className="countdown-label">Hours</span>
              </div>
              <div className="countdown-divider">:</div>
              <div className="countdown-unit">
                <span className="countdown-value">{countdown.minutes}</span>
                <span className="countdown-label">Minutes</span>
              </div>
              <div className="countdown-divider">:</div>
              <div className="countdown-unit">
                <span className="countdown-value">{countdown.seconds}</span>
                <span className="countdown-label">Seconds</span>
              </div>
            </div>
          </div>
        </section>

        <section className="thanks scroll-reveal" data-reveal>
          <Img
            src={getImageUrl(metadata.images.thankYou)}
            alt={metadata.imageAlts.thankYou}
          />
          <div>
            <h2>{metadata.thanks.title}</h2>
            <p>{metadata.thanks.content}</p>
          </div>
        </section>
      </div>

      <button
        className="floating-button gift-button right"
        onClick={() => setGiftOpen(true)}
        aria-label="Open wedding gift"
        style={{ width: '60px', height: '60px' }}
      >
        🎁
      </button>

      
      <button
        className={`audio-button ${isMusicPlaying ? "playing" : ""}`}
        onClick={toggleMusic}
        aria-label={metadata.floatingButtons.ariaLabel}
      >
        ♪
      </button>

      <Modal
        title={metadata.modals.gift.title}
        isOpen={giftOpen}
        onClose={() => setGiftOpen(false)}
      >
        <div className="gift-grid">
          <Gift name={metadata.modals.gift.groomName} src={getImageUrl(metadata.images.groomQR)} />
          <Gift name={metadata.modals.gift.brideName} src={getImageUrl(metadata.images.bribeQR)} />
        </div>
      </Modal>

      <Modal
        title={metadata.modals.rsvp.title}
        isOpen={rsvpOpen}
        onClose={() => setRsvpOpen(false)}
      >
        <form className="rsvp-form" onSubmit={handleRsvpSubmit}>
          <p>
            {metadata.modals.rsvp.guestLabel} <strong>{guest.name}</strong>
          </p>
          <label>
            <input
              name="attendance"
              type="radio"
              value="yes"
              required
              defaultChecked={guest.rsvpAttendance === "yes"}
              onChange={(event) => setAttendance(event.target.value)}
              disabled={isSubmittingRsvp}
            />
            {metadata.modals.rsvp.attendanceYes}
          </label>
          <label>
            <input
              name="attendance"
              type="radio"
              value="no"
              required
              defaultChecked={guest.rsvpAttendance === "no"}
              onChange={(event) => setAttendance(event.target.value)}
              disabled={isSubmittingRsvp}
            />
            {metadata.modals.rsvp.attendanceNo}
          </label>
          {attendance === "yes" && (
            <select
              name="accompany"
              defaultValue={guest.rsvpAccompanyCount?.toString() || "0"}
              aria-label="Accompany count"
              disabled={isSubmittingRsvp}
            >
              {metadata.modals.rsvp.accompanyOptions.map((opt, idx) => (
                <option key={"key" + idx} value={idx.toString()}>
                  {opt}
                </option>
              ))}
            </select>
          )}
          <textarea
            name="note"
            placeholder={metadata.modals.rsvp.textareaPlaceholder}
            defaultValue={guest.rsvpMessage || ""}
            disabled={isSubmittingRsvp}
          />
          <button type="submit" disabled={isSubmittingRsvp}>
            {isSubmittingRsvp ? metadata.modals.rsvp.submittingLabel : metadata.modals.rsvp.submitButton}
          </button>
        </form>
      </Modal>

      {selectedPhotoIndex !== null && photos.length > 0 && (
        <dialog
          className="gallery-lightbox"
          aria-label="Photo gallery"
          open
          onClick={closeGalleryPhoto}
          onTouchStart={handleGalleryTouchStart}
          onTouchMove={handleGalleryTouchMove}
          onTouchEnd={handleGalleryTouchEnd}
        >
          <div className="gallery-lightbox__content" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="gallery-lightbox__close" onClick={closeGalleryPhoto} aria-label="Close photo">
              ×
            </button>
            <div className="gallery-lightbox__image-wrapper">
              <button type="button" className="gallery-lightbox__nav gallery-lightbox__nav--prev" onClick={showPreviousPhoto} aria-label="Previous photo">
                ‹
              </button>
              <img
                className="gallery-lightbox__image"
                src={getImageUrl(photos[selectedPhotoIndex])}
                alt={`Wedding album ${selectedPhotoIndex + 1}`}
                style={{ transform: `scale(${zoom})` }}
              />
              <button type="button" className="gallery-lightbox__nav gallery-lightbox__nav--next" onClick={showNextPhoto} aria-label="Next photo">
                ›
              </button>
            </div>
            <div className="gallery-lightbox__meta">
              <span>{selectedPhotoIndex + 1} / {photos.length}</span>
              <p>Swipe left or right to browse more photos.</p>
            </div>
          </div>
        </dialog>
      )}

      {toast && <div className="toast">{toast}</div>}
      {/* Audio element for background music */}
      <audio ref={audioRef} src="/music/wedding-music.mp3" loop preload="auto">
         <track kind="captions" />
      </audio>
    </main>
  );
}

function EventCard({
  title,
  venue,
  address,
  time,
  month,
  day,
  year,
  lunar,
  mapUrl,
  delay = 0,
  subevent
}: Readonly<{
  title: string;
  venue: string;
  address: string;
  time?: string;
  month?: string;
  day?: string;
  year?: string;
  lunar?: string;
  mapUrl?: string;
  delay?: number;
  subevent?: {
    title: string;
    venue?: string;
    time?: string;
    month?: string;
    day?: string;
    year?: string;
    lunar?: string;
    mapUrl?: string;
    delay?: number;
  }
}>) {
  return (
    <article className="event-card scroll-reveal" data-reveal style={{ transitionDelay: `${delay}ms` }}>
      {subevent && 
      <div>
        <p>
          {subevent.title}
          {subevent.time && (
            <>
              <br />
              vào lúc <strong>{subevent.time}</strong>
            </>
          )}
        </p>
        {(subevent.month || subevent.day || subevent.year) && (
          <div className="date-box">
            {subevent.month && <span>{subevent.month}</span>}
            {subevent.day && <strong>{subevent.day}</strong>}
            {subevent.year && <span>{subevent.year}</span>}
          </div>
        )}
      </div>}
      <p>
        {title}
        {time && (
          <>
            <br />
            vào lúc <strong>{time}</strong>
          </>
        )}
      </p>
      {(month || day || year) && (
        <div className="date-box">
          {month && <span>{month}</span>}
          {day && <strong>{day}</strong>}
          {year && <span>{year}</span>}
        </div>
      )}
      {lunar && <p className="lunar">{lunar}</p>}
      <p>Tại địa điểm</p>
      <h3>{venue}</h3>
      <p>{address}</p>
      {mapUrl && (
        <a href={mapUrl} target="_blank" rel="noopener noreferrer">
          Chỉ đường
        </a>
      )}
    </article>
  );
}

function Modal({
  title,
  children,
  isOpen,
  onClose,
}: Readonly<{
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}>) {
  const modalRef = React.useRef<HTMLDivElement>(null);
  const [startY, setStartY] = React.useState<number | null>(null);
  const [currentY, setCurrentY] = React.useState<number>(0);
  const [isSwiping, setIsSwiping] = React.useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    const container = modalRef.current;
    if (!container) return;

    // Only start swiping down if scrolled to the top
    if (container.scrollTop === 0) {
      setStartY(e.touches[0].clientY);
      setIsSwiping(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping || startY === null) return;
    const deltaY = e.touches[0].clientY - startY;
    if (deltaY > 0) {
      setCurrentY(deltaY);
      if (e.cancelable) e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;
    setIsSwiping(false);
    if (currentY > 100) {
      onClose();
    }
    setStartY(null);
    setCurrentY(0);
  };

  const transformStyle = isOpen
    ? isSwiping
      ? `scale(1) translateY(${currentY}px)`
      : "scale(1) translateY(0)"
    : "scale(0.9) translateY(20px)";

  return (
    <div
      className={`modal-backdrop ${isOpen ? "is-active" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-hidden={!isOpen}
      onClick={onClose}
      style={{ cursor: "pointer" }}
    >
      <div
        ref={modalRef}
        className="modal"
        onClick={(event) => event.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          cursor: "default",
          transform: transformStyle,
          transition: isSwiping ? "none" : undefined,
        }}
      >
        <div className="modal-swipe-bar" />
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {children}
        <button type="button" onClick={onClose} className="modal-footer-close-button">
          Đóng
        </button>
      </div>
    </div>
  );
}

function Gift({ name, src }: Readonly<{ name: string; src: string }>) {
  return (
    <div className="gift-card">
      <h3>{name}</h3>
      <Img
        src={src}
        alt={`${name} QR code`}
      />
    </div>
  );
}