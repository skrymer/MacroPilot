import { lint } from './lint';

const SCREEN = 'app/add-food.tsx';

describe('forms/keyboard-avoided', () => {
  it.each([
    ['a field', `const c = <ScrollView><FormField name="fat" /></ScrollView>;`],
    [
      'a field deeper in it',
      `const c = <ScrollView><View><FormField name="fat" /></View></ScrollView>;`,
    ],
    [
      'a field, in one with no behavior, which avoids nothing',
      `const c = <KeyboardAvoidingView><ScrollView><FormField name="fat" /></ScrollView></KeyboardAvoidingView>;`,
    ],
    [
      'a field, beside one that does avoid it',
      `const c = <View><KeyboardAvoidingView /><ScrollView><FormField name="fat" /></ScrollView></View>;`,
    ],
    ['a page’s children, which can be fields', `const c = <ScrollView>{children}</ScrollView>;`],
  ])('reports a scroll view the keyboard can cover with %s', (_, code) => {
    // Given a form that scrolls, with nothing to make room for the keyboard
    const source = code;

    // When it is linted
    const reported = lint(source, SCREEN);

    // Then the rule reports it
    expect(reported).toContain('forms/keyboard-avoided');
  });

  it.each([
    [
      'a form inside one that does something',
      `const c = <KeyboardAvoidingView behavior="padding"><ScrollView><FormField name="fat" /></ScrollView></KeyboardAvoidingView>;`,
    ],
    ['a scroll view with no field in it', `const c = <ScrollView><Text>Foods</Text></ScrollView>;`],
    ['a field that does not scroll', `const c = <View><FormField name="grams" /></View>;`],
  ])('accepts %s', (_, code) => {
    // Given nothing a keyboard can cover for good
    const source = code;

    // When it is linted
    const reported = lint(source, SCREEN);

    // Then the rule is silent
    expect(reported).not.toContain('forms/keyboard-avoided');
  });
});

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
