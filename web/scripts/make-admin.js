/**
 * Usage : node scripts/make-admin.js email@exemple.com
 * Promeut un utilisateur existant au rôle ADMIN (accès à /admin).
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: node scripts/make-admin.js email@exemple.com");
    process.exit(1);
  }

  const user = await prisma.user.update({
    where: { email: email.toLowerCase().trim() },
    data: { role: "ADMIN" },
  });

  console.log(`${user.email} est maintenant ADMIN.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
