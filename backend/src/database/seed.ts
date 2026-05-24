import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clean existing data (in reverse order of dependencies)
  console.log('Cleaning existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.report.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.workflowHistory.deleteMany();
  await prisma.workflowInstance.deleteMany();
  await prisma.workflowStep.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.machineDataPoint.deleteMany();
  await prisma.ioTDevice.deleteMany();
  await prisma.machine.deleteMany();
  await prisma.sPCRuleViolation.deleteMany();
  await prisma.sPCDataPoint.deleteMany();
  await prisma.sPCRecord.deleteMany();
  await prisma.auditFinding.deleteMany();
  await prisma.audit.deleteMany();
  await prisma.fMEAItem.deleteMany();
  await prisma.fMEA.deleteMany();
  await prisma.eightD.deleteMany();
  await prisma.cAPAAction.deleteMany();
  await prisma.cAPA.deleteMany();
  await prisma.nCRApproval.deleteMany();
  await prisma.nCRComment.deleteMany();
  await prisma.nCR.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.plant.deleteMany();
  await prisma.tenant.deleteMany();
  console.log('✅ Data cleaned\n');

  // Create Default Tenant
  console.log('Creating default tenant...');
  const tenant = await prisma.tenant.create({
    data: {
      name: 'QMS Enterprise Demo',
      code: 'DEMO',
      status: 'active',
      settings: {
        timezone: 'UTC',
        dateFormat: 'YYYY-MM-DD',
        language: 'en',
        features: {
          ncr: true,
          capa: true,
          eightD: true,
          fmea: true,
          audit: true,
          spc: true,
          iot: true,
          digitalTwin: true,
          ai: true,
        },
      },
    },
  });
  console.log(`✅ Created tenant: ${tenant.name} (${tenant.code})\n`);

  // Create Plants
  console.log('Creating plants...');
  const plantA = await prisma.plant.create({
    data: {
      tenantId: tenant.id,
      name: 'Plant A - Main Facility',
      code: 'PLANT-A',
      location: 'Riyadh, Saudi Arabia',
      timezone: 'Asia/Riyadh',
      status: 'active',
      settings: {
        shiftStart: '06:00',
        shiftEnd: '14:00',
        oeeTarget: 85,
        qualityTarget: 95,
      },
    },
  });

  const plantB = await prisma.plant.create({
    data: {
      tenantId: tenant.id,
      name: 'Plant B - Assembly Line',
      code: 'PLANT-B',
      location: 'Jeddah, Saudi Arabia',
      timezone: 'Asia/Riyadh',
      status: 'active',
      settings: {
        shiftStart: '07:00',
        shiftEnd: '15:00',
        oeeTarget: 80,
        qualityTarget: 92,
      },
    },
  });

  const plantC = await prisma.plant.create({
    data: {
      tenantId: tenant.id,
      name: 'Plant C - Quality Center',
      code: 'PLANT-C',
      location: 'Dammam, Saudi Arabia',
      timezone: 'Asia/Riyadh',
      status: 'active',
      settings: {
        shiftStart: '08:00',
        shiftEnd: '16:00',
        oeeTarget: 82,
        qualityTarget: 98,
      },
    },
  });
  console.log(`✅ Created ${3} plants\n`);

  // Create Departments
  console.log('Creating departments...');
  const departments = await Promise.all([
    prisma.department.create({
      data: { plantId: plantA.id, name: 'Quality Assurance', code: 'QA', description: 'Quality control and assurance' },
    }),
    prisma.department.create({
      data: { plantId: plantA.id, name: 'Production', code: 'PROD', description: 'Manufacturing operations' },
    }),
    prisma.department.create({
      data: { plantId: plantA.id, name: 'Engineering', code: 'ENG', description: 'Process engineering' },
    }),
    prisma.department.create({
      data: { plantId: plantA.id, name: 'Maintenance', code: 'MAINT', description: 'Equipment maintenance' },
    }),
    prisma.department.create({
      data: { plantId: plantB.id, name: 'Assembly', code: 'ASM', description: 'Product assembly' },
    }),
    prisma.department.create({
      data: { plantId: plantC.id, name: 'Testing Lab', code: 'LAB', description: 'Quality testing laboratory' },
    }),
  ]);
  console.log(`✅ Created ${departments.length} departments\n`);

  // Create Roles
  console.log('Creating roles...');
  const roles = await Promise.all([
    prisma.role.create({
      data: {
        tenantId: tenant.id,
        name: 'Quality Director',
        description: 'Full system access and administration',
        isSystem: true,
        permissions: [
          'dashboard.view',
          'quality.manage',
          'builder.use',
          'ai.access',
          'digital-twin.view',
          'production-layout.create',
          'production-layout.update',
          'production-layout.delete',
          'spc.analyze',
          'iot.manage',
          'executive.view',
          'admin.access',
          'users.manage',
          'plants.manage',
          'reports.view',
          'settings.manage',
        ],
      },
    }),
    prisma.role.create({
      data: {
        tenantId: tenant.id,
        name: 'Quality Manager',
        description: 'Manage quality processes and teams',
        isSystem: true,
        permissions: [
          'dashboard.view',
          'quality.manage',
          'builder.use',
          'ai.access',
          'digital-twin.view',
          'production-layout.create',
          'production-layout.update',
          'production-layout.delete',
          'spc.analyze',
          'iot.view',
          'reports.view',
          'users.view',
        ],
      },
    }),
    prisma.role.create({
      data: {
        tenantId: tenant.id,
        name: 'Quality Engineer',
        description: 'Execute quality processes',
        isSystem: true,
        permissions: [
          'dashboard.view',
          'quality.view',
          'quality.create',
          'quality.edit',
          'spc.view',
          'iot.view',
          'reports.view',
        ],
      },
    }),
    prisma.role.create({
      data: {
        tenantId: tenant.id,
        name: 'Operator',
        description: 'Basic quality operations',
        isSystem: true,
        permissions: [
          'dashboard.view',
          'quality.view',
          'quality.create',
          'spc.view',
          'production-layout.create',
          'production-layout.update',
          'production-layout.delete',
        ],
      },
    }),
    prisma.role.create({
      data: {
        tenantId: tenant.id,
        name: 'Auditor',
        description: 'Audit management access',
        isSystem: true,
        permissions: [
          'dashboard.view',
          'audit.view',
          'audit.create',
          'audit.edit',
          'quality.view',
        ],
      },
    }),
  ]);
  console.log(`✅ Created ${roles.length} roles\n`);

  // Create Admin User
  console.log('Creating admin user...');
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      plantId: plantA.id,
      departmentId: departments[0].id,
      email: 'admin@qms-enterprise.com',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      phone: '+966-50-000-0001',
      status: 'active',
      emailVerified: true,
      createdById: 'seed',
      updatedById: 'seed',
    },
  });

  // Assign Quality Director role to admin
  await prisma.userRole.create({
    data: {
      userId: admin.id,
      roleId: roles[0].id,
    },
  });
  console.log(`✅ Created admin user: ${admin.email} / password: admin123\n`);

  // Create sample users
  console.log('Creating sample users...');
  const usersData = [
    { firstName: 'Ahmed', lastName: 'Al-Rashid', email: 'ahmed.rashid@qms-enterprise.com', roleIdx: 0, plantId: plantA.id, deptId: departments[0].id },
    { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.johnson@qms-enterprise.com', roleIdx: 1, plantId: plantA.id, deptId: departments[0].id },
    { firstName: 'Mohammed', lastName: 'Khan', email: 'mohammed.khan@qms-enterprise.com', roleIdx: 2, plantId: plantA.id, deptId: departments[2].id },
    { firstName: 'Fatima', lastName: 'Al-Saud', email: 'fatima.alsaud@qms-enterprise.com', roleIdx: 2, plantId: plantB.id, deptId: departments[4].id },
    { firstName: 'John', lastName: 'Smith', email: 'john.smith@qms-enterprise.com', roleIdx: 3, plantId: plantA.id, deptId: departments[1].id },
    { firstName: 'Lisa', lastName: 'Chen', email: 'lisa.chen@qms-enterprise.com', roleIdx: 4, plantId: plantC.id, deptId: departments[5].id },
  ];

  for (const userData of usersData) {
    const password = await bcrypt.hash('password123', 12);
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        plantId: userData.plantId,
        departmentId: userData.deptId,
        email: userData.email,
        password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        status: 'active',
        emailVerified: true,
        createdById: admin.id,
        updatedById: admin.id,
      },
    });

    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: roles[userData.roleIdx].id,
      },
    });
  }
  console.log(`✅ Created ${usersData.length} sample users (password: password123)\n`);

  // Create Machines
  console.log('Creating machines...');
  const machines = await Promise.all([
    prisma.machine.create({
      data: {
        plantId: plantA.id,
        machineCode: 'MCH-001',
        name: 'CNC Lathe Line 1',
        type: 'CNC',
        model: 'DMG Mori NLX 2500',
        serialNumber: 'SN123456',
        manufacturer: 'DMG Mori',
        status: 'active',
        location: 'Line 1, Bay A',
        specifications: { maxRPM: 6000, power: '15kW', axis: 3 },
      },
    }),
    prisma.machine.create({
      data: {
        plantId: plantA.id,
        machineCode: 'MCH-002',
        name: 'CNC Mill Line 2',
        type: 'CNC',
        model: 'Haas VF-2',
        serialNumber: 'SN789012',
        manufacturer: 'Haas Automation',
        status: 'active',
        location: 'Line 2, Bay B',
        specifications: { maxRPM: 8100, power: '22kW', axis: 3 },
      },
    }),
    prisma.machine.create({
      data: {
        plantId: plantB.id,
        machineCode: 'MCH-003',
        name: 'Assembly Robot A',
        type: 'Robot',
        model: 'KUKA KR QUANTEC',
        serialNumber: 'SN345678',
        manufacturer: 'KUKA',
        status: 'active',
        location: 'Assembly Line A',
        specifications: { payload: '300kg', reach: '3100mm', axes: 6 },
      },
    }),
  ]);
  console.log(`✅ Created ${machines.length} machines\n`);

  // Create IoT Devices
  console.log('Creating IoT devices...');
  const iotDevices = await Promise.all([
    prisma.ioTDevice.create({
      data: {
        tenantId: tenant.id,
        plantId: plantA.id,
        machineId: machines[0].id,
        deviceCode: 'IOT-TEMP-001',
        name: 'Temperature Sensor Line 1',
        type: 'temperature',
        mqttTopic: 'plant-a/line1/temperature',
        status: 'online',
        unit: '°C',
        thresholds: { min: 18, max: 35, critical: 45 },
        lastReadingValue: 24.5,
        lastReadingAt: new Date(),
      },
    }),
    prisma.ioTDevice.create({
      data: {
        tenantId: tenant.id,
        plantId: plantA.id,
        machineId: machines[0].id,
        deviceCode: 'IOT-VIB-001',
        name: 'Vibration Sensor Line 1',
        type: 'vibration',
        mqttTopic: 'plant-a/line1/vibration',
        status: 'online',
        unit: 'mm/s',
        thresholds: { min: 0, max: 4.5, critical: 7.1 },
        lastReadingValue: 2.3,
        lastReadingAt: new Date(),
      },
    }),
    prisma.ioTDevice.create({
      data: {
        tenantId: tenant.id,
        plantId: plantA.id,
        machineId: machines[1].id,
        deviceCode: 'IOT-PRES-001',
        name: 'Pressure Sensor Line 2',
        type: 'pressure',
        mqttTopic: 'plant-a/line2/pressure',
        status: 'online',
        unit: 'bar',
        thresholds: { min: 5, max: 8, critical: 10 },
        lastReadingValue: 6.8,
        lastReadingAt: new Date(),
      },
    }),
    prisma.ioTDevice.create({
      data: {
        tenantId: tenant.id,
        plantId: plantB.id,
        machineId: machines[2].id,
        deviceCode: 'IOT-POW-001',
        name: 'Power Monitor Robot A',
        type: 'power',
        mqttTopic: 'plant-b/robot-a/power',
        status: 'warning',
        unit: 'kW',
        thresholds: { min: 5, max: 15, critical: 20 },
        lastReadingValue: 16.2,
        lastReadingAt: new Date(),
      },
    }),
  ]);
  console.log(`✅ Created ${iotDevices.length} IoT devices\n`);

  // Create SPC Records
  console.log('Creating SPC records...');
  const spcRecords = await Promise.all([
    prisma.sPCRecord.create({
      data: {
        tenantId: tenant.id,
        chartType: 'xbar',
        characteristic: 'Part Diameter',
        partNumber: 'PRT-001',
        processName: 'Turning Operation',
        machineId: machines[0].id,
        sampleSize: 5,
        sampleFrequency: 'hourly',
        ucl: 25.05,
        lcl: 24.95,
        centerLine: 25.0,
        usl: 25.1,
        lsl: 24.9,
        cp: 1.33,
        cpk: 1.25,
        status: 'active',
      },
    }),
    prisma.sPCRecord.create({
      data: {
        tenantId: tenant.id,
        chartType: 'r',
        characteristic: 'Surface Roughness',
        partNumber: 'PRT-002',
        processName: 'Milling Operation',
        machineId: machines[1].id,
        sampleSize: 5,
        sampleFrequency: 'every_2_hours',
        ucl: 0.08,
        lcl: 0,
        centerLine: 0.04,
        usl: 0.1,
        lsl: 0,
        cp: 1.5,
        cpk: 1.4,
        status: 'active',
      },
    }),
  ]);
  console.log(`✅ Created ${spcRecords.length} SPC records\n`);

  // Create SPC Data Points
  console.log('Creating SPC data points...');
  const now = new Date();
  for (let i = 0; i < 30; i++) {
    const timestamp = new Date(now.getTime() - (29 - i) * 60 * 60 * 1000);
    const value = 25.0 + (Math.random() - 0.5) * 0.08;
    await prisma.sPCDataPoint.create({
      data: {
        spcRecordId: spcRecords[0].id,
        sampleNumber: `S${String(i + 1).padStart(3, '0')}`,
        sampleDate: timestamp,
        value,
        values: JSON.stringify([value - 0.01, value + 0.005, value - 0.003, value + 0.008, value - 0.002]),
        isOutOfControl: value > 25.05 || value < 24.95,
      },
    });
  }
  console.log(`✅ Created 30 SPC data points\n`);

  // Create NCR Records
  console.log('Creating NCR records...');
  const ncrRecords = await Promise.all([
    prisma.nCR.create({
      data: {
        tenantId: tenant.id,
        plantId: plantA.id,
        ncrNumber: 'NCR-2024-0018',
        title: 'Dimensional deviation in Line 3',
        description: 'Part diameter exceeded upper specification limit during routine inspection. Root cause investigation required.',
        category: 'product',
        severity: 'major',
        status: 'open',
        detectedDate: new Date('2024-02-28'),
        reportedById: admin.id,
        assignedToId: admin.id,
        department: 'Production',
        productCode: 'PRT-001',
        lotNumber: 'LOT-2024-0345',
        quantityAffected: 150,
        attachments: [],
      },
    }),
    prisma.nCR.create({
      data: {
        tenantId: tenant.id,
        plantId: plantA.id,
        ncrNumber: 'NCR-2024-0017',
        title: 'Surface finish defect on housing',
        description: 'Scratches observed on housing surface affecting aesthetic quality.',
        category: 'product',
        severity: 'minor',
        status: 'in_review',
        detectedDate: new Date('2024-02-25'),
        reportedById: admin.id,
        assignedToId: admin.id,
        department: 'Quality Assurance',
        productCode: 'PRT-002',
        lotNumber: 'LOT-2024-0340',
        quantityAffected: 25,
        attachments: [],
      },
    }),
    prisma.nCR.create({
      data: {
        tenantId: tenant.id,
        plantId: plantB.id,
        ncrNumber: 'NCR-2024-0016',
        title: 'Assembly torque out of specification',
        description: 'Torque values on critical fasteners below minimum requirement.',
        category: 'process',
        severity: 'critical',
        status: 'pending_capa',
        detectedDate: new Date('2024-02-20'),
        reportedById: admin.id,
        assignedToId: admin.id,
        department: 'Assembly',
        productCode: 'PRT-003',
        lotNumber: 'LOT-2024-0330',
        quantityAffected: 500,
        attachments: [],
      },
    }),
  ]);
  console.log(`✅ Created ${ncrRecords.length} NCR records\n`);

  // Create CAPA Records
  console.log('Creating CAPA records...');
  const capaRecords = await Promise.all([
    prisma.cAPA.create({
      data: {
        tenantId: tenant.id,
        plantId: plantA.id,
        capaNumber: 'CAPA-2024-0045',
        title: 'Prevent dimensional deviation recurrence',
        description: 'Implement improved process controls to prevent dimensional deviations in turning operation.',
        type: 'corrective',
        source: 'ncr',
        sourceId: ncrRecords[0].id,
        priority: 'high',
        status: 'in_progress',
        assignedToId: admin.id,
        dueDate: new Date('2024-03-15'),
        attachments: [],
        createdById: admin.id,
        updatedById: admin.id,
      },
    }),
    prisma.cAPA.create({
      data: {
        tenantId: tenant.id,
        plantId: plantB.id,
        capaNumber: 'CAPA-2024-0044',
        title: 'Torque tool calibration improvement',
        description: 'Establish regular calibration schedule for torque tools.',
        type: 'corrective',
        source: 'ncr',
        sourceId: ncrRecords[2].id,
        priority: 'critical',
        status: 'open',
        assignedToId: admin.id,
        dueDate: new Date('2024-03-10'),
        attachments: [],
        createdById: admin.id,
        updatedById: admin.id,
      },
    }),
    prisma.cAPA.create({
      data: {
        tenantId: tenant.id,
        plantId: plantA.id,
        capaNumber: 'CAPA-2024-0042',
        title: 'Operator training enhancement',
        description: 'Enhanced training program for handling procedures.',
        type: 'preventive',
        source: 'audit',
        priority: 'medium',
        status: 'closed',
        assignedToId: admin.id,
        dueDate: new Date('2024-02-01'),
        completedDate: new Date('2024-01-28'),
        effectiveness: 'effective',
        verifiedById: admin.id,
        verifiedAt: new Date('2024-02-05'),
        verificationNotes: 'Training completed successfully. Post-training assessment shows 95% compliance.',
        attachments: [],
        createdById: admin.id,
        updatedById: admin.id,
      },
    }),
  ]);
  console.log(`✅ Created ${capaRecords.length} CAPA records\n`);

  // Create 8D Records
  console.log('Creating 8D records...');
  const eightDRecords = await Promise.all([
    prisma.eightD.create({
      data: {
        tenantId: tenant.id,
        dNumber: '8D-2024-0012',
        title: 'Customer complaint resolution - Part PRT-001',
        customerName: 'ABC Manufacturing',
        customerRef: 'CC-2024-0089',
        currentStep: 5,
        status: 'in_progress',
        teamMembers: JSON.stringify([
          { name: 'Ahmed Al-Rashid', role: 'Team Lead' },
          { name: 'Sarah Johnson', role: 'Quality Engineer' },
          { name: 'Mohammed Khan', role: 'Process Engineer' },
        ]),
        problemDescription: 'Customer reported dimensional variation in delivered parts affecting their assembly process.',
        what: 'Dimensional variation exceeding specification',
        where: 'Part PRT-001, Lot LOT-2024-0345',
        when: 'February 2024',
        who: 'ABC Manufacturing',
        why: 'Process variation in turning operation',
        how: 'Detected during customer incoming inspection',
        howMany: 150,
        containmentActions: 'Quarantined remaining inventory. Implemented 100% inspection for subsequent lots.',
        containmentDate: new Date('2024-02-28'),
        rootCause: 'Tool wear compensation not triggered automatically.',
        correctiveActions: 'Implement automatic tool wear compensation and SPC monitoring.',
        preventiveActions: 'Add predictive maintenance alerts for tool life.',
        lessonsLearned: 'Early detection through SPC can prevent customer complaints.',
      },
    }),
  ]);
  console.log(`✅ Created ${eightDRecords.length} 8D records\n`);

  // Create FMEA Records
  console.log('Creating FMEA records...');
  const fmeaRecords = await Promise.all([
    prisma.fMEA.create({
      data: {
        tenantId: tenant.id,
        fmeaNumber: 'FMEA-2024-001',
        title: 'Turning Process FMEA',
        type: 'process',
        revision: 1,
        status: 'active',
        processName: 'CNC Turning Operation',
        teamMembers: JSON.stringify([
          { name: 'Ahmed Al-Rashid', role: 'Quality Manager' },
          { name: 'Mohammed Khan', role: 'Process Engineer' },
        ]),
      },
    }),
  ]);

  // Create FMEA Items
  await Promise.all([
    prisma.fMEAItem.create({
      data: {
        fmeaId: fmeaRecords[0].id,
        stepNumber: 1,
        function: 'Maintain part diameter within specification',
        failureMode: 'Dimensional variation',
        failureEffect: 'Assembly issues at customer',
        severity: 8,
        cause: 'Tool wear',
        occurrence: 4,
        currentControls: 'SPC monitoring',
        detection: 3,
        rpn: 96,
        recommendedAction: 'Implement automatic tool compensation',
        responsibility: 'Process Engineering',
        targetDate: new Date('2024-03-15'),
      },
    }),
    prisma.fMEAItem.create({
      data: {
        fmeaId: fmeaRecords[0].id,
        stepNumber: 2,
        function: 'Achieve required surface finish',
        failureMode: 'Surface roughness out of spec',
        failureEffect: 'Customer rejection',
        severity: 6,
        cause: 'Incorrect cutting parameters',
        occurrence: 3,
        currentControls: 'Visual inspection',
        detection: 4,
        rpn: 72,
        recommendedAction: 'Optimize cutting parameters',
        responsibility: 'Process Engineering',
        targetDate: new Date('2024-03-20'),
      },
    }),
  ]);
  console.log(`✅ Created ${fmeaRecords.length} FMEA records with items\n`);

  // Create Audit Records
  console.log('Creating audit records...');
  const auditRecords = await Promise.all([
    prisma.audit.create({
      data: {
        tenantId: tenant.id,
        auditNumber: 'AUD-2024-0089',
        title: 'Q1 2024 Internal Quality Audit',
        type: 'internal',
        scope: 'ISO 9001:2015 compliance verification for production processes',
        criteria: 'ISO 9001:2015, Company Quality Manual',
        status: 'scheduled',
        scheduledDate: new Date('2024-03-15'),
        leadAuditorId: admin.id,
        auditors: JSON.stringify(['Lisa Chen', 'Sarah Johnson']),
        auditees: JSON.stringify(['Production Team', 'QA Team']),
        location: 'Plant A - Main Facility',
      },
    }),
    prisma.audit.create({
      data: {
        tenantId: tenant.id,
        auditNumber: 'AUD-2024-0088',
        title: 'Supplier Audit - XYZ Components',
        type: 'supplier',
        scope: 'Assessment of supplier quality management system',
        criteria: 'ISO 9001:2015, Supplier Requirements',
        status: 'completed',
        scheduledDate: new Date('2024-02-01'),
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-02'),
        leadAuditorId: admin.id,
        auditors: JSON.stringify(['Ahmed Al-Rashid']),
        auditees: JSON.stringify(['XYZ Quality Team']),
        location: 'XYZ Components Facility',
        findingsSummary: '2 minor findings identified. Supplier committed to corrective actions.',
      },
    }),
  ]);
  console.log(`✅ Created ${auditRecords.length} audit records\n`);

  // Create Audit Findings
  await Promise.all([
    prisma.auditFinding.create({
      data: {
        auditId: auditRecords[1].id,
        findingNumber: 'AF-2024-001',
        description: 'Calibration records incomplete for measuring equipment.',
        type: 'minor',
        clause: '7.1.5.2',
        evidence: 'Missing calibration certificates for 3 gauges.',
        correctiveActionRequired: true,
        status: 'open',
      },
    }),
    prisma.auditFinding.create({
      data: {
        auditId: auditRecords[1].id,
        findingNumber: 'AF-2024-002',
        description: 'Training records not up to date.',
        type: 'observation',
        clause: '7.2',
        evidence: '2 operators missing recent training documentation.',
        correctiveActionRequired: true,
        status: 'open',
      },
    }),
  ]);
  console.log(`✅ Created audit findings\n`);

  // Create Workflows
  console.log('Creating workflows...');
  const workflows = await Promise.all([
    prisma.workflow.create({
      data: {
        tenantId: tenant.id,
        name: 'NCR Approval Workflow',
        description: 'Standard approval process for Non-Conformance Reports',
        entityType: 'ncr',
        isActive: true,
        steps: {
          create: [
            {
              stepNumber: 1,
              name: 'Initial Review',
              description: 'Quality Engineer reviews NCR',
              actionType: 'review',
              slaHours: 24,
            },
            {
              stepNumber: 2,
              name: 'Manager Approval',
              description: 'Quality Manager approves NCR',
              actionType: 'approval',
              slaHours: 48,
            },
            {
              stepNumber: 3,
              name: 'CAPA Assignment',
              description: 'Assign CAPA if required',
              actionType: 'task',
              slaHours: 72,
            },
          ],
        },
      },
    }),
    prisma.workflow.create({
      data: {
        tenantId: tenant.id,
        name: 'CAPA Verification Workflow',
        description: 'Verification process for completed CAPAs',
        entityType: 'capa',
        isActive: true,
        steps: {
          create: [
            {
              stepNumber: 1,
              name: 'Implementation Review',
              description: 'Verify actions implemented',
              actionType: 'review',
              slaHours: 48,
            },
            {
              stepNumber: 2,
              name: 'Effectiveness Check',
              description: 'Evaluate CAPA effectiveness',
              actionType: 'approval',
              slaHours: 168, // 7 days
            },
          ],
        },
      },
    }),
  ]);
  console.log(`✅ Created ${workflows.length} workflows\n`);

  // Create Notifications
  console.log('Creating notifications...');
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: admin.id,
        type: 'ncr_assigned',
        title: 'New NCR Assigned',
        message: 'NCR-2024-0018 has been assigned to your department',
        entityType: 'ncr',
        entityId: ncrRecords[0].id,
        isRead: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: admin.id,
        type: 'spc_alert',
        title: 'SPC Alert',
        message: 'Process Line 3 showing trend variation',
        isRead: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: admin.id,
        type: 'capa_closed',
        title: 'CAPA Closed',
        message: 'CAPA-2024-0042 has been successfully closed',
        entityType: 'capa',
        entityId: capaRecords[2].id,
        isRead: true,
        readAt: new Date(),
      },
    }),
  ]);
  console.log(`✅ Created notifications\n`);

  // Create Audit Logs
  console.log('Creating audit logs...');
  await Promise.all([
    prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: admin.id,
        action: 'create',
        entityType: 'ncr',
        entityId: ncrRecords[0].id,
        newValues: { ncrNumber: 'NCR-2024-0018', title: 'Dimensional deviation' },
        ipAddress: '127.0.0.1',
        userAgent: 'System Seed',
      },
    }),
    prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: admin.id,
        action: 'login',
        entityType: 'user',
        entityId: admin.id,
        ipAddress: '127.0.0.1',
        userAgent: 'System Seed',
      },
    }),
  ]);
  console.log(`✅ Created audit logs\n`);

  console.log('═══════════════════════════════════════════════════════════');
  console.log('🎉 Database seed completed successfully!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n📋 Default Login Credentials:');
  console.log('   Admin:     admin@qms-enterprise.com / admin123');
  console.log('   Users:     [user]@qms-enterprise.com / password123');
  console.log('\n🏢 Tenant Code: DEMO');
  console.log('═══════════════════════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
