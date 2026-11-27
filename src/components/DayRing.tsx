import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useTint } from './useTint';

/** The day ring's width and height, in dp. */
const RING = 240;

/** The calorie arc's length all the way round, at its radius of 110. */
const AROUND = 2 * Math.PI * 110;

/** Where a day stands against its budget alone: the hue its arc takes. */
export type Standing = 'within' | 'slightly-over' | 'over';

/**
 * The day ring (DESIGN.md, *Signature: the rings*): the full circle is the target; calories outside
 * and thick as a share of the budget, in the day's standing; protein inside and thin, its track alone
 * until its words are drawn. What stands in the centre is the caller's.
 */
export function DayRing({
  share,
  standing,
  children,
}: {
  /** The day's calories as a share of the budget, at most 1. */
  share: number;
  standing: Standing;
  children: ReactNode;
}) {
  const tint = useTint();
  return (
    <View className="items-center justify-center">
      <Svg width={RING} height={RING}>
        <Circle
          cx={RING / 2}
          cy={RING / 2}
          r={110}
          strokeWidth={14}
          stroke={tint.line}
          fill="none"
        />
        <Circle cx={RING / 2} cy={RING / 2} r={88} strokeWidth={8} stroke={tint.line} fill="none" />
        {/* None on nothing, where a round cap draws a dot. */}
        {share > 0 ? (
          <Circle
            cx={RING / 2}
            cy={RING / 2}
            r={110}
            strokeWidth={14}
            stroke={tint[standing]}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${AROUND * share} ${AROUND}`}
            rotation={-90}
            origin={`${RING / 2}, ${RING / 2}`}
          />
        ) : null}
      </Svg>
      <View className="absolute items-center">{children}</View>
    </View>
  );
}
