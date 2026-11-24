# Where Android differs

| Rule | What differs | Check |
| --- | --- | --- |
| [48dp touch targets](https://developer.android.com/guide/topics/ui/accessibility/apps) | `min-h-target` is 44, iOS's floor. Android recommends 48; settle the token with the design system | Judgement |
| Edge-to-edge, enforced from Android 15 | Content draws behind the system bars and the gesture bar | `/verify` |
| Back gesture and predictive back | Back closes a sheet or leaves a screen, and must not lose typed input silently | Screen test and `/verify` |
| [Non-linear font scaling](https://developer.android.com/about/versions/14/features#non-linear-font-scaling) | The caps apply, but give different sizes | `/verify` at the largest size |
| Icons | SF Symbols do not exist | `/verify` |
