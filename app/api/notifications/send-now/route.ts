import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb';
import Notification from '../../../../models/Notification';
import nodemailer from 'nodemailer';
import { verifyTokenFromCookie } from '../../../../lib/auth';

export async function POST(request: Request) {
  // protect endpoint: allow either scheduler secret header OR an authenticated admin cookie
  const expected = process.env.SCHEDULER_SECRET;
  const received = request.headers.get('x-scheduler-secret');
  const auth = verifyTokenFromCookie(request.headers.get('cookie'));

  if (!auth) {
    // not authenticated via cookie, require scheduler secret
    if (!expected) {
      return new NextResponse(JSON.stringify({ ok: false, error: 'SCHEDULER_SECRET not configured on server' }), { status: 500 });
    }
    if (!received || received !== expected) {
      return new NextResponse(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });
    }
  }

  await connectToDatabase();

  const port = Number(process.env.SMTP_PORT) || 465;
  const secure = port === 465; // 465 => implicit TLS, 587 => STARTTLS

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure,
    requireTLS: !secure,
    logger: true,
    debug: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  try {
    await transporter.verify();
    console.log('SMTP connection verified (port', port, 'secure', secure, ')');
  } catch (err) {
    console.error('SMTP verify failed:', err);
  }

  const today = new Date();
  const day = today.getDate();

  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const results: { id: string; to: string[]; status: string; error?: string; info?: any }[] = [];

  try {
    console.log('Checking notifications for day', day, 'range', start.toISOString(), end.toISOString());
    const recurring = await Notification.find({ active: true, recurring: true, dayOfMonth: day });
    const ones = await Notification.find({ active: true, recurring: false, sendDate: { $gte: start, $lt: end } });
    console.log('Found', recurring.length, 'recurring and', ones.length, 'one-time notifications');

    const all = [...recurring, ...ones];

    for (const n of all) {
      try {
        const from = process.env.FROM_EMAIL || process.env.SMTP_USER;
        const toList = n.recipients.join(', ');
        const mail = {
          from,
          to: toList,
          subject: n.title,
          text: n.message,
          html: `<p>${n.message}</p>`
        };

        console.log('Sending notification', String(n._id), 'to', n.recipients);
        try {
          const info = await transporter.sendMail(mail);
          console.log('sendMail info:', info);
          n.lastSent = new Date();
          if (!n.recurring) n.active = false;
          await n.save();
          results.push({ id: String(n._id), to: n.recipients, status: 'sent', info: info });
        } catch (sendErr: any) {
          console.error('Error sending notification', String(n._id), sendErr);
          results.push({ id: String(n._id), to: n.recipients, status: 'error', error: String(sendErr.message || sendErr) });
        }
      } catch (err: any) {
        console.error('Notification loop error for', String(n._id), err);
        results.push({ id: String(n._id), to: n.recipients, status: 'error', error: String(err.message || err) });
      }
    }

    return NextResponse.json({ ok: true, sent: results.length, results });
  } catch (err: any) {
    return new NextResponse(JSON.stringify({ ok: false, error: String(err.message || err) }), { status: 500 });
  }
}
