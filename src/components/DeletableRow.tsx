import { useRef, type ComponentRef, type ReactNode, type Ref } from 'react';
import { View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { Failure } from './Failure';
import { Text } from './Text';

/**
 * What a swipe to the left shows, as iOS's own lists: drawn only, since the row swiped open asks. Hidden
 * from a screen reader, which has the row's own *Delete* action.
 */
function SwipedDelete({ progress }: { progress: SharedValue<number> }) {
  // Not drawn at rest: the card's rounded edge lets a red under the row show through its corners.
  // Its dependency named, since Stryker wraps the callback where the worklets plugin cannot see it.
  const drawn = useAnimatedStyle(() => ({ opacity: progress.value > 0 ? 1 : 0 }), [progress]);
  return (
    <Animated.View style={drawn}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="min-w-target flex-1 items-center justify-center bg-fault px-5"
      >
        <Text className="font-language-bold text-body text-ground">Delete</Text>
      </View>
    </Animated.View>
  );
}

/**
 * A row deleted by a swipe to the left, and over it why it is still there: under the lowest row is
 * out of view. A screen reader, which cannot swipe, has the row's own *Delete* action.
 */
export function DeletableRow({
  ref,
  onDelete,
  fault,
  children,
}: {
  ref?: Ref<ComponentRef<typeof View>>;
  onDelete: () => void;
  fault?: string;
  children: ReactNode;
}) {
  const swipe = useRef<SwipeableMethods>(null);
  const deleteSwiped = () => {
    swipe.current?.close();
    onDelete();
  };
  return (
    <View ref={ref}>
      {fault ? (
        <View className="px-grid-2 pt-grid-2">
          <Failure words={fault} />
        </View>
      ) : null}
      <ReanimatedSwipeable
        ref={swipe}
        friction={2}
        rightThreshold={40}
        // Swiped open, the row asks the system's question, as iOS's lists and Material's swipe to dismiss.
        onSwipeableOpen={deleteSwiped}
        renderRightActions={(progress) => <SwipedDelete progress={progress} />}
      >
        <View className="bg-surface">{children}</View>
      </ReanimatedSwipeable>
    </View>
  );
}
