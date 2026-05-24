import { Request, Response, NextFunction } from 'express';
import { prisma } from '../server';

// Entity types that should be audited
const AUDITABLE_ENTITIES = [
  'ncr',
  'capa',
  'eight_d',
  'fmea',
  'audit',
  'spc',
  'iot_device',
  'user',
  'role',
  'plant',
  'workflow',
];

/**
 * Audit Middleware
 * Logs all significant actions for compliance and traceability
 */
export const auditMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Store original send function
  const originalSend = res.send.bind(res);

  // Override send to capture response
  res.send = function (body: any): Response {
    // Process audit logging asynchronously (don't block response)
    logAuditEvent(req, res, body).catch(console.error);

    // Call original send
    return originalSend(body);
  };

  next();
};

/**
 * Log audit event
 */
async function logAuditEvent(
  req: Request,
  res: Response,
  responseBody: any
): Promise<void> {
  try {
    // Only audit authenticated requests
    if (!req.user) return;

    // Determine action type from method and path
    const action = getActionType(req.method, res.statusCode);
    if (!action) return;

    // Extract entity type from path
    const entityType = getEntityTypeFromPath(req.path);
    if (!entityType) return;

    // Extract entity ID from request params or body
    const entityId = req.params.id || req.body.id || extractIdFromResponse(responseBody);

    // Get old values for updates (if applicable)
    let oldValues: any = null;
    if (action === 'update' && entityId) {
      oldValues = await getOldValues(entityType, entityId, req.user!.tenantId);
    }

    // Get new values from request body
    const newValues = req.body && Object.keys(req.body).length > 0 ? req.body : null;

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        tenantId: req.user!.tenantId,
        userId: req.user!.id,
        action,
        entityType,
        entityId,
        oldValues,
        newValues,
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.headers['user-agent'] || null,
        metadata: {
          path: req.path,
          method: req.method,
          statusCode: res.statusCode,
          query: req.query,
        },
      },
    });
  } catch (error) {
    // Log audit error but don't fail the request
    console.error('Audit logging error:', error);
  }
}

/**
 * Determine action type from HTTP method and response status
 */
function getActionType(method: string, statusCode: number): string | null {
  // Don't audit failed requests
  if (statusCode >= 400) return null;

  switch (method.toUpperCase()) {
    case 'POST':
      return 'create';
    case 'PUT':
    case 'PATCH':
      return 'update';
    case 'DELETE':
      return 'delete';
    default:
      return null; // Don't audit GET requests
  }
}

/**
 * Extract entity type from request path
 */
function getEntityTypeFromPath(path: string): string | null {
  const parts = path.split('/').filter(Boolean);
  if (parts.length < 2) return null;

  const entityMap: Record<string, string> = {
    'ncr': 'ncr',
    'capa': 'capa',
    'eight-d': 'eight_d',
    'fmea': 'fmea',
    'audits': 'audit',
    'spc': 'spc',
    'iot': 'iot_device',
    'users': 'user',
    'roles': 'role',
    'plants': 'plant',
    'workflows': 'workflow',
  };

  const entity = parts[2]; // /api/v1/entity/...
  return entityMap[entity] || null;
}

/**
 * Extract entity ID from response body
 */
function extractIdFromResponse(body: any): string | null {
  try {
    const parsed = typeof body === 'string' ? JSON.parse(body) : body;
    if (parsed?.data?.id) return parsed.data.id;
    if (parsed?.id) return parsed.id;
    return null;
  } catch {
    return null;
  }
}

/**
 * Get old values before update
 */
async function getOldValues(
  entityType: string,
  entityId: string,
  tenantId: string
): Promise<any> {
  try {
    switch (entityType) {
      case 'ncr':
        const ncr = await prisma.nCR.findFirst({
          where: { id: entityId, tenantId },
        });
        return ncr ? sanitizeForAudit(ncr) : null;

      case 'capa':
        const capa = await prisma.cAPA.findFirst({
          where: { id: entityId, tenantId },
        });
        return capa ? sanitizeForAudit(capa) : null;

      case 'user':
        const user = await prisma.user.findFirst({
          where: { id: entityId, tenantId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
            plantId: true,
            departmentId: true,
          },
        });
        return user || null;

      default:
        return null;
    }
  } catch (error) {
    console.error('Error getting old values for audit:', error);
    return null;
  }
}

/**
 * Sanitize object for audit log (remove sensitive fields)
 */
function sanitizeForAudit(obj: any): any {
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '***REDACTED***';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Manual audit logging helper
 * Use this for actions that need explicit audit logging
 */
export const logAudit = async (data: {
  tenantId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        ...data,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Manual audit logging error:', error);
  }
};
