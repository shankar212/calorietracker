import { NextRequest, NextResponse } from 'next/server';
import { addMeal, deleteMeal } from '@/lib/stateStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, weight } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Food name is required' }, { status: 400 });
    }

    const parsedWeight = parseFloat(weight);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      return NextResponse.json({ error: 'Portion weight must be a positive number' }, { status: 400 });
    }

    const state = addMeal(name.trim(), parsedWeight);
    return NextResponse.json(state);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add meal' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Meal ID is required' }, { status: 400 });
    }

    const state = deleteMeal(id);
    return NextResponse.json(state);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete meal' }, { status: 500 });
  }
}
