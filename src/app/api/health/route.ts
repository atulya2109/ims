import { NextResponse } from 'next/server';
import { getDb } from '@ims/lib/mongodb';

export async function GET() {
  try {
    // Check database connection
    const db = await getDb();
    await db.admin().ping();

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
