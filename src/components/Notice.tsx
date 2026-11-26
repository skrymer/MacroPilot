import { View } from 'react-native';

import { Button } from './Button';
import { Text } from './Text';

/** What a page says where it has no list to show, and the way on from there. */
export function Notice({
  title,
  detail,
  action,
  onAction,
}: {
  title: string;
  detail?: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <View className="gap-grid-2 rounded-card bg-surface p-grid-2">
      <View>
        <Text className="font-language-bold text-body text-ink">{title}</Text>
        {detail ? <Text className="font-language text-label text-ink-mid">{detail}</Text> : null}
      </View>
      <Button label={action} onPress={onAction} />
    </View>
  );
}
