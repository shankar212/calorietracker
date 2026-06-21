import { NextResponse } from 'next/server';
import { getMockScanResult } from '@/lib/stateStore';

export async function GET() {
  try {
    const scan = getMockScanResult();
    return NextResponse.json(scan);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve scan result' }, { status: 500 });
  }
}
