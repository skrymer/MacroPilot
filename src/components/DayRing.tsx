import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { arcDash } from './arcDash';
import { useTint } from './useTint';

/** The day ring's width and height, in dp. */
const RING = 240;

/** Where a day stands against its budget alone: the hue its arc takes. */
export type Standing = 'within' | 'slightly-over' | 'over';

/**
 * One of the ring's arcs over its track, both `width` dp wide at `radius`, the arc drawn clockwise
 * from the top to `share` of the way round in `stroke`; none on nothing, where a round end draws a dot.
 */
function Arc({
  radius,
  width,
  share,
  stroke,
  track,
}: {
  radius: number;
  width: number;
  share: number;
  stroke: string | undefined;
  track: string | undefined;
}) {
  const { around, flat, drawn, start } = arcDash(share, radius, width);
  const shape = { cx: RING / 2, cy: RING / 2, r: radius, strokeWidth: width, fill: 'none' };
  return (
    <>
      <Circle {...shape} stroke={track} />
      {share > 0 ? (
        <Circle
          {...shape}
          stroke={stroke}
          strokeLinecap={flat ? 'butt' : 'round'}
          strokeDasharray={`${drawn} ${around}`}
          rotation={start}
          origin={`${RING / 2}, ${RING / 2}`}
        />
      ) : null}
    </>
  );
}

/**
 * The day ring (DESIGN.md, *Signature: the rings*): the full circle is the target; calories outside
 * and thick as a share of the budget, in the day's standing; protein inside and thin, as a share of
 * the floor reached. What stands in the centre, and protein's words, are the caller's.
 */
export function DayRing({
  share,
  proteinShare,
  standing,
  children,
}: {
  /** The day's calories as a share of the budget, at most 1. */
  share: number;
  /** The day's Known protein as a share of the floor, at most 1; 0 when nothing is known. */
  proteinShare: number;
  standing: Standing;
  children: ReactNode;
}) {
  const tint = useTint();
  return (
    <View className="items-center justify-center">
      <Svg width={RING} height={RING}>
        <Arc radius={110} width={14} share={share} stroke={tint[standing]} track={tint.line} />
        <Arc radius={88} width={8} share={proteinShare} stroke={tint.within} track={tint.line} />
      </Svg>
      <View className="absolute items-center">{children}</View>
    </View>
  );
}
