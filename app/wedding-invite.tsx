"use client";

import { FormEvent, useMemo, useState } from "react";
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
  slug: "phuong-mai",
  name: "Phương Mai",
  message: "Mời chị đến chung vui cùng gia đình trong ngày cưới của chúng em.",
};

const mediaBase =
  "https://media.cocohappii.com/optimized/d2770922-ba69-482b-b451-fcd5c4016ace";

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
}: {
  guest?: GuestInvite;
  initialGuestbook?: GuestbookMessage[];
}) {
  const [opened, setOpened] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [attendance, setAttendance] = useState(guest.rsvpAttendance || "");
  const [toast, setToast] = useState("");
  const [guestbook, setGuestbook] = useState<GuestbookMessage[]>(initialGuestbook);
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);
  const [isSubmittingGuestbook, setIsSubmittingGuestbook] = useState(false);

  const countdown = useMemo(() => {
    const target = new Date("2026-01-20T11:00:00+07:00").getTime();
    const diff = Math.max(0, target - Date.now());
    const day = 1000 * 60 * 60 * 24;
    const hour = 1000 * 60 * 60;
    const minute = 1000 * 60;
    return {
      days: Math.floor(diff / day).toString().padStart(2, "0"),
      hours: Math.floor((diff % day) / hour).toString().padStart(2, "0"),
      minutes: Math.floor((diff % hour) / minute).toString().padStart(2, "0"),
      seconds: Math.floor((diff % minute) / 1000).toString().padStart(2, "0"),
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

    const result = await submitGuestbookMessage(nameVal, messageVal);
    setIsSubmittingGuestbook(false);

    if (result.success && result.message) {
      setToast(metadata.toast.guestbookSuccess);
      const newEntry: GuestbookMessage = {
        id: result.message.id,
        name: result.message.name,
        message: result.message.message,
        createdAt: result.message.createdAt.toString(),
      };
      setGuestbook((prev) => [newEntry, ...prev]);
      form.reset();
    } else {
      setToast(result.error || metadata.errors.guestbookFailed);
    }
    window.setTimeout(() => setToast(""), 3000);
  }

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
            backgroundImage: `url(${mediaBase}/812e3c75-a6b9-4426-b43a-fd11845b1c1f.jpg)`,
          }}
        >
          <div className="hero-content">
            <p>{metadata.hero.subtitle}</p>
            <h1>
              <span>{metadata.hero.groom}</span>
              <span>{metadata.hero.bride}</span>
            </h1>
            <div className="ampersand">{metadata.hero.ampersand}</div>
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
                src={`${mediaBase}/804d434f-60ec-46e3-a93c-ca5c15757bd3.jpg`}
                alt={metadata.imageAlts.weddingPortrait}
              />
            </div>
            <div className="photo-frame front">
              <Img
                src={`${mediaBase}/3011a6f8-1cf9-46f4-a3cd-40add6ee83f6.jpg`}
                alt={metadata.imageAlts.weddingPortrait}
              />
            </div>
          </div>
        </section>

        <Img
          className="full-photo"
          src={`${mediaBase}/5b60485e-165f-4a95-a51f-94b0e7400144.jpg`}
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
              />
            ))}
          </div>
        </section>

        <section className="story">
          <Img
            src={`${mediaBase}/b1f0889d-1340-44e8-ae22-8c19c4fd21f7.jpg`}
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
              src={`${mediaBase}/a84d4eca-a5fa-4178-aa21-085d3fda2874.jpg`}
              alt={metadata.imageAlts.weddingPortrait}
            />
            <Img
              src={`${mediaBase}/dbdbc6a3-58c7-4629-b6b8-eac7713c4bf5.jpg`}
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
          src={`${mediaBase}/4eff7aee-b9d2-452c-9e4e-2e46618c8993.jpg`}
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
                src={`${mediaBase}/${photo}`}
                alt={`Wedding album ${index + 1}`} /* We could make this dynamic but keep simple */
              />
            ))}
          </div>
        </section>

        <section className="paper guestbook">
          <h2>{metadata.guestbook.title}</h2>
          <p>{metadata.guestbook.description}</p>
          <form onSubmit={handleGuestbookSubmit}>
            <input
              name="name"
              placeholder={metadata.guestbook.inputPlaceholder}
              required
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
              <button type="button" onClick={() => setRsvpOpen(true)}>
                {metadata.guestbook.rsvpButton}
              </button>
            </div>
          </form>

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
            src={`${mediaBase}/1b2ea1c8-5b1a-4045-9d97-926d1ef3e4bb.jpg`}
            alt={metadata.imageAlts.thankYou}
          />
          <div>
            <h2>{metadata.thanks.title}</h2>
            <p>{metadata.thanks.content}</p>
          </div>
        </section>
      </div>

      <button
        className="floating-button rsvp-button"
        onClick={() => setRsvpOpen(true)}
        aria-label="Open RSVP"
      >
        {metadata.floatingButtons.rsvpLabel}
      </button>
      <button
        className="floating-button gift-button"
        onClick={() => setGiftOpen(true)}
        aria-label="Open wedding gift"
      >
        {metadata.floatingButtons.giftLabel}
      </button>
      <button className="audio-button" aria-label={metadata.floatingButtons.ariaLabel}>
        ♪
      </button>

      {giftOpen && (
        <Modal title={metadata.modals.gift.title} onClose={() => setGiftOpen(false)}>
          <div className="gift-grid">
            <Gift name={metadata.modals.gift.groomName} type="groom" />
            <Gift name={metadata.modals.gift.brideName} type="bride" />
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
    </main>
  );
}

function EventCard({
  title,
  venue,
  address,
}: {
  title: string;
  venue: string;
  address: string;
}) {
  return (
    <article className="event-card">
      <p>
        {title}
        <br />
        vào lúc <strong>16:00, Thứ Hai</strong>
      </p>
      <div className="date-box">
        <span>THÁNG 01</span>
        <strong>19</strong>
        <span>NĂM 2026</span>
      </div>
      <p className="lunar">(Tức ngày 1 tháng 12 năm Ất Tỵ)</p>
      <p>Tại địa điểm</p>
      <h3>{venue}</h3>
      <p>{address}</p>
      <a href="https://maps.app.goo.gl/zGqBkBf8Q4HX3SyY6" target="_blank">
        Chỉ đường
      </a>
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

function Gift({ name, type }: { name: string; type: "groom" | "bride" }) {
  return (
    <div className="gift-card">
      <h3>{name}</h3>
      <Img
        src={`https://media.cocohappii.com/qr_codes/df77c4eb-5f8c-432f-8dd8-289be933cb17_${type}.png?t=639152094992908050`}
        alt={`${name} QR code`}
      />
    </div>
  );
}