import { hashPassword } from "../lib/password";
import { prisma } from "../lib/prisma";

async function main() {
  const email = process.env.SEED_BIENESTAR_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_BIENESTAR_PASSWORD?.trim();
  const name = process.env.SEED_BIENESTAR_NAME?.trim() || "Equipo de Permanencia";
  if (!email || !password || password.length < 10) {
    throw new Error("Define SEED_BIENESTAR_EMAIL y SEED_BIENESTAR_PASSWORD de al menos 10 caracteres.");
  }
  const passwordHash = await hashPassword(password);
  await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role: "BIENESTAR", active: true, mustChangePassword: false },
    create: {
      email,
      name,
      passwordHash,
      role: "BIENESTAR",
      mustChangePassword: false,
    },
  });
  console.log(`Bienestar listo: ${email}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
