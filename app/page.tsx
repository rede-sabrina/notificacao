import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyTokenFromCookie, COOKIE_NAME } from '../lib/auth';
import NotificationsClient from './notifications/NotificationsClient';

type NotificationForm = {
  title: string;
  message: string;
  recipients: string;
  recurring: boolean;
  dayOfMonth?: number;
  sendDate?: string;
};

type NotificationItem = {
  _id: string;
  title: string;
  message: string;
  recipients: string[];
  recurring: boolean;
  dayOfMonth?: number;
  sendDate?: string;
  active?: boolean;
  lastSent?: string;
};

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const auth = verifyTokenFromCookie(token ? `${COOKIE_NAME}=${token}` : null);
  if (!auth) redirect('/login');

  return <NotificationsClient />;
}
