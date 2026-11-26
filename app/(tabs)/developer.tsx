import { Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Link } from '@/components/Link';

/**
 * Development features, as they come. Expo Router ships every route file, so a release build that
 * reaches this one anyway is sent to Today rather than trusting nothing links here.
 */
export default function Developer() {
  if (!__DEV__) return <Redirect href="/" />;
  return (
    <SafeAreaView className="flex-1 bg-ground px-page" edges={['top']}>
      <Link href="/design" className="text-body text-ink underline">
        Design reference
      </Link>
    </SafeAreaView>
  );
}
