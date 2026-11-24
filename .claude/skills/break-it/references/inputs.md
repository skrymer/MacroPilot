# Input shapes

Aim a shape at a risk. A value that looks like the fixtures is not a probe.

| Field | Shapes |
| --- | --- |
| **Grams, macros, kcal** | empty, `0`, `0.0`, `0.001`, `-1`, `.5`, `5.`, `1,5` (a comma, as many keyboards give), `1e3`, `99999999`, `00012`, spaces around, pasted text, `NaN` |
| **A figure that may be unstated** | blank against `0`: they mean different things and must read differently |
| **Macros together** | more than 100 g in 100 g, exactly 100, all zero |
| **ABV** | `0`, `100`, `100.1`, `0.05` |
| **Weight** | `0`, `20`, `400`, `83.45`, a comma |
| **Name** | empty, spaces only, 1 character, 300 characters, one 80-character word, emoji, right-to-left, a quote and an apostrophe, `%` and `_`, `<b>`, a line break, the same name twice, the same name in another case |
| **Search** | the above, and accents typed without them |
| **Date** | today, yesterday, tomorrow, the day after, 29 February, the day before the first entry |
| **Barcode** | empty, 7, 8, 12, 13 and 14 digits, letters, a bad check digit |

Drive one boundary through the real keyboard rather than `fill`: keystroke and focus timing is where some bugs live. Read the field back after typing.
