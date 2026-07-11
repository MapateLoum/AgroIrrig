/**
 * Crée (ou met à jour) un compte ADMIN directement en base, mot de passe
 * correctement haché — pas besoin de passer par /register.
 *
 * Usage :
 *   node scripts/create-admin.js "Nom Complet" email@exemple.com MotDePasse123
 *
 * Si l'email existe déjà, le script met juste à jour son mot de passe et son
 * rôle (pratique pour réinitialiser un admin après déploiement).
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  const [name, email, password] = process.argv.slice(2);

  if (!name || !email || !password) {
    console.error('Usage: node scripts/create-admin.js "Nom Complet" email@exemple.com MotDePasse123');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error("Le mot de passe doit contenir au moins 6 caractères.");
    process.exit(1);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const hashedPassword = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  let user;
  if (existing) {
    user = await prisma.user.update({
      where: { email: normalizedEmail },
      data: { password: hashedPassword, role: "ADMIN", name: name.trim(), emailVerified: true },
    });
    console.log(`Compte existant mis à jour : ${user.email} est maintenant ADMIN (mot de passe réinitialisé).`);
  } else {
    user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: "ADMIN",
        emailVerified: true,
      },
    });
    console.log(`Compte créé : ${user.email} (ADMIN).`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
