# Changelog

All notable changes to Splat Walk are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Security

- Next.js 16.3.4 to 16.4.2 ([#12](https://github.com/vsolano9/splat-walk/pull/12), deployed 2026-10-16). Fixes the critical remote code execution in `next/og` `ImageResponse` ([GHSA-vcvr-r3jv-pc5j](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j)) and the Image Optimization SSRF, SSG/ISR cache poisoning, draft-mode cache leak and metadata-route disclosure advisories in 16.0.0-16.3.7.
- Transitive runtime and build dependencies patched in the same change: `sharp` 0.35.5 (librsvg CVE-2026-96889), `source-map-js` 1.2.2 and `brace-expansion` 1.1.21 (denial-of-service advisories).
- `@next/eslint-plugin-next` 16.3.4 to 16.4.2, matching the Next.js release.
- Known: `npm audit` still reports 4 high advisories in the lint-only chain `@next/eslint-plugin-next` > `fast-glob` > `micromatch` > `braces` ([GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)). No patched `braces` release exists; the chain runs only during `eslint` on trusted source and is not part of the deployed app. `npm audit --omit=dev` reports 0 vulnerabilities.
