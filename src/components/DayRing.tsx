import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

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
  const around = 2 * Math.PI * radius;
  const shape = { cx: RING / 2, cy: RING / 2, r: radius, strokeWidth: width, fill: 'none' };
  // Round ends that would meet across a small gap read as a fault, so they are flat there; and the
  // flat arc keeps the length its round ends covered, half a width at each, so more never draws less.
  const flat = around * (1 - share) < 2 * width;
  const drawn = flat ? Math.min(around * share + width, around) : around * share;
  const start = flat ? -90 - ((width / 2) * 360) / around : -90;
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
