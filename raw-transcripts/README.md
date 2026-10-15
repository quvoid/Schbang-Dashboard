# Raw transcripts

Whisper "small" (int8, run locally) transcripts of every distinct ad video, per brand.

- `<brand>_transcripts.csv` – one row per video: Library IDs, Ad Library link, creator (partnership ads), first started, length, language, full transcript and a timestamped version.
- `<brand>_transcripts.json` – the same plus segment-level timestamps (`start`, `end` in seconds).

Coverage: Palmonas and GIVA = ads running 1 Sep – 13 Oct 2026; The Amethyst Store = all ads live on 14 Oct 2026.
`Video` (V001…) matches the files in each brand's local `<Brand> Videos/` folder. Hindi, Tamil, Telugu, Kannada and Malayalam are kept as heard; brand and place names can be misheard.
