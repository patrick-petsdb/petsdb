# PetsDB · Pets Deserve Better

A web app for iPhone and iPad to keep cat and dog records (breed, medical history, treatments, weight charts and more), organised around the **Five Domains Model** of animal welfare (Mellor & Reid, 1994; updated 2020).

The app is bilingual: **English / 繁體中文**. You can switch language from the top bar, the iPad sidebar or Settings.

**Live app:** https://patrick-petsdb.github.io/petsdb/ (open it in Safari on your iPhone or iPad → Share → Add to Home Screen)

## How the Five Domains shape the app

Each pet's page is a hub of five domain tiles. Each tile opens a page with records, charts and education for that domain.

| Domain | What you can do in PetsDB |
|---|---|
| 1 · Nutrition 營養 | Weight chart with ideal-range band, body condition score (1–9), feeding plan, daily energy (RER/MER) estimate |
| 2 · Physical Environment 物理環境 | Species-specific home checklist (cats follow the AAFP/ISFM feline environment guidelines), living situation |
| 3 · Health 健康 | Medical history, treatment records (vaccines, parasite control, medication…), due-date reminders with one-tap "mark as done" |
| 4 · Behavioural Interactions 行為互動 | Activity log, 14-day activity chart, balance of interactions with the environment, other animals and people (2020 model) |
| 5 · Mental State 精神狀態 | Welfare checks (25 statements, radar chart, trend over time, tailored suggestions), daily mood diary |

Every domain page also shows its negative and positive experiences plus cat and dog tips. The **Learn** tab explains the model: overview diagram, history, each domain in depth, Five Freedoms vs Five Domains, positive welfare and references.

**Welfare check scoring:** each statement is rated 1–5, and each domain gets a score from 0 to 100. Following the model, **Domain 5 (Mental State) is shown as the overall welfare outcome**. Domains 1–4 are the factors that shape it.

## Run it on your Mac

```bash
node dev-server.js
```

Then open http://localhost:8642. Tap **"Explore with sample pets"** to see two example pets (Mochi the cat and Lucky the dog) with a year of records.

### Try it on your iPhone or iPad (same Wi‑Fi)

```bash
node dev-server.js --lan
```

Open the printed `http://192.168.x.x:8642` address in Safari on the device. Over plain `http` the app works fully, but offline caching is disabled. Offline caching needs HTTPS (see below).

## Hosting (GitHub Pages)

PetsDB is a static site, so there is no server or database to run. It is hosted on GitHub Pages from the repo [patrick-petsdb/petsdb](https://github.com/patrick-petsdb/petsdb).

The site is served from the **`gh-pages`** branch, which holds a copy of the `app/` folder. The `main` branch holds the full project.

**To publish an update**, commit your changes on `main`, then run:

```bash
git push origin main && git subtree push --prefix app origin gh-pages
```

GitHub usually republishes within a minute or two. You can follow it on the repo's **Actions** tab ("pages build and deployment").

When you publish an update, also change `VERSION` at the top of `app/sw.js` so installed copies on phones fetch the new files instead of keeping old cached ones.

On the iPhone or iPad: open the site in Safari → **Share** → **Add to Home Screen**. PetsDB then opens full screen with its own icon and works offline.

## Your data

- All records are stored **only on the device**, in the browser's IndexedDB. Nothing is uploaded.
- **Settings → Export backup** saves a `.json` file (via the share sheet on iOS). **Import backup** restores it, which is also how you move data between devices.
- Safari can clear storage for websites that haven't been used for a while. Installing to the Home Screen and exporting backups regularly avoids losing data.

## Project structure

```
app/
  index.html             App shell (iOS web-app meta tags, manifest, icons)
  manifest.webmanifest   PWA manifest
  sw.js                  Service worker (offline support)
  css/styles.css         Styles: iPhone tab bar, iPad sidebar, dark mode
  js/i18n.js             Interface text (en / zh)
  js/content.js          Five Domains content, breeds, checklists, welfare statements, Learn topics (en / zh)
  js/charts.js           Small SVG charts (line, radar, bar) with no dependencies
  js/app.js              App logic: storage, routing, screens, forms
  icons/, assets/        Your PetsDB logo and app icons
dev-server.js            Local test server
```

To change wording, edit `js/i18n.js` (interface) or `js/content.js` (educational content). Every entry has an `en` and a `zh` version side by side.

## Disclaimer

PetsDB is for education and record-keeping. It does not replace professional veterinary advice.
