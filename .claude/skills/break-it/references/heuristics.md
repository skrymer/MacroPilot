# Heuristics: attacks for exploratory charters on Android

Charters take their attacks from these families. [drive-emulator](../../drive-emulator/SKILL.md) has the command for each move. [inputs.md](inputs.md) owns the input shapes.

## Interrupt

- Kill the app while a save is in flight, then reopen: is the row there once, whole, or not at all?
- Home, wait, return: mid-form, mid-sheet, mid-scan. Is typed input still there?
- Back mid-flow, and back with the keyboard open: the first back should close the keyboard, not the sheet.
- Press the committing control twice in quick succession. Two rows?
- Rotate, or change the appearance or text size, with a form half filled.
- An incoming call over a form.

## Time

- Log just before local midnight and just after. Which day holds it?
- A phone far east and far west of UTC, where the UTC day and the local day differ.
- The two summer-time changes, when a day is 23 or 25 hours long.
- Leave the screen open across midnight: does "today" move?
- Set the clock back a day after logging. Forward a year.

## Sequence

- Steps out of order: confirm before choosing, the second screen by deep link, cold.
- Repeat a one-time action: delete twice, save the same edit twice.
- Act on a row that another screen has since deleted or changed.
- The first run: no profile, no foods, no entries. Then the last one deleted.

## Permission

- Refuse it, then try again. Refuse for good. Revoke it in settings while the app is open.

## Network

- Airplane mode before the action, and during it. Then back on: does it recover without a relaunch?
- A slow link: act again while the first request hangs.
- Everything that is not a product lookup must work with no network at all.

## Hostile data

- The shapes in [inputs.md](inputs.md), aimed at a risk: a name that breaks a row on another screen, a figure that breaks a total.
- Absence: a food with each optional figure missing in turn, and with each at a stated zero. The two must not read alike.
- Many: hundreds of rows, a day with fifty entries.

## Device

- On an epic only: the largest text size and the largest display size. Does anything clip, overlap or become unreachable?
- Both appearances: is anything unreadable in one?
- The keyboard over the field being typed in, its label or its fault, or over the button that commits it: first and last field at fault, a second refusal, a focus move that changes the keyboard's kind.
- The smallest supported screen.

## Around the change

- Every other screen that shows what the changed code writes.
- Every other caller of a function the diff changed.
- The states a changed conditional now reaches: its other branch, its empty case, its error case.
