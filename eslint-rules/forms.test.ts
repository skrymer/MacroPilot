import { lint } from './lint';

const SCREEN = 'app/add-food.tsx';

describe('forms/no-watch', () => {
  it.each([
    ['a form’s watch called', `const form = useForm(); const name = form.watch('name');`],
    ['watch taken from a form', `const { control, watch } = useForm();`],
    ['watch taken from a form made above', `const form = useForm(); const { watch } = form;`],
    ['watch renamed as it is taken', `const { watch: live } = useForm();`],
    ['watch taken from the context’s form', `const { watch } = useFormContext();`],
  ])('reports %s', (_, code) => {
    // Given a screen reading a live value the React Compiler would keep from before
    const source = code;

    // When it is linted
    const reported = lint(source, SCREEN);

    // Then the rule reports it
    expect(reported).toContain('forms/no-watch');
  });

  it.each([
    ['useWatch', `const name = useWatch({ control, name: 'name' });`],
    ['the rest of a form', `const { control, handleSubmit } = useForm();`],
    ['a key of that name in something else', `const { watch } = settings;`],
  ])('accepts %s', (_, code) => {
    // Given a screen that reads no value through watch
    const source = code;

    // When it is linted
    const reported = lint(source, SCREEN);

    // Then the rule is silent
    expect(reported).not.toContain('forms/no-watch');
  });
});

describe('forms/no-coerced-number', () => {
  it.each([
    ['z.coerce.number()', `const s = z.coerce.number();`],
    ['it with limits on it', `const s = z.coerce.number().min(0).optional();`],
    ['coerce imported by name', `import { coerce } from 'zod'; const s = coerce.number();`],
    ['it by a computed name', `const s = z['coerce']['number']();`],
  ])('reports %s', (_, code) => {
    // Given a schema that runs a field's text through Number(), so that a blank is 0
    const source = code;

    // When it is linted
    const reported = lint(source, SCREEN);

    // Then the rule reports it
    expect(reported).toContain('forms/no-coerced-number');
  });

  it.each([
    ['a plain number', `const s = z.number();`],
    ['another coercion', `const s = z.coerce.date();`],
  ])('accepts %s', (_, code) => {
    // Given a schema that makes no figure of a blank
    const source = code;

    // When it is linted
    const reported = lint(source, SCREEN);

    // Then the rule is silent
    expect(reported).not.toContain('forms/no-coerced-number');
  });
});

describe('forms/first-fault-shown', () => {
  it('reports a form of several fields that neither brings its first fault into view nor says so', () => {
    // Given a form of more than one field, which can put a fault out of view
    const source = `const c = <><FormField name="label" /><FormField name="calories" /></>;`;

    // When it is linted
    const reported = lint(source, SCREEN);

    // Then the rule reports it
    expect(reported).toContain('forms/first-fault-shown');
  });

  it('accepts a form of several fields that does both', () => {
    // Given a form that brings its first fault into view and says so by its button
    const source = `const s = useFirstFault(['label']); const f = formFault(errors); const c = <><FormField name="label" /><FormField name="calories" /></>;`;

    // When it is linted
    const reported = lint(source, SCREEN);

    // Then the rule is silent
    expect(reported).not.toContain('forms/first-fault-shown');
  });

  it('reports fields mapped from a list, which are several though written once', () => {
    // Given fields made from a list, as Add food makes its six
    const source = `const c = F.map((n) => <FormField key={n} name={n} />);`;

    // When it is linted
    const reported = lint(source, SCREEN);

    // Then the rule reports it
    expect(reported).toContain('forms/first-fault-shown');
  });
});

describe('forms/form-page', () => {
  it('reports a form whose fields stand outside FormPage', () => {
    // Given a screen with a field and no FormPage, which keeps the keyboard off its button
    const source = `const c = <ScrollView><FormField name="grams" /></ScrollView>;`;

    // When it is linted
    const reported = lint(source, SCREEN);

    // Then the rule reports it
    expect(reported).toContain('forms/form-page');
  });

  it('accepts a form whose fields stand in FormPage', () => {
    // Given a screen with its field in FormPage
    const source = `const c = <FormPage title="Log entry"><FormField name="grams" /></FormPage>;`;

    // When it is linted
    const reported = lint(source, SCREEN);

    // Then the rule is silent
    expect(reported).not.toContain('forms/form-page');
  });

  it('reports a screen that keeps the keyboard off its own button, as FormPage does', () => {
    // Given a screen with its own keyboard avoidance, which misses where the page starts in its sheet
    const source = `const c = <KeyboardAvoidingView behavior="padding"><Text>Hi</Text></KeyboardAvoidingView>;`;

    // When it is linted
    const reported = lint(source, SCREEN);

    // Then the rule reports it
    expect(reported).toContain('forms/form-page');
  });

  it('accepts FormPage keeping the keyboard off its button', () => {
    // Given FormPage's own keyboard avoidance
    const source = `const c = <KeyboardAvoidingView behavior="padding"><Text>Hi</Text></KeyboardAvoidingView>;`;

    // When it is linted
    const reported = lint(source, 'src/components/FormPage.tsx');

    // Then the rule is silent
    expect(reported).not.toContain('forms/form-page');
  });

  it('accepts a test of the field itself, which is not a form', () => {
    // Given the field rendered alone in its own test
    const source = `const c = <FormField name="name" />;`;

    // When it is linted
    const reported = lint(source, 'src/components/FormField.test.tsx');

    // Then the rule is silent
    expect(reported).not.toContain('forms/form-page');
  });
});

describe('forms/on-touched', () => {
  it('reports a form judged only when it is sent', () => {
    // Given a form with React Hook Form's default mode, which shows a fault only after a refused save
    const source = `const form = useForm({ resolver, defaultValues });`;

    // When it is linted
    const reported = lint(source, SCREEN);

    // Then the rule reports it
    expect(reported).toContain('forms/on-touched');
  });

  it('accepts a form judged once a field is left', () => {
    // Given a form judged as each field is left, then as it is typed
    const source = `const form = useForm({ mode: 'onTouched', resolver, defaultValues });`;

    // When it is linted
    const reported = lint(source, SCREEN);

    // Then the rule is silent
    expect(reported).not.toContain('forms/on-touched');
  });
});
