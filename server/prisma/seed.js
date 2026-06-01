import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@SOS2024', 12);
  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@sosdigital.cm' },
    update: { role: 'admin' },
    create: {
      name: process.env.ADMIN_NAME || 'Administrateur SOS',
      email: process.env.ADMIN_EMAIL || 'admin@sosdigital.cm',
      password: hashedPassword,
      role: 'admin',
      canViewData: true,
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // Create sample clients
  const clients = await Promise.all([
    prisma.client.upsert({
      where: { id: 'client-1' },
      update: {},
      create: {
        id: 'client-1',
        name: 'Jean-Baptiste Mbarga',
        company: 'Mbarga & Associés',
        email: 'jb.mbarga@example.cm',
        phone: '+237 6 90 12 34 56',
        address: '12 Avenue de l\'Indépendance',
        city: 'Yaoundé',
        status: 'vip',
      },
    }),
    prisma.client.upsert({
      where: { id: 'client-2' },
      update: {},
      create: {
        id: 'client-2',
        name: 'Amina Fouda',
        company: 'Tech Cameroun SARL',
        email: 'a.fouda@techcm.com',
        phone: '+237 6 78 90 12 34',
        address: 'Rue Joss, Akwa',
        city: 'Douala',
        status: 'active',
      },
    }),
    prisma.client.upsert({
      where: { id: 'client-3' },
      update: {},
      create: {
        id: 'client-3',
        name: 'Pierre Ngono',
        company: 'Ngono Trading',
        email: 'p.ngono@example.cm',
        phone: '+237 6 55 44 33 22',
        city: 'Douala',
        status: 'active',
      },
    }),
  ]);
  console.log(`✅ ${clients.length} clients created`);

  // Create catalog items
  const catalog = await Promise.all([
    prisma.catalogItem.upsert({
      where: { id: 'cat-1' },
      update: {},
      create: { id: 'cat-1', name: 'Création de site web', description: 'Site vitrine 5 pages', unitPrice: 150000, currency: 'FCFA', category: 'Développement Web' },
    }),
    prisma.catalogItem.upsert({
      where: { id: 'cat-2' },
      update: {},
      create: { id: 'cat-2', name: 'Maintenance mensuelle', description: 'Maintenance et mises à jour', unitPrice: 25000, currency: 'FCFA', category: 'Maintenance' },
    }),
    prisma.catalogItem.upsert({
      where: { id: 'cat-3' },
      update: {},
      create: { id: 'cat-3', name: 'Design graphique', description: 'Charte graphique complète', unitPrice: 75000, currency: 'FCFA', category: 'Design' },
    }),
    prisma.catalogItem.upsert({
      where: { id: 'cat-4' },
      update: {},
      create: { id: 'cat-4', name: 'Formation digitale', description: 'Formation 1 jour (6h)', unitPrice: 50000, currency: 'FCFA', category: 'Formation' },
    }),
    prisma.catalogItem.upsert({
      where: { id: 'cat-5' },
      update: {},
      create: { id: 'cat-5', name: 'Gestion réseaux sociaux', description: 'Community management mensuel', unitPrice: 40000, currency: 'FCFA', category: 'Marketing' },
    }),
  ]);
  console.log(`✅ ${catalog.length} catalog items created`);

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
