# D - Babel style — production candidate

Static landing page for **Engels met Lena** (business English + correspondence,
online + in-company Drenthe/Groningen).

## Status: PRE-LAUNCH — real facts, prices still pending
Biography, methodology, contacts (Borger, WhatsApp) and process are real, taken
from Elena Hagenaar directly. Per-service prices are still being confirmed with
her, so the whole site stays `noindex, nofollow` (meta + robots.txt) until she
signs off. The booking form (`data-book-dialog` / `data-demo`) does not submit
anywhere yet — it's a working mockup of the flow, not a live lead pipe.

## Deploy on Vercel
No build step — plain static HTML/CSS/JS.
1. Push this repo to GitHub (already connected: github.com/akourmaz/engels-lena).
2. Vercel picks up pushes to `main` automatically.
3. Framework preset: **Other**. Build command: none. Output directory: `./`
