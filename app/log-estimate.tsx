import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { estimateForm } from '@/components/estimateForm';
import { formFault } from '@/components/formFault';
import { FormField } from '@/components/FormField';
import { FormPage } from '@/components/FormPage';
import { OverLine } from '@/components/OverLine';
import { useFirstFault } from '@/components/useFirstFault';
import { useLogEntry } from '@/components/useLogEntry';
import { useOverLine } from '@/components/useOverLine';
import { estimatedEntry } from '@/domain/entry';

export default function LogEstimate() {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitted },
  } = useForm({
    mode: 'onTouched',
    resolver: zodResolver(estimateForm),
    defaultValues: { label: '', calories: '', protein: '' },
  });
  const { scroll, onLayoutOf, show } = useFirstFault(['label', 'calories', 'protein']);
  const { log, leave } = useLogEntry({
    form: { handleSubmit, setError },
    entryOn: (estimate, day) => ({ name: estimate.label, entry: estimatedEntry(estimate, day) }),
    onRefused: show,
  });
  const typed = estimateForm.shape.calories.safeParse(useWatch({ control, name: 'calories' }));
  const line = useOverLine(() => (typed.success ? typed.data : undefined));
  return (
    <FormPage
      title="Log an estimate"
      onCancel={leave}
      fault={formFault({ errors, isSubmitted })}
      line={line ? <OverLine {...line} /> : undefined}
      action="Log estimated entry"
      onAction={log}
      scroll={scroll}
    >
      <View onLayout={onLayoutOf('label')}>
        <FormField
          control={control}
          name="label"
          label="Label"
          placeholder="e.g. Lunch at restaurant"
        />
      </View>
      <View onLayout={onLayoutOf('calories')}>
        <FormField control={control} name="calories" label="Calories" keyboardType="decimal-pad" />
      </View>
      <View onLayout={onLayoutOf('protein')}>
        <FormField
          control={control}
          name="protein"
          label="Protein (optional)"
          keyboardType="decimal-pad"
        />
      </View>
    </FormPage>
  );
}
