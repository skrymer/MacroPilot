import { View } from 'react-native';

import { Button } from './Button';
import { Failure } from './Failure';

/** In place of what a page could not read, what failed and the way to try again. */
export function Unreadable({ words, onRetry }: { words: string; onRetry: () => void }) {
  return (
    <View className="gap-grid-2">
      <Failure words={words} />
      <Button label="Retry" onPress={onRetry} secondary />
    </View>
  );
}
