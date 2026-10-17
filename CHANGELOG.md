# Changelog

## [2.2.0](https://github.com/mintopia/encore/compare/v2.1.1...v2.2.0) (2026-10-17)


### Features

* admin-set Listener accent colour with picker and listener link ([#106](https://github.com/mintopia/encore/issues/106)) ([2053064](https://github.com/mintopia/encore/commit/205306437f772dcc578f10b73ec0c67a31395e4a))
* clean-room Snapcast client with Start/Stop on /listen ([#99](https://github.com/mintopia/encore/issues/99)) ([5e0b4f6](https://github.com/mintopia/encore/commit/5e0b4f62e169a825d658b6ba1a790affb7b07cd4))
* custom Listener display name and Settings &gt; Listener section ([#105](https://github.com/mintopia/encore/issues/105)) ([505c18b](https://github.com/mintopia/encore/commit/505c18b99dbf2e19ae67918a66a3c31a8d92c73e))
* graceful idle/reconnecting/pre-Start states and theme toggle on /listen ([#103](https://github.com/mintopia/encore/issues/103)) ([c2405ef](https://github.com/mintopia/encore/commit/c2405ef8b8ed8a6e5b769b98979bf42e3bf09b5d))
* IP-named sticky Listener identity and scoped Own Volume via proxied /jsonrpc ([#101](https://github.com/mintopia/encore/issues/101)) ([2728131](https://github.com/mintopia/encore/commit/27281315eb9d36de371c16bf37130d27d6ba4eae))
* live now-playing metadata on /listen ([#98](https://github.com/mintopia/encore/issues/98)) ([bc74e11](https://github.com/mintopia/encore/commit/bc74e11b247212c23e556ed8c68701fecb245932))
* public Listener page at /listen with admin theming ([d3da766](https://github.com/mintopia/encore/commit/d3da766d222fa292c6afd93d36cc37abeaa2b7bd))
* read-only queue and inline lyrics on /listen ([#102](https://github.com/mintopia/encore/issues/102)) ([867f73b](https://github.com/mintopia/encore/commit/867f73bc462e220a4503595a52ebf9962943da97))
* redesign /listen as an immersive two-column desktop player ([#104](https://github.com/mintopia/encore/issues/104)) ([656d36c](https://github.com/mintopia/encore/commit/656d36cfeeef49ec1ca335af51a5f29e30c73f4b))
* Settings QR + link and hamburger 'Public listen' entry ([#100](https://github.com/mintopia/encore/issues/100)) ([31516fc](https://github.com/mintopia/encore/commit/31516fc56131150a37366e5716d99120491f038f))
* snapcast.listener flag and gated /listen page shell ([#97](https://github.com/mintopia/encore/issues/97)) ([985db35](https://github.com/mintopia/encore/commit/985db355411c1e570630d8bc509603275df3574d))


### Bug Fixes

* accent ink luminance threshold, stable HSL sliders, copy fallback ([#106](https://github.com/mintopia/encore/issues/106)) ([a6e4041](https://github.com/mintopia/encore/commit/a6e4041b732899dbdf6630653f3cc9e7e7cd5adf))
* align Listener and accent settings with the approved mockup ([32c1fb2](https://github.com/mintopia/encore/commit/32c1fb294d790c45d51154f2fbbada3309cfa25b))
* handle long track, artist and album names on the Listener ([de1fa94](https://github.com/mintopia/encore/commit/de1fa94718b516da563696d4c218d4325004ea72))
* load libflac after FLAC_SCRIPT_LOCATION is set so the wasm resolves ([#99](https://github.com/mintopia/encore/issues/99)) ([7eab834](https://github.com/mintopia/encore/commit/7eab834fa98c321c901b8fd802a74790a865ad48))
* Phosphor theme icons, reuse AudioContext on stream retry, correct theme comment ([#103](https://github.com/mintopia/encore/issues/103)) ([f479efd](https://github.com/mintopia/encore/commit/f479efdc38b196531eff23b531d47933e888745f))
* point footer credit link to pimusic.stream ([9bdb0e2](https://github.com/mintopia/encore/commit/9bdb0e2981ec227e7d8bb542e341841691c90ead))
* tint Listener dark mode and live indicator from the accent ([3f92bf0](https://github.com/mintopia/encore/commit/3f92bf0b5a193ced541fd9d7ce4609cf36fbc643))

## [2.1.1](https://github.com/mintopia/encore/compare/v2.1.0...v2.1.1) (2026-10-12)


### Bug Fixes

* address whole-repo audit findings ([5ad23b5](https://github.com/mintopia/encore/commit/5ad23b5d29d8c9bfc93097d8f3727b6cfa1800c4))
* **audio:** start hardware sinks at full volume ([3ba7333](https://github.com/mintopia/encore/commit/3ba7333b46204d610001a832b5d92db0c763c287))
* **docker:** quiet headless PipeWire errors and enable realtime audio ([e3c41c6](https://github.com/mintopia/encore/commit/e3c41c6d2ae537f54327599290d326110c33799c))
* full-volume outputs, quiet startup, audit fixes, and dependency updates ([b0cff40](https://github.com/mintopia/encore/commit/b0cff404bfa12ea1019489de5234f748047095c4))
* **proxy:** only dial Soloist while it is running ([e28f7e6](https://github.com/mintopia/encore/commit/e28f7e6ceeb6569b9ee2da6925037456fe3932a5))

## [2.1.0](https://github.com/mintopia/encore/compare/v2.0.1...v2.1.0) (2026-10-11)


### Features

* rebrand to Encore, add docs site, external Snapcast and port 80 default ([18c7f16](https://github.com/mintopia/encore/commit/18c7f1659d638400b3238f56cfa2ab967792641c))
