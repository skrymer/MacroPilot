import { Link as RouterLink, type LinkProps as RouterLinkProps } from 'expo-router';
import { Pressable } from 'react-native';

import { Text } from './Text';

/**
 * Where a link goes and how, plus its label. The router's own props extend
 * `TextProps`, which would land on the target rather than the label here, so
 * only navigation passes through.
 */
export type LinkProps = Pick<
  RouterLinkProps,
  'href' | 'replace' | 'push' | 'dismissTo' | 'onPress' | 'children'
> & { className?: string };

/**
 * expo-router's `Link`, with its label drawn by the app's `Text` so it carries
 * the font-scaling cap (ADR 0007). The router's own draws React Native's.
 *
 * The label sits in a `Pressable` holding the target floor, so the target is
 * never the text's own box, whatever its size token or Larger Text setting.
 * `className` styles the label; the target is the wrapper's.
 */
export function Link({ className, children, ...props }: LinkProps) {
  return (
    <RouterLink {...props} asChild>
      <Pressable accessibilityRole="link" className="min-h-target min-w-target justify-center">
        <Text className={className}>{children}</Text>
      </Pressable>
    </RouterLink>
  );
}
