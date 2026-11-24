# Forms are React Hook Form with Zod, and the domain still judges

The app is mostly forms: a food's macros, grams, a weight, a goal. Each field is text the user typed and a figure the domain needs, and the step between the two is where this app's worst error lives. **A blank field means the figure is not stated, and a `0` means it is none of it.** A form that turns the first into the second puts a false fact in the log, and nothing downstream can tell.

## The decision

**Forms are React Hook Form 7 with a Zod 4 schema**, joined by `@hookform/resolvers`. All three are JavaScript only, so they need no native build. They are installed by the first issue that has a form.

**A schema translates; the domain judges.** The schema turns text into values: `1.5` and `1,5` both, since many keyboards give a comma, and blank to *unstated*. Limits are domain constants the schema imports to word a message, so no rule is written twice. `src/domain/` does not import Zod, and a domain value still refuses to be constructed wrong, because a form is not the only way to make one.

**`z.coerce.number()` is refused by lint.** It runs the text through `Number()`, so `''` becomes `0`, and `.optional()` does not help because the coercion has already happened. The common workaround, mapping falsy input to `undefined`, is the same error the other way round: it loses a typed `0`. One shared translation from text to figure does it right, with its own tests.

**A form lives beside its screen; fields are one component.** `FormField` in `src/components/` joins RHF's `Controller` to our `Input`, with its label, its error text and what a screen reader announces. A screen never wires a field by hand.

**`watch()` is refused; `useWatch` reads a live value.** The React Compiler is on, and cannot safely memoise what `watch()` returns, so a screen showing it goes stale. React's own `react-hooks/incompatible-library` rule names it. Whether `Controller` and `formState` behave under the compiler is not documented by the library, so **the first form proves it**, in a compiled test and on the emulator. A fault there is settled in this record before a second form is built.

**Tests.** A schema is a translation and owns its own test ([`0001`](./0001-a-unit-owes-its-own-test-when-it-owns-something.md)). That a form works is a screen test. Every optional figure has a blank case and a zero case.

## Alternatives rejected

- **React state per field.** Enough for one field, and then validation, touched state and submit are written again in every form.
- **React Hook Form 8**, which is in beta. Nothing here needs it yet.
- **Zod in the domain.** It would make a schema the rule's home, and tie every rule to the shape of a form.

## Consequences

- A new figure field uses the shared translation, or it has reopened the blank-or-zero question.
- The two lint rules are written, test-first, with the first form.
