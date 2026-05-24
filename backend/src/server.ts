import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import ncrRoutes from './routes/ncr.routes';
import capaRoutes from './routes/capa.routes';
import deviationRoutes from './routes/deviation.routes';
import changeControlRoutes from './routes/change-control.routes';
import complaintRoutes from './routes/complaint.routes';
import controlPlanRoutes from './routes/control-plan.routes';
import spcRoutes from './routes/spc.routes';
import iotRoutes from './routes/iot.routes';
import workflowRoutes from './routes/workflow.routes';
import reportRoutes from './routes/report.routes';
import auditRoutes from './routes/audit.routes';
import plantRoutes from './routes/plant.routes';
import dashboardRoutes from './routes/dashboard.routes';
import eightDRoutes from './routes/eightd.routes';
import fmeaRoutes from './routes/fmea.routes';
import supplierRoutes from './routes/supplier.routes';
import inspectionRoutes from './routes/inspection.routes';
import calibrationRoutes from './routes/calibration.routes';
import productionLayoutRoutes from './routes/production-layout.routes';

// Import middleware
import { errorHandler } from './middleware/error.middleware';
import { authenticateToken } from './middleware/auth.middleware';
import { tenantMiddleware } from './middleware/tenant.middleware';
import { auditMiddleware } from './middleware/audit.middleware';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;
const bodyLimit = process.env.JSON_BODY_LIMIT || '10mb';
const allowedCorsOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable('x-powered-by');

// Initialize Prisma Client
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "ws:", "wss:"],
      imgSrc: ["'self'", "data:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (no Origin header)
    if (!origin) return callback(null, true);

    // In development, allow localhost/127.0.0.1 on any port (Vite can change ports)
    if (process.env.NODE_ENV !== 'production') {
      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
      if (isLocalhost) return callback(null, true);
    }

    // In production (or when explicitly configured), restrict to configured origins
    if (allowedCorsOrigins.includes(origin)) return callback(null, true);

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: bodyLimit }));

// Health check endpoint (public)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV,
  });
});

// API Root endpoint (public)
app.get('/api/v1', (req, res) => {
  res.json({
    success: true,
    message: 'QMS Enterprise 4.0 API',
    version: 'v1',
    endpoints: [
      '/api/v1/auth',
      '/api/v1/users',
      '/api/v1/ncr',
      '/api/v1/capa',
      '/api/v1/deviations',
      '/api/v1/change-control',
      '/api/v1/complaints',
      '/api/v1/control-plans',
      '/api/v1/spc',
      '/api/v1/iot',
      '/api/v1/workflows',
      '/api/v1/reports',
      '/api/v1/audits',
      '/api/v1/plants',
      '/api/v1/dashboard',
      '/api/v1/eight-d',
      '/api/v1/fmea',
      '/api/v1/suppliers',
      '/api/v1/inspections',
      '/api/v1/calibrations',
      '/api/v1/production-layout',
    ],
  });
});

// Public routes
app.use('/api/v1/auth', authRoutes);

// Protected routes
app.use('/api/v1/users', authenticateToken, tenantMiddleware, auditMiddleware, userRoutes);
app.use('/api/v1/ncr', authenticateToken, tenantMiddleware, auditMiddleware, ncrRoutes);
app.use('/api/v1/capa', authenticateToken, tenantMiddleware, auditMiddleware, capaRoutes);
app.use('/api/v1/deviations', authenticateToken, tenantMiddleware, auditMiddleware, deviationRoutes);
app.use('/api/v1/change-control', authenticateToken, tenantMiddleware, auditMiddleware, changeControlRoutes);
app.use('/api/v1/complaints', authenticateToken, tenantMiddleware, auditMiddleware, complaintRoutes);
app.use('/api/v1/control-plans', authenticateToken, tenantMiddleware, auditMiddleware, controlPlanRoutes);
app.use('/api/v1/spc', authenticateToken, tenantMiddleware, auditMiddleware, spcRoutes);
app.use('/api/v1/iot', authenticateToken, tenantMiddleware, auditMiddleware, iotRoutes);
app.use('/api/v1/workflows', authenticateToken, tenantMiddleware, auditMiddleware, workflowRoutes);
app.use('/api/v1/reports', authenticateToken, tenantMiddleware, auditMiddleware, reportRoutes);
app.use('/api/v1/audits', authenticateToken, tenantMiddleware, auditMiddleware, auditRoutes);
app.use('/api/v1/plants', authenticateToken, tenantMiddleware, auditMiddleware, plantRoutes);
app.use('/api/v1/dashboard', authenticateToken, tenantMiddleware, dashboardRoutes);
app.use('/api/v1/eight-d', authenticateToken, tenantMiddleware, auditMiddleware, eightDRoutes);
app.use('/api/v1/fmea', authenticateToken, tenantMiddleware, auditMiddleware, fmeaRoutes);
app.use('/api/v1/suppliers', authenticateToken, tenantMiddleware, auditMiddleware, supplierRoutes);
app.use('/api/v1/inspections', authenticateToken, tenantMiddleware, auditMiddleware, inspectionRoutes);
app.use('/api/v1/calibrations', authenticateToken, tenantMiddleware, auditMiddleware, calibrationRoutes);
app.use('/api/v1/production-layout', authenticateToken, tenantMiddleware, auditMiddleware, productionLayoutRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     QMS Enterprise 4.0 - Backend Server                      ║
║                                                              ║
║     Status: Running                                          ║
║     Port: ${PORT}                                              ║
║     Environment: ${process.env.NODE_ENV || 'development'}                          ║
║     API Version: v1                                          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Server closed and database disconnected');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Server closed and database disconnected');
    process.exit(0);
  });
});

export default app;
