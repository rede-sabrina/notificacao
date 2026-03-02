import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb';
import Notification from '../../../models/Notification';
import { verifyTokenFromCookie } from '../../../lib/auth';

export async function GET() {
  await connectToDatabase();
  const items = await Notification.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const auth = verifyTokenFromCookie(request.headers.get('cookie'));
  if (!auth) return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const body = await request.json();
  const { title, message, recipients, recurring, dayOfMonth, sendDate } = body;

  if (!title || !message || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return new NextResponse(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
  }

  await connectToDatabase();

  const doc = await Notification.create({
    title,
    message,
    recipients,
    recurring: !!recurring,
    dayOfMonth: recurring ? Number(dayOfMonth) : undefined,
    sendDate: sendDate ? new Date(sendDate) : undefined
  });

  return new NextResponse(JSON.stringify(doc), { status: 201 });
}

export async function PUT(request: Request) {
  const auth = verifyTokenFromCookie(request.headers.get('cookie'));
  if (!auth) return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const body = await request.json();
  const { id, ...updates } = body;
  if (!id) return new NextResponse(JSON.stringify({ error: 'Missing id' }), { status: 400 });
  await connectToDatabase();
  const doc = await Notification.findByIdAndUpdate(id, updates, { new: true });
  if (!doc) return new NextResponse(JSON.stringify({ error: 'Not found' }), { status: 404 });
  return NextResponse.json(doc);
}

export async function DELETE(request: Request) {
  const auth = verifyTokenFromCookie(request.headers.get('cookie'));
  if (!auth) return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return new NextResponse(JSON.stringify({ error: 'Missing id' }), { status: 400 });
  await connectToDatabase();
  await Notification.findByIdAndDelete(id);
  return new NextResponse(null, { status: 204 });
}
