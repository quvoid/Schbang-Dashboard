Creator partnership ads dashboard (Palmonas + GIVA)
- Static site: index.html + data.js + media/ (89 videos at 540p + posters, ~258 MB).
- Preview locally:  python3 -m http.server 8765   then open http://localhost:8765
- Deploy to Vercel:  cd into this folder, run  npx vercel  (log in), then  npx vercel --prod
- Rebuild data/media after a new scrape:  python3 ../_shared/build_dashboard_data.py
