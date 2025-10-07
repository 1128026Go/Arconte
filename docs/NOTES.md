# Internal Notes

## Current Scope
- Laravel API with authentication (Sanctum), cases, notifications.
- React dashboard consuming `/cases`, `/notifications`, `/auth/me`.
- OCR service depends on `tesseract` and `convert`; disabled via `OCR_ENABLED`.
- Python ingest service exposes `/normalized/{radicado}` placeholder data.

## Backlog
- Finish ingest pipeline to sync Rama Judicial data.
- Replace OCR mock text once binaries are available in production.
- Add granular roles/teams support before multi-user rollout.
- Document notification rules UX and expose management screen.

## Dev Tips
- Run `php artisan test` in `apps/api_php` with SQLite.
- Frontend reads `VITE_API_URL`; keep `.env` per environment.
- GitHub Action `ci-cd.yml` runs PHP tests and Vite build on PRs.
- Use `npm run dev` + `php artisan serve` for local pairing.
