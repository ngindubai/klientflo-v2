# KlientFlo landing page

Standalone, one-page marketing website. This folder is independent of the Next.js application at the repository root.

Live site: https://mediumblue-gerbil-513490.hostingersite.com/

## Local preview

From the repository root:

```sh
python3 -m http.server 4174 --directory landing-page/dist --bind 127.0.0.1
```

Open http://127.0.0.1:4174/ . No build or package installation is required for the landing page.

## Deployment

Upload the contents of `dist/` to the Hostinger website, with `index.html` at the archive root. The app's Render deployment is configured separately; this folder does not change its routes or deployment settings.

## Included

- Original KlientFlo hero with email field, animated wordmark and floating cards.
- Standalone six-step product tour below the hero.
- Five compact feature stories with subtle animation and reduced-motion support.
- Red problem comparison, loading intro and signup popup on every page load.
- Sample reply polishing and property brochure preview.

Email forms are design-only: addresses are never saved or transmitted. Product screens use sample data and do not call or modify the KlientFlo app.

Validation: JavaScript syntax, local assets and anchors; desktop and mobile layouts; six tour stages; keyboard navigation; popup, brochure and motion controls. The deployed HTML, CSS and JavaScript match this source.
