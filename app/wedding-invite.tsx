"use client";

import { FormEvent, useMemo, useState } from "react";

export type GuestInvite = {
  slug: string;
  name: string;
  message: string;
};

const defaultGuest: GuestInvite = {
  slug: "phuong-anh",
  name: "Phương Anh",
  message:
    "Mời chị và người thương đến tham dự đám cưới chung vui cùng gia đình em nhé ^^",
};

const mediaBase =
  "https://media.cocohappii.com/optimized/d2770922-ba69-482b-b451-fcd5c4016ace";

const photos = [
  "97316b62-00b1-440a-a262-ba9d38c638a0.jpg",
  "5d324352-0090-4db0-b943-753fc718c623.jpg",
  "bcaf33ed-84e0-4848-908f-6f431015b5b4.jpg",
  "f6cc0e9a-7056-4430-bd72-721d3246579a.jpg",
  "af3d1678-bf31-49a7-817e-95b62b279899.jpg",
  "ed71d06f-260d-44b6-a998-7b2c914a83c6.jpg",
  "c64fa484-3790-489b-89a7-7ebece85c022.jpg",
  "23a0b1a8-fccc-47c8-bc38-fc1c1eedff48.jpg",
];

const timeline = [
  ["16:00", "Đón khách"],
  ["16:30", "Bắt đầu nghi lễ cưới"],
  ["17:00", "Khai tiệc chúc mừng"],
];

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

export default function WeddingInvite({ guest = defaultGuest }: { guest?: GuestInvite }) {
  const [opened, setOpened] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [attendance, setAttendance] = useState("");
  const [toast, setToast] = useState("");

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

  function submitForm(event: FormEvent<HTMLFormElement>, message: string) {
    event.preventDefault();
    setToast(message);
    setRsvpOpen(false);
    window.setTimeout(() => setToast(""), 3000);
  }

  return (
    <main className={`site-shell ${opened ? "opened" : ""}`}>
      {!opened && (
        <section className="guest-popup">
          <div className="guest-card">
            <div className="guest-flower" />
            <p className="overline">The Wedding Of</p>
            <h1>Thanh Tuyến ♥ Ngọc Huyền</h1>
            <p className="guest-date">20.01.2026</p>
            <p className="guest-label">Gửi lời mời tới</p>
            <h2>{guest.name}</h2>
            <p className="host-message">&quot;{guest.message}&quot;</p>
            <button className="primary-button" onClick={() => setOpened(true)}>
              Xem thiệp ngay
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
            <p>Wedding day</p>
            <h1>
              <span>Thanh Tuyến</span>
              <span>Ngọc Huyền</span>
            </h1>
            <div className="ampersand">and</div>
            <time>20.01.2026</time>
          </div>
        </section>

        <section className="paper save-date">
          <p className="monogram">
            T<span>H</span>
          </p>
          <h2>
            We&apos;ve been writing
            <br />
            our love story for years...
            <br />
            and the next chapter begins in
          </h2>
          <div className="save-title">
            <span>Save</span>
            <em>The</em>
            <span>Date</span>
          </div>
          <time>20.01.2026</time>
          <div className="stacked-photos">
            <div className="photo-frame back">
              <Img
                src={`${mediaBase}/804d434f-60ec-46e3-a93c-ca5c15757bd3.jpg`}
                alt="Wedding portrait"
              />
            </div>
            <div className="photo-frame front">
              <Img
                src={`${mediaBase}/3011a6f8-1cf9-46f4-a3cd-40add6ee83f6.jpg`}
                alt="Wedding portrait"
              />
            </div>
          </div>
        </section>

        <Img
          className="full-photo"
          src={`${mediaBase}/5b60485e-165f-4a95-a51f-94b0e7400144.jpg`}
          alt="Wedding couple"
        />

        <section className="paper info-section">
          <div className="parents">
            <div>
              <strong>Nhà Trai</strong>
              <p>Ông: Nguyễn Văn Thanh</p>
              <p>Bà: Vương Thị Sáu</p>
            </div>
            <div>
              <strong>Nhà gái</strong>
              <p>Ông: Nguyễn Duy Dũng</p>
              <p>Bà: Nguyễn Thị Ngọc</p>
            </div>
          </div>
          <p className="invite-line">
            Thân mời đến tham dự đám cưới
            <br />
            cùng gia đình chúng tôi!
          </p>
          <h2>
            Thanh Tuyến <span>and</span> Ngọc Huyền
          </h2>
          <div className="event-list">
            <EventCard
              title="Tiệc cưới nhà trai được tổ chức"
              venue="Tư gia nhà trai"
              address="Thôn Phú Lộc, Uy Lỗ, Đông Anh, Hà Nội"
            />
            <EventCard
              title="Tiệc cưới nhà gái được tổ chức"
              venue="Tư gia nhà gái"
              address="Thôn Phú Liễn, Hợp Tiến, Mỹ Đức, Hà Nội"
            />
          </div>
        </section>

        <section className="story">
          <Img
            src={`${mediaBase}/b1f0889d-1340-44e8-ae22-8c19c4fd21f7.jpg`}
            alt="Couple story"
          />
          <div>
            <p>
              Tình yêu của anh và em là hành trình được vun đắp bằng kiên
              nhẫn, thấu hiểu và niềm tin, nơi hai chúng ta chọn nắm tay nhau đi
              qua nắng mưa để chạm đến hôm nay.
            </p>
            <h2>The love story</h2>
          </div>
        </section>

        <section className="paper couple-section">
          <div className="person left">
            <p>Cô dâu</p>
            <h2>Ngọc Huyền</h2>
          </div>
          <div className="couple-grid">
            <Img
              src={`${mediaBase}/a84d4eca-a5fa-4178-aa21-085d3fda2874.jpg`}
              alt="Bride"
            />
            <Img
              src={`${mediaBase}/dbdbc6a3-58c7-4629-b6b8-eac7713c4bf5.jpg`}
              alt="Groom"
            />
          </div>
          <div className="person right">
            <p>Chú rể</p>
            <h2>Thanh Tuyến</h2>
          </div>
        </section>

        <Img
          className="full-photo"
          src={`${mediaBase}/4eff7aee-b9d2-452c-9e4e-2e46618c8993.jpg`}
          alt="Wedding couple formal portrait"
        />

        <section className="paper timeline-section">
          <h2>
            <span>Timeline of</span> Wedding
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
            <span>Album</span> of <span>Love</span>
          </h2>
          <div className="gallery">
            {photos.map((photo, index) => (
              <Img
                key={photo}
                src={`${mediaBase}/${photo}`}
                alt={`Wedding album ${index + 1}`}
              />
            ))}
          </div>
        </section>

        <section className="paper guestbook">
          <h2>Sổ lưu bút</h2>
          <p>
            Cảm ơn bạn rất nhiều vì đã gửi những lời chúc mừng tốt đẹp nhất đến
            đám cưới của chúng tôi!
          </p>
          <form
            onSubmit={(event) =>
              submitForm(event, "Lời chúc của bạn đã được ghi nhận.")
            }
          >
            <input placeholder="Nhập tên của bạn*" required />
            <textarea placeholder="Nhập lời chúc của bạn*" required />
            <div className="form-actions">
              <button type="submit">Gửi</button>
              <button type="button" onClick={() => setRsvpOpen(true)}>
                Xác nhận tham dự
              </button>
            </div>
          </form>
          <div className="countdown">
            <h3>Countdown</h3>
            <div>
              <span>{countdown.days}</span>:<span>{countdown.hours}</span>:
              <span>{countdown.minutes}</span>:<span>{countdown.seconds}</span>
            </div>
          </div>
        </section>

        <section className="thanks">
          <Img
            src={`${mediaBase}/1b2ea1c8-5b1a-4045-9d97-926d1ef3e4bb.jpg`}
            alt="Thank you"
          />
          <div>
            <h2>Thank you</h2>
            <p>
              Cảm ơn bạn đã dành tình cảm cho chúng mình! Sự hiện diện của bạn
              chính là món quà ý nghĩa nhất.
            </p>
          </div>
        </section>
      </div>

      <button
        className="floating-button rsvp-button"
        onClick={() => setRsvpOpen(true)}
        aria-label="Open RSVP"
      >
        ✓<span>RSVP</span>
      </button>
      <button
        className="floating-button gift-button"
        onClick={() => setGiftOpen(true)}
        aria-label="Open wedding gift"
      >
        ♡
      </button>
      <button className="audio-button" aria-label="Toggle music">
        ♪
      </button>

      {giftOpen && (
        <Modal title="Quà cưới" onClose={() => setGiftOpen(false)}>
          <div className="gift-grid">
            <Gift name="Chú rể Thanh Tuyến" type="groom" />
            <Gift name="Cô dâu Ngọc Huyền" type="bride" />
          </div>
        </Modal>
      )}

      {rsvpOpen && (
        <Modal title="[RSVP] Xác nhận tham dự" onClose={() => setRsvpOpen(false)}>
          <form
            className="rsvp-form"
            onSubmit={(event) =>
              submitForm(event, "Phản hồi RSVP của bạn đã được ghi nhận.")
            }
          >
            <p>
              Khách mời: <strong>{guest.name}</strong>
            </p>
            <label>
              <input
                name="attendance"
                type="radio"
                value="yes"
                required
                onChange={(event) => setAttendance(event.target.value)}
              />
              Có, tôi sẽ tham dự
            </label>
            <label>
              <input
                name="attendance"
                type="radio"
                value="no"
                required
                onChange={(event) => setAttendance(event.target.value)}
              />
              Không, tôi không tham dự được
            </label>
            {attendance === "yes" && (
              <select defaultValue="0" aria-label="Accompany count">
                <option value="0">Tôi sẽ đến một mình</option>
                <option value="1">Tôi và 1 người nữa</option>
                <option value="2">Tôi và 2 người nữa</option>
                <option value="3">Tôi và 3 người nữa</option>
              </select>
            )}
            <textarea placeholder="Lời nhắn gửi đến cô dâu chú rể" />
            <button type="submit">Gửi xác nhận</button>
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
