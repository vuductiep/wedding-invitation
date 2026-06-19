import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const initialGuests = [
  {
    slug: "phuong-mai",
    name: "Phương Mai",
    message: "Mời chị đến chung vui cùng gia đình trong ngày cưới của chúng em.",
  },
  {
    slug: "phuong-anh",
    name: "Phương Anh",
    message: "Mời chị và người thương đến tham dự đám cưới chung vui cùng gia đình em nhé ^^",
  },
  {
    slug: "minh-duc",
    name: "Minh Đức",
    message: "Mời anh đến chung vui cùng gia đình trong ngày cưới của chúng em.",
  },
];

async function main() {
  console.log("Seeding database...");
  for (const guest of initialGuests) {
    const upserted = await prisma.guest.upsert({
      where: { slug: guest.slug },
      update: {},
      create: {
        slug: guest.slug,
        name: guest.name,
        message: guest.message,
      },
    });
    console.log(`Upserted guest: ${upserted.name} (${upserted.slug})`);
  }
  console.log("Seeding completed successfully.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
