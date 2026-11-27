import { useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useEffectEvent, useState, type ReactNode } from 'react';
import { FlatList, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { dayWords } from '@/components/dayWords';
import { CardSlice } from '@/components/CardSlice';
import { DeletableRow } from '@/components/DeletableRow';
import { EmptyLine } from '@/components/EmptyLine';
import { entryFigures, entryWords, tallyWords, totalsWords } from '@/components/entryWords';
import { kg, spokenKg } from '@/components/figures';
import { FIGURE_SET } from '@/components/figureSet';
import { Hairline } from '@/components/Hairline';
import { useLogged } from '@/components/LoggedContext';
import { Row } from '@/components/Row';
import { ShowAll } from '@/components/ShowAll';
import { Text } from '@/components/Text';
import { TextAction } from '@/components/TextAction';
import { Unreadable } from '@/components/Unreadable';
import { useDelete } from '@/components/useDelete';
import { useFailedInView } from '@/components/useFailedInView';
import { useTint } from '@/components/useTint';
import { totalsOf, type Totals as DayTotals } from '@/domain/dailyLog';
import { reviewFor, type Review } from '@/domain/review';
import { missingForSetup } from '@/domain/setup';
import { shownName } from '@/domain/shownName';
import { dayVerdict, type Verdict } from '@/domain/verdict';
import { weighInOn, type WeighIn } from '@/domain/weighIn';
import { useToday } from '@/lifecycle/useToday';
import type { LoggedEntry } from '@/storage/EntryStore';
import { useEntryStore } from '@/storage/EntryStoreContext';
import { useReviewStore } from '@/storage/ReviewStoreContext';
import { useReading } from '@/storage/useReading';
import { useProfile } from '@/storage/useProfile';
import { useWeighIns } from '@/storage/useWeighIns';

const PROTEIN_SET = { ...FIGURE_SET, weighed: 'font-language text-ink-mid' };

function Totals({
  totals,
  count,
  children,
}: {
  totals: DayTotals;
  count: number;
  /** The card's last row. */
  children: ReactNode;
}) {
  const { calories, caloriesKind, protein, proteinKind, spoken } = totalsWords(totals);
  return (
    <View className="rounded-card bg-surface p-grid-2">
      <View
        accessible
        accessibilityLabel={`${spoken} today${count === 0 ? ', nothing logged yet' : ''}`}
      >
        <Text className={`text-title ${FIGURE_SET[caloriesKind]}`}>{calories}</Text>
        <Text className={`text-label ${PROTEIN_SET[proteinKind]}`}>{protein}</Text>
        {count === 0 ? (
          <Text className="font-language text-label text-ink-mid">Nothing logged yet</Text>
        ) : null}
      </View>
      <View className="mt-grid-2">{children}</View>
    </View>
  );
}

/** The day ring's width and height, in dp. */
const RING = 240;

/** The calorie arc's length all the way round, at its radius of 110. */
const AROUND = 2 * Math.PI * 110;

/** Where a day stands against its budget alone, the hue its arc and figure take. */
const STANDING = {
  'over budget': 'over',
  'slightly over': 'slightly-over',
  'on target': 'within',
  'in progress': 'within',
} as const satisfies Record<Verdict, 'within' | 'slightly-over' | 'over'>;

/** The figure past its budget; within it, the figure is set as any figure is. */
const STANDING_INK = { 'slightly-over': 'text-slightly-over', over: 'text-over' } as const;

/** A verdict that has a standing to say takes its hue; one still in progress does not. */
const VERDICT_INK: Record<Verdict, string> = {
  'over budget': 'text-over',
  'slightly over': 'text-slightly-over',
  'on target': 'text-within',
  'in progress': 'text-ink-mid',
};

const VERDICT_WORDS: Record<Verdict, string> = {
  'over budget': 'Over budget',
  'slightly over': 'Slightly over',
  'on target': 'On target',
  'in progress': 'In progress',
};

/**
 * The day card once the day is held to a review: what is left of the budget or how far past it, and
 * the day's verdict in words, read out as one; the card's last row is the caller's.
 */
function RingCard({
  totals,
  count,
  review,
  children,
}: {
  totals: DayTotals;
  count: number;
  review: Review;
  children: ReactNode;
}) {
  const left = Math.round(review.budgetKcal - totals.calories);
  const centre = String(Math.abs(left));
  const unit = left < 0 ? 'kcal over' : 'kcal left';
  // An empty day is an empty track, and says so rather than that it is in progress.
  const judged = dayVerdict(totals, review);
  const verdict = count === 0 ? 'Nothing logged yet' : VERDICT_WORDS[judged];
  // The arc, the figure and the verdict say one thing: where the day stands (DESIGN.md, *The axes*).
  const standing = STANDING[judged];
  // A day of estimates alone is set lighter and says so (DESIGN.md, *Figures*).
  const about = totals.estimated;
  const tint = useTint();
  const share = Math.min(totals.calories / review.budgetKcal, 1);
  return (
    <View className="rounded-card bg-surface p-grid-2">
      <View
        accessible
        accessibilityLabel={`${verdict}, ${about ? 'about ' : ''}${centre} ${unit}`}
        className="items-center"
      >
        <View className="items-center justify-center">
          {/* The full circle is the target: the track first (DESIGN.md, *Signature: the rings*). */}
          <Svg width={RING} height={RING}>
            <Circle
              cx={RING / 2}
              cy={RING / 2}
              r={110}
              strokeWidth={14}
              stroke={tint.line}
              fill="none"
            />
            {/* Protein inside and thin: its track alone until its words are drawn. */}
            <Circle
              cx={RING / 2}
              cy={RING / 2}
              r={88}
              strokeWidth={8}
              stroke={tint.line}
              fill="none"
            />
            {/* The calories as a share of the budget; none on nothing, where a round cap draws a dot. */}
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
          <View className="absolute items-center">
            {about ? <Text className="font-language text-label text-ink-mid">about</Text> : null}
            <Text
              className={`text-figure ${
                standing === 'within'
                  ? FIGURE_SET[about ? 'estimated' : 'weighed']
                  : `${about ? 'font-estimated' : 'font-weighed'} ${STANDING_INK[standing]}`
              }`}
            >
              {centre}
            </Text>
            <Text className="font-language text-label text-ink-mid">{unit}</Text>
          </View>
        </View>
        <Text
          className={`mt-grid-1 text-center font-language-bold text-body ${
            count === 0 ? 'text-ink-mid' : VERDICT_INK[judged]
          }`}
        >
          {verdict}
        </Text>
      </View>
      <View className="mt-grid-2">{children}</View>
    </View>
  );
}

/**
 * Before Setup, what is missing for a calorie budget and the way to it: a weigh-in is logged here, and
 * the details on Profile. Nothing once both are there.
 */
function SetupLine({
  missing,
  onProfile,
  onWeighIn,
}: {
  missing: readonly ('details' | 'weigh-in')[];
  onProfile: () => void;
  onWeighIn: () => void;
}) {
  if (missing.length === 0) return null;
  const hasWeighIn = !missing.includes('weigh-in');
  if (!missing.includes('details')) {
    return (
      <EmptyLine
        words="Log your weight to see your calorie budget"
        action="Log weight"
        onAction={onWeighIn}
      />
    );
  }
  return (
    <EmptyLine
      words={`Add your details${hasWeighIn ? '' : ' and log your weight'} to see your calorie budget`}
      action="Profile"
      onAction={onProfile}
    />
  );
}

/** Today's weigh-in, as the day card's last row. */
function WeightRow({ weighIn, onLog }: { weighIn?: WeighIn; onLog: () => void }) {
  return (
    <View>
      <View className="border-t border-line" />
      <View className="flex-row flex-wrap items-center justify-between gap-x-grid-2 pt-grid-1">
        {weighIn ? (
          <>
            <View
              accessible
              accessibilityLabel={`Weight today, ${spokenKg(weighIn.kg)}`}
              className="min-w-name flex-1 flex-row flex-wrap items-baseline justify-between gap-x-grid-2"
            >
              <Text className="font-language text-body text-ink">Weight</Text>
              <Text className={`text-body ${FIGURE_SET.weighed}`}>{kg(weighIn.kg)}</Text>
            </View>
            <TextAction label="Edit" spoken="Edit today’s weight" onPress={onLog} />
          </>
        ) : (
          <>
            <Text className="font-language text-body text-ink-mid">No weight logged today</Text>
            <TextAction label="Log weight" onPress={onLog} />
          </>
        )}
      </View>
    </View>
  );
}

function DayHeading({ day, count, totals }: { day: string; count: number; totals: DayTotals }) {
  const { count: entries, calories, caloriesKind, spoken } = tallyWords(count, totals);
  return (
    <View className="flex-row flex-wrap items-baseline justify-between gap-x-grid-2 pt-grid-1">
      <Text accessibilityRole="header" className="font-language-bold text-body text-ink">
        {`Today · ${dayWords(day)}`}
      </Text>
      <Text accessibilityLabel={spoken} className="font-language text-label text-ink-mid">
        {`${entries} · `}
        <Text className={FIGURE_SET[caloriesKind]}>{calories}</Text>
      </Text>
    </View>
  );
}

/** How many entries are shown before the rest are asked for. */
const LAST = 3;

export default function Today() {
  const router = useRouter();
  const store = useEntryStore();
  const day = useToday();
  const list = useCallback(() => store.listOn(day), [store, day]);
  const { found, readAgain } = useReading(list);
  const { weighIns, readAgain: readWeighInsAgain } = useWeighIns();
  const { profile } = useProfile();
  const reviewStore = useReviewStore();
  const listReviews = useCallback(() => reviewStore.list(), [reviewStore]);
  const { found: reviews } = useReading(listReviews);
  // The review this day is held to: the latest dated on or before it.
  const heldTo = Array.isArray(reviews) ? reviewFor(reviews, day) : undefined;
  const weighedToday = Array.isArray(weighIns) ? weighInOn(weighIns, day) : undefined;
  // An entry can be written after the user has come here from its form.
  const [logged] = useLogged();
  const navigation = useNavigation();
  const readIt = useEffectEvent(() => {
    if (navigation.isFocused()) void readAgain();
  });
  useEffect(() => {
    if (logged) readIt();
  }, [logged]);
  const deletion = useDelete<LoggedEntry>({
    title: 'Delete this entry?',
    message: (entry) =>
      `${shownName(entry.name)}, ${entryFigures(entry).shown} will be removed, and that day’s totals re-derive without it.`,
    remove: ({ id }) => store.delete(id),
    failed: 'Could not delete entry',
    onDeleted: readAgain,
  });
  const listed = Array.isArray(found) ? found : [];
  const totals = totalsOf(listed);
  // The day all of which was asked for, and no other day.
  const [allOf, setAllOf] = useState<string>();
  const all = allOf === day;
  const setAll = (asked: boolean) => setAllOf(asked ? day : undefined);
  const shown = all ? listed : listed.slice(-LAST);
  const asksForRest = listed.length > LAST;
  const faultInView = useFailedInView(shown, deletion.fault);
  const weightRow =
    weighIns === 'unreadable' ? (
      <Unreadable words="Couldn’t load your weight" onRetry={readWeighInsAgain} />
    ) : Array.isArray(weighIns) ? (
      <WeightRow weighIn={weighedToday} onLog={() => router.navigate('/log-weight')} />
    ) : null;
  return (
    <FlatList
      {...faultInView.list}
      // iOS's large title follows the scroll only with the insets its bars ask for.
      contentInsetAdjustmentBehavior="automatic"
      data={shown}
      ListFooterComponent={
        asksForRest ? (
          <CardSlice first={false} last>
            <Hairline />
            <ShowAll
              label={all ? 'Show less' : `Show all ${listed.length}`}
              opens={all ? 'up' : 'down'}
              onPress={() => setAll(!all)}
            />
          </CardSlice>
        ) : undefined
      }
      keyExtractor={({ id }) => String(id)}
      renderItem={({ item, index }) => {
        const name = shownName(item.name);
        const words = entryWords(name, item);
        return (
          <CardSlice first={index === 0} last={index === shown.length - 1 && !asksForRest}>
            <DeletableRow
              ref={item.id === deletion.fault?.id ? faultInView.row : undefined}
              onDelete={() => void deletion.begin(item)}
              fault={item.id === deletion.fault?.id ? deletion.fault.why : undefined}
            >
              <Row name={name} {...words} onDelete={() => void deletion.begin(item)} />
            </DeletableRow>
          </CardSlice>
        );
      }}
      contentContainerClassName="px-page py-grid-2"
      ItemSeparatorComponent={Hairline}
      ListEmptyComponent={
        Array.isArray(found) ? (
          <EmptyLine
            words="Log a weighed food, or an estimate."
            action="Log"
            onAction={() => router.navigate('/log')}
          />
        ) : undefined
      }
      ListHeaderComponent={
        <View className="gap-grid-2 pb-grid-1">
          {found === 'unreadable' ? (
            <Unreadable words="Couldn’t load today’s summary" onRetry={readAgain} />
          ) : null}
          {Array.isArray(profile) && Array.isArray(weighIns) ? (
            <SetupLine
              missing={missingForSetup(profile[0], weighIns)}
              onProfile={() => router.navigate('/profile')}
              onWeighIn={() => router.navigate('/log-weight')}
            />
          ) : null}
          {Array.isArray(found) && heldTo ? (
            <RingCard totals={totals} count={listed.length} review={heldTo}>
              {weightRow}
            </RingCard>
          ) : Array.isArray(found) ? (
            <Totals totals={totals} count={listed.length}>
              {weightRow}
            </Totals>
          ) : null}
          {listed.length > 0 ? (
            <DayHeading day={day} count={listed.length} totals={totals} />
          ) : null}
        </View>
      }
    />
  );
}
