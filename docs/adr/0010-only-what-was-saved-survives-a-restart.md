# Only what was saved survives a restart

Android can end the app's screen without the user asking. A change to the system's text size recreates the activity, and a phone short of memory kills a process in the background. Either way the app comes back with its screens rebuilt from nothing. iOS kills background processes too. What the user was looking at, and what they had half typed, has to be kept on purpose or is lost.

## The decision

**After a restart of the activity or the process, the app opens on Today, with what was saved and nothing else.** The screen that was open, its scroll position and a half-filled form are gone. An entry or a food that was saved is there.

**Leaving the app and coming back is not a restart.** While the process and the activity live, the screen and the form are as they were left.

**A text-size change keeps recreating the activity.** The manifest does not claim to handle `fontScale`.

## Why

- **Little is lost.** Logging an entry is one to three fields. The longest form is a food's, a name and five figures.
- **A restored form is a risk of its own.** A form left open last night and brought back this morning can log onto the wrong day, and the user did not ask to see it again. A form that opens fresh opens on the day it is.
- **Restoring costs every form to come.** It needs saved navigation state and a draft per form, each with its own rule for when it goes stale, and a kill-and-reopen check on every form after that.

## Alternatives rejected

- **Declaring `fontScale` in the activity's `configChanges`.** It was built and measured on the emulator (API 36, React Native 0.88.1). The activity, the place and the typed text survived, and the text on screen did not change size, which [`0007`](./0007-figures-are-fixed-size-and-text-scales-to-double.md) does not allow. JavaScript is not told of the change, so it cannot redraw.
- **A draft for the Add food form alone**, the longest one. It is the form where a loss is felt most, and still one form's worth of retyping against a mechanism to keep.
- **Restoring the screen without the form.** It returns the user to a place whose content they have to start again.

## Consequences

- Changing the text size with a form open loses what was typed. It is the accepted cost.
- Today must be a sound place to land from anywhere, because it is where every restart lands.
- A later form long enough that losing it hurts (a recipe, with its weighed ingredients) reopens this decision for itself.
