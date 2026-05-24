import { readFileSync } from 'fs';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../src/generated/client';
import * as bcrypt from 'bcryptjs';

function loadEnvFile(filePath: string) {
  try {
    const raw = readFileSync(filePath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // ignore
  }
}

async function main() {
  loadEnvFile('env.local');
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set (env.local)');
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const plant = await prisma.plant.upsert({
    where: { code: 'PLANT-01' },
    update: {},
    create: {
      code: 'PLANT-01',
      name: 'Main Plant',
      location: 'Factory',
      isActive: true,
      metadata: {},
    },
  });

  const permissions = [
    { code: 'admin.access', name: 'Admin Access', description: 'Full admin access' },
    { code: 'dashboard.view', name: 'View Dashboard', description: 'View dashboards' },
    { code: 'quality.manage', name: 'Manage Quality', description: 'Manage quality records' },
    { code: 'files.upload', name: 'Upload Files', description: 'Upload attachments/files' },
    { code: 'reports.view', name: 'View Reports', description: 'Access reports' },
    { code: 'users.manage', name: 'Manage Users', description: 'Create/update users' },
    { code: 'roles.manage', name: 'Manage Roles', description: 'Create/update roles' },
  ];

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: {
        name: p.name,
        description: p.description,
      },
      create: p,
    });
  }

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: { description: 'System Administrator' },
    create: { name: 'admin', description: 'System Administrator' },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: 'manager' },
    update: { description: 'Quality Manager' },
    create: { name: 'manager', description: 'Quality Manager' },
  });

  const operatorRole = await prisma.role.upsert({
    where: { name: 'operator' },
    update: { description: 'Production Operator' },
    create: { name: 'operator', description: 'Production Operator' },
  });

  const permRecords = await prisma.permission.findMany({
    where: { code: { in: permissions.map((x) => x.code) } },
    select: { id: true, code: true },
  });

  const permIdByCode = new Map(permRecords.map((p) => [p.code, p.id] as const));

  async function grantAll(roleId: string) {
    for (const code of permissions.map((x) => x.code)) {
      const permissionId = permIdByCode.get(code);
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId, permissionId },
        },
        update: {},
        create: { roleId, permissionId },
      });
    }
  }

  async function grantSome(roleId: string, codes: string[]) {
    for (const code of codes) {
      const permissionId = permIdByCode.get(code);
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId, permissionId },
        },
        update: {},
        create: { roleId, permissionId },
      });
    }
  }

  await grantAll(adminRole.id);
  await grantSome(managerRole.id, [
    'dashboard.view',
    'quality.manage',
    'files.upload',
    'reports.view',
  ]);
  await grantSome(operatorRole.id, ['dashboard.view', 'quality.manage', 'files.upload']);

  const isProduction = process.env.NODE_ENV === 'production';
  const adminEmail = (process.env.ADMIN_EMAIL ?? 'admin@qms.com').trim().toLowerCase();
  const adminName = (process.env.ADMIN_NAME ?? 'System Administrator').trim();
  const adminPassword = process.env.ADMIN_PASSWORD ?? (isProduction ? '' : 'admin123');

  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD is required when running seed in production');
  }

  if (isProduction && adminPassword.length < 12) {
    throw new Error('ADMIN_PASSWORD must be at least 12 characters in production');
  }

  const [adminFirstName = 'System', ...adminLastNameParts] = adminName.split(/\s+/).filter(Boolean);
  const adminLastName = adminLastNameParts.join(' ') || 'Administrator';
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      firstName: adminFirstName,
      lastName: adminLastName,
      roleId: adminRole.id,
      plantId: plant.id,
      passwordHash: adminPasswordHash,
      status: 'active',
    },
    create: {
      name: adminName,
      firstName: adminFirstName,
      lastName: adminLastName,
      email: adminEmail,
      passwordHash: adminPasswordHash,
      status: 'active',
      roleId: adminRole.id,
      plantId: plant.id,
      twoFactorEnabled: false,
    },
  });

  // Keep seed intentionally minimal: bootstrap plant, roles, permissions, and admin only.

  await prisma.$disconnect();
  await pool.end();
}

main().catch(async (e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
