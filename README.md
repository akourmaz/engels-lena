# D - Babel style — prototype

Static landing prototype for **Engels met Lena** (business English, online + in-company Drenthe/Groningen).

## Status: PROTOTYPE — synthetic data
All facts are placeholders and marked `data-synthetic` in the HTML:
prices, photos, reviews, KvK/BTW numbers, Calendly link, domain.
The whole site is `noindex, nofollow` (meta + robots.txt) so it never gets indexed.
**Do not treat any number or testimonial here as real.**

## Deploy on Vercel
No build step — plain static HTML/CSS/JS.
1. Push this repo to GitHub.
2. Vercel -> Add New -> Project -> import this repo.
3. Framework preset: **Other**. Build command: none. Output directory: `./`
4. Deploy.
