import { NextResponse } from 'next/server';

/**
 * GET /api - Health Check
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Aura Pay API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
}
