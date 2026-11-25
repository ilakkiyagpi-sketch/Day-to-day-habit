/** Entry route: sends the user to the right place for their auth state/role. */
import { Redirect } from 'expo-router';
import { useAuth } from '../lib/auth';

export default function Index() {
  const { session, profile, pinState, isDemo } = useAuth();
  const signedIn = isDemo ? !!profile : !!session;
  if (!signedIn) return <Redirect href="/sign-in" />;
  if (pinState !== 'unlocked') return <Redirect href="/pin" />;
  if (!profile) return <Redirect href="/no-profile" />;
  return <Redirect href={profile.role === 'admin' ? '/family' : '/today'} />;
}
