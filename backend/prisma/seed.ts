import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create default tenant
  const tenant = await prisma.tenant.upsert({
    where: { code: 'DEFAULT' },
    update: {},
    create: {
      name: 'Default Company',
      code: 'DEFAULT',
      status: 'active',
      settings: {},
    },
  });
  console.log('✅ Tenant created:', tenant.name);

  // 2. Create default plant
  const plant = await prisma.plant.upsert({
    where: { 
      tenantId_code: { tenantId: tenant.id, code: 'PLANT01' }
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Main Plant',
      code: 'PLANT01',
      location: 'Main Location',
      timezone: 'UTC',
    },
  });
  console.log('✅ Plant created:', plant.name);

  // 3. Create admin role
  const adminRole = await prisma.role.upsert({
    where: {
      tenantId_name: { tenantId: tenant.id, name: 'Admin' }
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Admin',
      description: 'System Administrator',
      isSystem: true,
      permissions: ['all'],
    },
  });
  console.log('✅ Role created:', adminRole.name);

  // 4. Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      plantId: plant.id,
      email: 'admin@qms.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      status: 'active',
      createdById: 'system',
      userRoles: {
        create: {
          roleId: adminRole.id,
        },
      },
    },
  });
  console.log('✅ Admin user created:', adminUser.email);

  // Update user to set createdById to itself
  await prisma.user.update({
    where: { id: adminUser.id },
    data: { createdById: adminUser.id },
  });

  // 5. Create sample NCR record
  const ncr = await prisma.nCR.create({
    data: {
      tenantId: tenant.id,
      plantId: plant.id,
      ncrNumber: 'NCR-2024-001',
      title: 'Sample Non-Conformance Report',
      description: 'This is a sample NCR for testing purposes',
      category: 'product',
      severity: 'major',
      status: 'open',
      detectedDate: new Date(),
      reportedById: adminUser.id,
      attachments: [],
    },
  });
  console.log('✅ Sample NCR created:', ncr.ncrNumber);

  // 6. Create sample CAPA record
  const capa = await prisma.cAPA.create({
    data: {
      tenantId: tenant.id,
      plantId: plant.id,
      capaNumber: 'CAPA-2024-001',
      title: 'Sample CAPA',
      description: 'This is a sample CAPA for testing purposes',
      type: 'corrective',
      source: 'ncr',
      sourceId: ncr.id,
      priority: 'high',
      status: 'open',
      createdById: adminUser.id,
      attachments: [],
    },
  });
  console.log('✅ Sample CAPA created:', capa.capaNumber);

  console.log('\n🎉 Database seeded successfully!');
  console.log('\nLogin credentials:');
  console.log('  Email: admin@qms.com');
  console.log('  Password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
