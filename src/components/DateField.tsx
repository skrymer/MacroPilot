import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable } from 'react-native';

import { FieldFrame } from './FieldFrame';
import { Text } from './Text';
import { useRipple } from './useRipple';

/** A date as `2026-11-24` at midnight on the phone, which is how the system's picker takes one. */
const asDate = (date: string) =>
  new Date(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)));

/** The day the system's picker chose, as `2026-11-24`, on the phone's own calendar. */
const asDay = (date: Date) =>
  [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part, i) => String(part).padStart(i === 0 ? 4 : 2, '0'))
    .join('-');

/** One for every date: a formatter is slow to make. */
const DATE_WORDS = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** A date as `2026-11-24` in words, `24 November 2026`. */
export const dateWords = (date: string) => DATE_WORDS.format(asDate(date));

/**
 * A date chosen with the system's own picker, from a field that says it or that none is chosen yet:
 * Android's dialog, and on iOS the wheels opened under the field, which choose the day they start on
 * as they open, as the Health app's do.
 */
export function DateField({
  label,
  value,
  onChange,
  starts,
  fault,
}: {
  label: string;
  /** `''` until one is chosen. */
  value: string;
  onChange: (date: string) => void;
  /** Where the picker stands before a date is chosen. */
  starts: string;
  /** Why the date will not do, said under the label. */
  fault?: string;
}) {
  const ripple = useRipple('page');
  const [open, setOpen] = useState(false);
  const shown = value === '' ? undefined : dateWords(value);
  const choose = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: asDate(value || starts),
        mode: 'date',
        onChange: ({ type }, date) => {
          if (type === 'set' && date) onChange(asDay(date));
        },
      });
      return;
    }
    if (value === '') onChange(starts);
    setOpen(!open);
  };
  return (
    <FieldFrame label={label} fault={fault}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${shown ?? 'not chosen'}`}
        accessibilityHint={fault}
        onPress={choose}
        android_ripple={ripple}
        className={`min-h-target min-w-target justify-center overflow-hidden rounded-2xl px-3 ios:active:opacity-60 ${fault ? 'border-2 border-fault bg-fault/10' : 'border border-edge bg-surface-lift'}`}
      >
        {shown ? (
          <Text className="font-language text-body text-ink">{shown}</Text>
        ) : (
          <Text className="font-language-italic text-body text-ink-dim">Not chosen</Text>
        )}
      </Pressable>
      {/* The press that opens it chooses a date, so it is never open on none; the check keeps the
          picker from being handed an invalid date should that change. */}
      {open && value !== '' ? (
        <DateTimePicker
          accessibilityLabel={label}
          value={asDate(value)}
          mode="date"
          display="spinner"
          onChange={(_, date) => {
            if (date) onChange(asDay(date));
          }}
        />
      ) : null}
    </FieldFrame>
  );
}
