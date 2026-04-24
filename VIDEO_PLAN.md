# Video Sourcing Plan — getting to 1,000 lessons

The honest answer up front: **this is a weeks-long curation project, not a button click.** Below is the realistic path.

---

## Quick legal primer

You're charging ₹10 for access. That affects which sources you can legally use.

| Source | Can you embed? | Can you charge for a site that embeds it? |
|---|---|---|
| Regular YouTube video | ✅ (YouTube ToS explicitly allows iframe embed) | ✅ *usually* — you're charging for curation, not for the video itself. Creator still gets ad revenue. |
| YouTube video marked "do not embed" by creator | ❌ | ❌ |
| Khan Academy, MIT OCW, Crash Course | ✅ | ❌ — CC-BY-**NC** (NonCommercial). Monetizing violates license. |
| TED Talks | ✅ via their embed | ⚠️ CC-BY-NC-ND. Keep those courses free. |
| Public domain (NASA, US federal) | ✅ | ✅ |
| CC-BY videos | ✅ | ✅ (attribution required) |
| Your own recordings | ✅ | ✅ |
| Scraped / ripped videos | ❌ | ❌ (piracy) |

**The defensible model:** most lessons are YouTube embeds (free content, creator keeps ad revenue), but your paid value-add is the **curation, ordering, notes, quizzes, and community**. This is how Brilliant, Scrimba's free tracks, and most boot-camp aggregators operate.

If in doubt, keep that specific course free and put paid originals behind the ₹10 wall.

---

## The 1,000-lesson playbook

### Step 1: Google Sheet template (5 min)

Copy this header into a new Google Sheet:

```
course_slug | title | video_url | position | duration_seconds | is_preview
```

### Step 2: Pick high-signal channels for each category (30 min)

You only need 2–4 channels per category to hit hundreds of videos. Here's a realistic starting map — **you verify each one yourself**, don't trust me on video IDs:

| Category | Channels to mine |
|---|---|
| Maths | 3Blue1Brown, Mathologer, Numberphile, Professor Leonard |
| AI | Andrej Karpathy, Two Minute Papers, Yannic Kilcher, 3Blue1Brown's NN series |
| Python | Corey Schafer, Real Python, mCoding, ArjanCodes |
| Java | Coding with John, Amigoscode, Telusko, Java Brains |
| Web Dev | Fireship, Web Dev Simplified, Traversy Media, Theo — t3.gg |
| Design | Flux Academy, DesignCourse, Malewicz, Figma's own channel |
| Productivity | Ali Abdaal, Cal Newport's interviews, Thomas Frank |
| Business | Indie Hackers, Starter Story, Y Combinator |

### Step 3: Harvest (the grind)

For each channel:
1. Open their Videos tab.
2. Copy video URL + title into your sheet.
3. Assign `course_slug`, `position`, `duration_seconds` (YouTube shows it), `is_preview` (set true for lesson 1 of each course).
4. **Pace: 3–5 videos/minute once warmed up → 200/hour.** 1,000 videos = one focused afternoon.

Tools that speed this up:
- **yt-dlp** (CLI): `yt-dlp --flat-playlist --print "%(title)s,%(id)s,%(duration)s" "https://youtube.com/@channelhandle/videos"` dumps an entire channel's catalogue as CSV in 10 seconds.
- **YouTube Data API v3**: free quota of 10,000 units/day. Fetches durations + titles for thousands of videos programmatically.

### Step 4: Import

In Knowall: sign in as admin → `/admin` → scroll to **"Bulk import lessons"** → paste the sheet → click Import.

500 rows imports in ~5 seconds. Errors are shown per-row so you can fix and re-run.

### Step 5: Fix structure

Run this SQL to see where your courses are thin or heavy:

```sql
SELECT c.slug, COUNT(l.id) AS lessons, SUM(l.duration_seconds)/60 AS total_min
FROM courses c LEFT JOIN lessons l ON l.course_id = c.id
GROUP BY c.slug ORDER BY lessons DESC;
```

---

## Realistic timeline to 1,000 videos

| Day | Work | Cumulative videos |
|---|---|---|
| 1 | Expand catalogue to ~60 courses via admin UI | 0 |
| 2 | Learn yt-dlp, harvest 5 channels | ~300 |
| 3 | Harvest 5 more channels + import | ~700 |
| 4 | Fix durations, re-order, remove dead videos | ~1,000 |
| 5 | Add free-preview flag to lesson 1 of each course | done |

---

## What I would NOT recommend

- **Scraping and re-hosting YouTube videos** — piracy, instant legal exposure, and probably DMCA'd within a week.
- **Auto-generating video IDs with an LLM** — half will be dead links, half will be random music videos.
- **Buying a "course bundle" off an iffy marketplace** — usually pirated, same problem.
- **Paying for AI-generated lecture avatars** until you know students want it. Test with real videos first.

---

## When you have AWS set up

For courses that ARE originally yours (recorded by you, licensed, or commissioned), upload to S3 via the admin panel — those play through CloudFront signed URLs and cannot be embedded elsewhere. Mix YouTube embeds (free content) with S3 originals (paid value-add) in the same course. The player handles both automatically.
