import { NextResponse } from 'next/server';
import { getConfiguredProviders } from '@/lib/ai';

export async function GET() {
  return NextResponse.json({
    providers: getConfiguredProviders(),
    defaultProvider: 'local',
  });
}
