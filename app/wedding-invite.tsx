"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
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

function Img({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return <img className={className} src={src} alt={alt} loading="lazy" />;
}

export default function WeddingInvite({
  guest = defaultGuest,
  initialGuestbook = [],
  isViewOnly = false,
}: {
  guest?: GuestInvite;
  initialGuestbook?: GuestbookMessage[];
  isViewOnly?: boolean;
}) {
  const [opened, setOpened] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [attendance, setAttendance] = useState(guest.rsvpAttendance || "");
  const [toast, setToast] = useState("");
  const [guestbook, setGuestbook] = useState<GuestbookMessage[]>(initialGuestbook);
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);
  const [isSubmittingGuestbook, setIsSubmittingGuestbook] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [countdown, setCountdown] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

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
      audio.volume = 0.5; // Set volume to 50%
      audioRef.current = audio;

      // Handle audio errors (file not found, etc.)
      audio.addEventListener('error', (e: Event) => {
        console.warn('Audio file not found or cannot be played:', e);
        // Try with .wav extension as fallback
        const audioWav = new Audio('/music/wedding-music.wav');
        audioWav.loop = true;
        audioWav.volume = 0.5;
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

  async function handleRsvpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmittingRsvp(true);
    const formData = new FormData(event.currentTarget);
    const attendanceVal = formData.get("attendance") as string;
    const accompanyVal = parseInt(formData.get("accompany") as string || "0", 10);
    const noteVal = formData.get("note") as string || "";

    const result = await submitRSVP(guest.slug, attendanceVal, accompanyVal, noteVal);
    setIsSubmittingRsvp(false);

    if (result.success) {
      setToast(metadata.toast.rsvpSuccess);
      setRsvpOpen(false);
    } else {
      setToast(result.error || metadata.errors.rsvpFailed);
    }
    window.setTimeout(() => setToast(""), 3000);
  }

  async function handleGuestbookSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmittingGuestbook(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const nameVal = formData.get("name") as string;
    const messageVal = formData.get("message") as string;

    // Use guest name if name input is empty, otherwise use the input value as alias
    const finalName = nameVal.trim() !== "" ? nameVal.trim() : guest.name;

    const result = await submitGuestbookMessage(finalName, messageVal, guest.slug);
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
        if (index !== -1) {
          // Replace the existing entry
          const updated = [...prev];
          updated[index] = newEntry;
          return updated;
        } else {
          // New entry, prepend
          return [newEntry, ...prev];
        }
      });
      form.reset();
    } else {
      setToast(result.error || metadata.errors.guestbookFailed);
    }
    window.setTimeout(() => setToast(""), 3000);
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
        window.setTimeout(() => setToast(""), 3000);
      });
    }
    setIsMusicPlaying(!isMusicPlaying);
  };

  return (
    <main className={`site-shell ${opened ? "opened" : ""}`}>
      {!opened && (
        <section className="guest-popup">
          <div className="guest-card">
            <div className="guest-flower" />
            <p className="overline">{metadata.popup.overline}</p>
            <h1>{metadata.popup.coupleNames}</h1>
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
          <div className="hero-content">
            <p>{metadata.hero.subtitle}</p>
            <h1>
              <span>{metadata.hero.groom}</span>
            </h1>
            <span className="ampersand">{metadata.hero.ampersand}</span>
            <h1>
              <span>{metadata.hero.bride}</span>
            </h1>
            <time>{metadata.hero.date}</time>
          </div>
        </section>

        <section className="paper save-date">
          <p className="monogram">
            T<span>H</span>
          </p>
          <h2 dangerouslySetInnerHTML={{ __html: metadata.saveDate.message }} />
          <div className="save-title">
            <span>{metadata.saveDate.save}</span>
            <em>{metadata.saveDate.the}</em>
            <span>{metadata.saveDate.date}</span>
          </div>
          <time>{metadata.saveDate.time}</time>
          <div className="stacked-photos">
            <div className="photo-frame back">
              <Img
                src={getImageUrl(metadata.images.saveDateBack)}
                alt={metadata.imageAlts.weddingPortrait}
              />
            </div>
            <div className="photo-frame front">
              <Img
                src={getImageUrl(metadata.images.saveDateFront)}
                alt={metadata.imageAlts.weddingPortrait}
              />
            </div>
          </div>
        </section>

        <Img
          className="full-photo"
          src={getImageUrl(metadata.images.fullPhoto1)}
          alt={metadata.imageAlts.weddingCouple}
        />

        <section className="paper info-section">
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
            {metadata.inviteLine.part2}
          </p>
          <h2>
            {metadata.infoSection.groomName} <span>{metadata.infoSection.and}</span> {metadata.infoSection.brideName}
          </h2>
          <div className="event-list">
            {metadata.eventCards.map((card, index) => (
              <EventCard
                key={index}
                title={card.title}
                venue={card.venue}
                address={card.address}
                time={card.time}
                month={card.month}
                day={card.day}
                year={card.year}
                lunar={card.lunar}
                mapUrl={card.mapUrl}
              />
            ))}
          </div>
        </section>

        <section className="story">
          <Img
            src={getImageUrl(metadata.images.story)}
            alt={metadata.imageAlts.coupleStory}
          />
          <div>
            <p>{metadata.story.content[0]}</p>
            <h2>{metadata.story.title}</h2>
          </div>
        </section>

        <section className="paper couple-section">
          <div className="person left">
            <p>{metadata.coupleSection.brideLabel}</p>
            <h2>{metadata.coupleSection.brideName}</h2>
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
          <div className="person right">
            <p>{metadata.coupleSection.groomLabel}</p>
            <h2>{metadata.coupleSection.groomName}</h2>
          </div>
        </section>

        <Img
          className="full-photo"
          src={getImageUrl(metadata.images.fullPhoto2)}
          alt={metadata.imageAlts.weddingCouple}
        />

        <section className="paper timeline-section">
          <h2>
            <span>{metadata.timelineSection.prefix}</span> {metadata.timelineSection.suffix}
          </h2>
          <div className="timeline">
            {timeline.map(([time, text]) => (
              <div className="timeline-item" key={time}>
                <div className="timeline-icon">✦</div>
                <strong>{time}</strong>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="paper gallery-section">
          <h2>
            <span>{metadata.gallery.titleParts[0]}</span> of <span>{metadata.gallery.titleParts[2]}</span>
          </h2>
          <div className="gallery">
            {photos.map((photo, index) => (
              <Img
                key={photo}
                src={getImageUrl(photo)}
                alt={`Wedding album ${index + 1}`} /* We could make this dynamic but keep simple */
              />
            ))}
          </div>
        </section>

        <section className="paper guestbook">
          <h2>{metadata.guestbook.title}</h2>
          <p>{metadata.guestbook.description}</p>
          {!isViewOnly && (
            <form onSubmit={handleGuestbookSubmit}>
              <input
                name="name"
                defaultValue={guest.name}
                placeholder={metadata.guestbook.inputPlaceholder}
                disabled={isSubmittingGuestbook}
              />
              <textarea
                name="message"
                placeholder={metadata.guestbook.textareaPlaceholder}
                required
                disabled={isSubmittingGuestbook}
              />
              <div className="form-actions">
                <button type="submit" disabled={isSubmittingGuestbook}>
                  {isSubmittingGuestbook ? metadata.guestbook.submittingLabel : metadata.guestbook.submitButton}
                </button>
                <button type="button" onClick={() => setRsvpOpen(true)} disabled={isSubmittingGuestbook}>
                  {metadata.guestbook.rsvpButton}
                </button>
              </div>
            </form>
          )}

          {guestbook.length > 0 && (
            <div className="guestbook-list">
              {guestbook.map((msg) => (
                <div key={msg.id} className="guestbook-item">
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
          )}
          <div className="countdown">
            <h3>{metadata.guestbook.countdownTitle}</h3>
            <div>
              <span>{countdown.days}</span>:<span>{countdown.hours}</span>:
              <span>{countdown.minutes}</span>:<span>{countdown.seconds}</span>
            </div>
          </div>
        </section>

        <section className="thanks">
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
        className={`audio-button ${isMusicPlaying ? "playing" : ""} left`}
        onClick={toggleMusic}
        aria-label={metadata.floatingButtons.ariaLabel}
        style={{ width: '60px', height: '60px' }}
      >
        ♪
      </button>

      {giftOpen && (
        <Modal title={metadata.modals.gift.title} onClose={() => setGiftOpen(false)}>
          <div className="gift-grid">
            <Gift name={metadata.modals.gift.groomName} src={getImageUrl(metadata.images.groomQR)} />
            <Gift name={metadata.modals.gift.brideName} src={getImageUrl(metadata.images.brideQR)} />
          </div>
        </Modal>
      )}

      {rsvpOpen && (
        <Modal title={metadata.modals.rsvp.title} onClose={() => setRsvpOpen(false)}>
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
                  <option key={idx} value={idx.toString()}>
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
      )}

      {toast && <div className="toast">{toast}</div>}
      {/* Audio element for background music */}
      <audio ref={audioRef} src="/music/wedding-music.mp3" loop preload="auto" />
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
}: {
  title: string;
  venue: string;
  address: string;
  time?: string;
  month?: string;
  day?: string;
  year?: string;
  lunar?: string;
  mapUrl?: string;
}) {
  return (
    <article className="event-card">
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
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Gift({ name, src }: { name: string; src: string }) {
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