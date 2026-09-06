import { redirect } from 'next/navigation';

export default function WhoRedirect() {
  redirect('/login');
}
