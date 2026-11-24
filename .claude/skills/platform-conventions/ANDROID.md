# Where Android differs

| Rule | What differs | Check |
| --- | --- | --- |
| [48dp touch targets](https://developer.android.com/guide/topics/ui/accessibility/apps) | The floor is 48 here and 44 on iOS, in the one `min-h-target` token (DESIGN.md). | `ad audit` |
| Edge-to-edge, enforced from Android 15 | Content draws behind the system bars and the gesture bar | `/verify` |
| Back gesture and predictive back | Back closes a sheet or leaves a screen, and asks before losing a full-height form's typed input; a sheet's goes without asking (DESIGN.md, *Asking and telling*) | Screen test and `/verify` |
| [Non-linear font scaling](https://developer.android.com/about/versions/14/features#non-linear-font-scaling) | The caps apply, but give different sizes | `/verify` at the largest size |
| Icons | SF Symbols do not exist | `/verify` |
