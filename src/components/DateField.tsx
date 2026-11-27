import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { FieldFrame } from './FieldFrame';
import { FAULT_SIGN } from './signs';
import { Text } from './Text';
import { useRipple } from './useRipple';
import { useTint } from './useTint';

/**
 * A date is a day, not a moment, so it is held at midnight in UTC, and the pickers and the words read
 * it there. One at midnight on the phone was said a day early once the phone was moved east with the
 * app open: what the app had made kept the zone it started in, and the picker took the new one.
 */
const ZONE = 'UTC';

/** A date as `2026-11-24` at midnight in UTC. */
const asDate = (date: string) =>
  new Date(
    Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10))),
  );

/** The day the system's picker chose, as `2026-11-24`, read in UTC as it was given. */
const asDay = (date: Date) =>
  [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()]
    .map((part, i) => String(part).padStart(i === 0 ? 4 : 2, '0'))
    .join('-');

/** One for every date: a formatter is slow to make. */
const DATE_WORDS = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: ZONE,
});

/** A date as `2026-11-24` in words, `24 Nov 2026`. */
export const dateWords = (date: string) => DATE_WORDS.format(asDate(date));

/**
 * A date chosen with the system's own picker, from a field that says it or that none is chosen yet:
 * Android's dialog, and on iOS the wheels opened under the field. A date is chosen only once one is
 * set or turned to: opening the wheels to look chooses none. The picker offers only the dates the
 * form would take.
 */
export function DateField({
  label,
  value,
  onChange,
  starts,
  earliest,
  before,
  fault,
}: {
  label: string;
  /** `''` until one is chosen. */
  value: string;
  onChange: (date: string) => void;
  /** Where the picker stands before a date is chosen. */
  starts: string;
  /** The first date the picker offers. */
  earliest: string;
  /** The picker offers only dates before this one. */
  before: string;
  /** Why the date will not do, said under the label. */
  fault?: string;
}) {
  const ripple = useRipple('page');
  const tint = useTint();
  const [open, setOpen] = useState(false);
  const shown = value === '' ? undefined : dateWords(value);
  const end = asDate(before);
  const picker = {
    timeZoneName: ZONE,
    minimumDate: asDate(earliest),
    maximumDate: new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() - 1)),
  };
  const choose = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        ...picker,
        value: asDate(value || starts),
        mode: 'date',
        onChange: ({ type }, date) => {
          if (type === 'set' && date) onChange(asDay(date));
        },
      });
      return;
    }
    setOpen(!open);
  };
  return (
    <FieldFrame label={label} fault={fault}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${shown ?? 'Choose a date'}`}
        accessibilityHint={fault}
        onPress={choose}
        android_ripple={ripple}
        className={`min-h-target min-w-target justify-center overflow-hidden rounded-2xl px-3 ios:active:opacity-60 ${fault ? 'border-2 border-fault bg-fault/10' : 'border border-edge bg-surface-lift'}`}
      >
        {shown ? (
          <Text className="font-language text-body text-ink">{shown}</Text>
        ) : (
          <Text className="font-language text-body text-ink-mid">Choose a date</Text>
        )}
        {/* A field at fault carries the sign at its end, as a text field does: the hue is never alone. */}
        {fault ? (
          <View pointerEvents="none" className="absolute right-3">
            <SymbolView name={FAULT_SIGN} size={20} tintColor={tint.fault} />
          </View>
        ) : null}
      </Pressable>
      {open ? (
        <DateTimePicker
          {...picker}
          accessibilityLabel={label}
          value={asDate(value || starts)}
          mode="date"
          display="spinner"
          onValueChange={(_, date) => onChange(asDay(date))}
        />
      ) : null}
    </FieldFrame>
  );
}
