# release-please manages versions and releases

Versions, tags, GitHub releases and the changelog are managed by
[release-please](https://github.com/googleapis/release-please) instead of hand-pushed tags.
This amends ADR-0005, where publishing fired on a manually pushed `vX.Y.Z` tag.

`.github/workflows/release.yml` runs on every push to `main`. release-please reads the
Conventional Commit history (`feat:`, `fix:`, `feat!:` and so on) and keeps a release PR open
that bumps `package.json`, `.release-please-manifest.json` and `CHANGELOG.md`. Merging that
PR makes release-please tag `vX.Y.Z` and create the GitHub release. In the same run, the
`checks`, `npm` and `docker` jobs then build from that tag and publish `@mintopia/encore` to
npm (trusted publishing over OIDC) and the multi-arch image to `ghcr.io/<owner>/<repo>`.
`publish.yml` is removed.

Configuration lives in `release-please-config.json` (release type `node`, tags without a
component prefix, so `v2.1.0` rather than `encore-v2.1.0`).

## Considered Options

- **Keep tag-triggered `publish.yml` and let release-please only tag**: rejected. Tags
  created with the workflow's `GITHUB_TOKEN` don't trigger other workflows, so the publish
  would never run without a personal access token.
- **Single workflow, publishing gated on `release_created`** (chosen): no extra secrets are required.
  npm trusted publishing is configured against `release.yml`.
- **Manual tags (status quo)**: rejected. It gives no changelog, and the version in
  `package.json` drifts from the tag (it was set with `npm version` at publish time).

## Consequences

- Releases come from `main`. `develop` merges into `main` as before, and the release PR
  targets `main`. After a release, the `merge-back` job merges `main` into `develop` (a
  no-ff merge commit) so the version bump and changelog reach `develop`. A merge conflict
  fails the job and needs resolving by hand.
- The workflow uses a `RELEASE_PLEASE_TOKEN` secret (a fine-grained PAT with contents and
  pull-requests write on this repo) when it's set, and falls back to `GITHUB_TOKEN`. With the
  PAT, release PRs trigger CI, and the merge-back push can satisfy branch protection on
  `develop` if the PAT's owner is allowed to bypass it.
- Commit messages drive version bumps, so Conventional Commits are now load-bearing.
  Breaking changes need `!` or a `BREAKING CHANGE:` footer. A specific version can be forced
  with a `Release-As: x.y.z` commit footer.
- The repository setting "Allow GitHub Actions to create and approve pull requests" is on,
  which the `GITHUB_TOKEN` fallback needs. Release PRs opened with `GITHUB_TOKEN` don't
  trigger CI on their own.
- `CHANGELOG.md` is reintroduced and maintained automatically.
