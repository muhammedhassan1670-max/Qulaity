import { readFileSync } from 'fs';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../src/generated/client';

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

  await prisma.capaAction.deleteMany({
    where: { capaNumber: { in: ['CAPA-2024-0045'] } },
  });
  await prisma.eightD.deleteMany({
    where: { dNumber: { in: ['8D-2024-0012'] } },
  });
  await prisma.audit.deleteMany({
    where: { auditNumber: { in: ['AUD-2024-0089'] } },
  });
  await prisma.ncrReport.deleteMany({
    where: { ncrNumber: { in: ['NCR-2024-0018'] } },
  });
  await prisma.supplier.deleteMany({
    where: { code: { in: ['SUP-001'] } },
  });

  const demoDepartments = await prisma.department.findMany({
    where: { code: 'QA-01', name: 'Quality Assurance' },
    select: { id: true },
  });

  for (const department of demoDepartments) {
    const linkedRecords = await Promise.all([
      prisma.user.count({ where: { departmentId: department.id } }),
      prisma.ncrReport.count({ where: { departmentId: department.id } }),
      prisma.capaAction.count({ where: { departmentId: department.id } }),
      prisma.audit.count({ where: { departmentId: department.id } }),
      prisma.auditFinding.count({ where: { departmentId: department.id } }),
      prisma.fmea.count({ where: { departmentId: department.id } }),
      prisma.eightD.count({ where: { departmentId: department.id } }),
      prisma.complaint.count({ where: { departmentId: department.id } }),
    ]);

    if (linkedRecords.every((count) => count === 0)) {
      await prisma.department.delete({ where: { id: department.id } });
    }
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
