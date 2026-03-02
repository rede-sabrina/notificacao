const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is required in environment');
  process.exit(1);
}

mongoose.set('strictQuery', false);
mongoose.connect(MONGODB_URI).then(() => {
  console.log('Worker connected to MongoDB');
}).catch((err) => {
  console.error('Mongo connect error', err);
  process.exit(1);
});

const NotificationSchema = new mongoose.Schema({
  title: String,
  message: String,
  recipients: [String],
  recurring: Boolean,
  dayOfMonth: Number,
  sendDate: Date,
  active: { type: Boolean, default: true },
  lastSent: Date
}, { timestamps: true });

const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

const port = Number(process.env.SMTP_PORT) || 465;
const secure = port === 465;

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

transporter.verify().then(() => {
  console.log('Worker: SMTP connection verified (port', port, 'secure', secure, ')');
}).catch((err) => {
  console.error('Worker: SMTP verify failed', err);
});

async function sendNotification(notification) {
  const from = process.env.FROM_EMAIL || process.env.SMTP_USER;
  const toList = notification.recipients.join(', ');

  const mail = {
    from,
    to: toList,
    subject: notification.title,
    text: notification.message,
    html: (function(){
      function escapeHtml(s){
        return String(s)
          .replace(/&/g,'&amp;')
          .replace(/</g,'&lt;')
          .replace(/>/g,'&gt;')
          .replace(/"/g,'&quot;')
          .replace(/'/g,'&#039;');
      }
      return '<p>' + escapeHtml(notification.message).replace(/\r?\n/g,'<br/>') + '</p>';
    })()
  };

  try {
    console.log('Worker: sending', notification._id, 'to', toList);
    console.log('Worker: mail object', { from: mail.from, to: mail.to, subject: mail.subject });
    const info = await transporter.sendMail(mail);
    console.log('Sent', info.messageId, 'to', toList, 'response:', info.response || info);
    notification.lastSent = new Date();
    if (!notification.recurring) notification.active = false;
    await notification.save();
  } catch (err) {
    console.error('Error sending mail', err && err.stack ? err.stack : err);
  }
}

// Schedule (default: daily at 09:00). Can be overridden by WORKER_CRON and WORKER_TZ in env.
const schedulePattern = process.env.WORKER_CRON || '0 9 * * *';
const cronOptions = process.env.WORKER_TZ ? { timezone: process.env.WORKER_TZ } : undefined;
cron.schedule(schedulePattern, async () => {
  const today = new Date();
  const day = today.getDate();
  console.log('Worker running check for day', day);

  try {
    // recurring notifications for this day
    const recurring = await Notification.find({ active: true, recurring: true, dayOfMonth: day });
    console.log('Worker found recurring:', recurring.length);
    for (const n of recurring) {
      await sendNotification(n);
    }

    // one-time notifications scheduled for today (date match)
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const ones = await Notification.find({ active: true, recurring: false, sendDate: { $gte: start, $lt: end } });
    console.log('Worker found one-time:', ones.length);
    for (const n of ones) {
      await sendNotification(n);
    }
  } catch (err) {
    console.error('Worker error', err);
  }
});

console.log('Worker started — scheduled to run daily at 00:00');
