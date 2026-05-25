import type { IncomingMessage, ServerResponse } from 'http';

const hasValue = (value: string | undefined) => Boolean(value && value.trim());

export default function handler(_req: IncomingMessage, res: ServerResponse) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(
    JSON.stringify({
      ok: true,
      runtime: 'vercel-serverless',
      env: {
        databaseUrl: hasValue(process.env.DATABASE_URL),
        directUrl: hasValue(process.env.DIRECT_URL),
        jwtSecret: hasValue(process.env.JWT_SECRET),
        corsOrigin: hasValue(process.env.CORS_ORIGIN),
      },
      timestamp: new Date().toISOString(),
    }),
  );
}
