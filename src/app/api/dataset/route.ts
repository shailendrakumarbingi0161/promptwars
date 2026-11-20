import { NextResponse } from 'next/server';
import { AUTHORITATIVE_DATASET } from '@/data/authoritativeDataset';

export async function GET() {
  return NextResponse.json(AUTHORITATIVE_DATASET);
}
