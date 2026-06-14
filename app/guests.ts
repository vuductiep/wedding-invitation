import type { GuestInvite } from "./wedding-invite";

export const guests: Record<string, GuestInvite> = {
  "phuong-anh": {
    slug: "phuong-anh",
    name: "Phương Anh",
    message:
      "Mời chị và người thương đến tham dự đám cưới chung vui cùng gia đình em nhé ^^",
  },
  "minh-duc": {
    slug: "minh-duc",
    name: "Minh Đức",
    message:
      "Mời anh đến chung vui cùng gia đình trong ngày cưới của chúng em.",
  },
};

export function getGuest(slug: string) {
  return guests[slug];
}
