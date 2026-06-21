import { NextRequest, NextResponse } from 'next/server';
import { getAppState, updateGoal } from '@/lib/stateStore';
import { FitnessGoal } from '@/types';

export async function GET() {
  try {
    const state = getAppState();
    return NextResponse.json(state);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve state' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { goal } = body;

    if (!goal || !['weight-loss', 'maintenance', 'muscle-gain'].includes(goal)) {
      return NextResponse.json({ error: 'Invalid or missing goal field' }, { status: 400 });
    }

    const state = updateGoal(goal as FitnessGoal);
    return NextResponse.json(state);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
  }
}
