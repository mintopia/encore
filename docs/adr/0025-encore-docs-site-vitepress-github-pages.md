# Public docs site is "Encore", built with VitePress on GitHub Pages

The project gets a public name, **Encore**, and a user-facing docs site. The site leads with
setting up on a Raspberry Pi, and covers the Spotify integration, features, Snapcast,
sending to an external Snapserver, and the advanced integrations (relay, Pusher/Reverb,
webhooks, control WebSocket). The repository, npm package and image are renamed to match:
`mintopia/encore`, `@mintopia/encore` (bin `encore`) and `ghcr.io/mintopia/encore`.

The site is a VitePress project in `site/` with its own `package.json` and lockfile. It's
built and deployed to GitHub Pages by `.github/workflows/docs.yml` on pushes to `develop`
that touch `site/**`. The theme reuses the `DESIGN.md` tokens (teal, Instrument Sans and
Space Grotesk), so it matches the console.

## Considered Options

- **VitePress** (chosen): Markdown-first and Vue-based, like the console (ADR-0014), with
  built-in local search. A static build fits Pages.
- **Docusaurus / MkDocs Material**: both capable, but they'd bring in React or a Python
  toolchain for no gain.
- **README only**: it can't hold step-by-step Pi guides, screenshots and advanced
  references without becoming unwieldy.
- **Docs deps in the root `package.json`**: rejected. VitePress pins its own Vite major,
  which would clash with the console's Vite. A separate package keeps the app's dependency
  tree and CI untouched.

## Consequences

- GitHub Pages is set to "GitHub Actions" as its source and served on the custom domain
  `pimusic.stream`, so the site's `base` is `/`. Set `DOCS_BASE` if it ever moves to a
  project path such as `/encore/`.
- Screenshots are copied into `site/public/screenshots/` from `docs/screenshots/`, and
  need refreshing when the UI changes.
