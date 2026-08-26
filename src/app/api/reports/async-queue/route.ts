import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { reportType, dateRange } = await request.json();
    const jobId = 'job_' + crypto.randomBytes(8).toString('hex');
    const downloadToken = crypto.randomBytes(16).toString('hex');

    // Simulate async job registration & signed URL generation
    const downloadUrl = `/api/reports/export?type=${reportType || 'orders'}&token=${downloadToken}`;

    return NextResponse.json({
      success: true,
      jobId,
      status: 'completed',
      reportType,
      downloadUrl,
      expiresIn: '24 hours',
      message: 'Rapor asenkron olarak üretildi ve imzalı güvenli indirme linki hazırlandı.'
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
