# feat: two-factor authentication (TOTP) support

Closes #24 (frontend half — pairs with backend PR [tenkei-register#27](https://github.com/sapiderman/tenkei-register/pull/27), branch `add-2fa`)

## Summary

Adds TOTP-based two-factor authentication across the web app: members can enroll from their profile (QR code + authenticator app), and enrolled members get a second verification step at login. The Next.js routes are thin proxies — format checks, session-cookie plumbing, and error normalization only; the Go backend owns all real validation, rate limits, and the 2FA state machine.

## What's included

### API routes (`app/api/auth/2fa/`)

| Route | Purpose |
|---|---|
| `POST /api/auth/2fa/enroll` | Start enrollment — returns secret + `otpauth://` URL for the QR code |
| `POST /api/auth/2fa/verify` | Verify a 6-digit code; completes a pending 2FA login |
| `POST /api/auth/2fa/confirm` | Confirm enrollment with a code + current password |
| `POST /api/auth/2fa/disable` | Disable 2FA with a code + current password |

Shared plumbing in `2fa/_lib.ts`: TOTP/password format checks, authenticated upstream forwarding (15s timeout), and a relay allowlist (`200/400/401/403/404/409`) so backend internals never leak to the browser.

### Login flow

- `POST /api/auth/login` now handles `2fa_required`: it forwards the backend's **pending session cookie** (5-min TTL, only accepted by `/api/auth/2fa/verify`).
- `LoginForm` shows a code step when `twoFactorRequired` is returned; machine-readable codes (`invalid_code` / `totp_locked` / `session_expired`) drive the UI (lockout → back to password step).

### Profile settings

- New `TwoFactorSettings` component in `ProfileView`: enroll → scan QR (`qrcode.react`) → confirm → enabled; disable requires a code + current password. Hidden entirely if the backend hasn't shipped 2FA (404 on enroll).
- `ProfileResponse` gains `totp_enabled` (backend pending — see plan).

### Tests & tooling

- Set up **vitest + jsdom + Testing Library** (first tests in the repo).
- Route tests for `enroll` and `verify` (success, bad code, lockout, session expiry); component tests for `LoginForm` (2FA step) and `TwoFactorSettings` (enroll/disable flows).

### i18n

All user-facing strings added to `en`, `id`, and `ja` locale files.

## Security notes

- Next proxy format-checks only; backend verifies codes via its own TOTP library and remains the authoritative gate (rate limits included).
- `Set-Cookie` never relayed on non-ok paths; pending session cookie is scoped by the backend's 5-min TTL.
- Turnstile unchanged on the login form.

## Verification

- `yarn lint`, `yarn build`, `vitest run` — all green.
- Version bump to `0.3.0`.

## Deployment / dependency

- Depends on backend `add-2fa` (PR tenkei-register#27) for the `/v1/auth/2fa/*` endpoints. FE degrades gracefully pre-merge (404 → settings hidden; login without 2FA unaffected).
- Known follow-ups tracked in `2fa-plan.md` (not committed) — e.g. consume `totp_enabled` once the backend exposes it, and switch prose-matched verify errors to stable codes.
