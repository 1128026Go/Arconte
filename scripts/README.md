Scripts del proyecto Arconte

Estructura actual:

- `scripts/lib/common.ps1` – utilidades compartidas (detección robusta de la raíz del proyecto)

- Desarrollo (`scripts/dev`)
  - `dev.ps1` – utilidades de desarrollo (`-Clean`, `-StopAll`)
  - `setup.ps1` – setup inicial (Node/PHP/Composer) y verificación de entorno

- Mantenimiento (`scripts/maintenance`)
  - `cleanup.ps1` – limpieza rápida/profunda (`-Deep`, `-DryRun`)
  - `cleanup.py` – limpieza avanzada con reporte `CLEANUP_REPORT.md`
  - `rotate-logs.ps1` / `rotate-logs.sh` – rotación de logs
  - `backup-database.ps1` / `backup-database.sh` – backups PostgreSQL y retención
  - `daily-check.ps1` / `daily-check.sh` – chequeos diarios

- Operación (`scripts/ops`)
  - `health-monitor.ps1` / `health-monitor.sh` – monitor de salud de servicios
  - `CREATE_TEST_USER.bat` – creación de usuarios de prueba en Laravel
  - `stop_all.ps1` – utilidades de parada (redundante con `dev.ps1 -StopAll`)

Comandos npm (desde la raíz `Aplicacion Juridica`):

- `npm run setup` – configuración inicial
- `npm run dev` – entorno de desarrollo (Vite) y verificación de Laravel
- `npm run stop` – detener procesos comunes (3000, 5173, 8000, 8001)
- `npm run clean` – limpieza básica
- `npm run clean:deep` – limpieza profunda (borra node_modules/caches)
- `npm run web:dev` – iniciar frontend
- `npm run web:build` – build de frontend
- `npm run web:test` – pruebas unitarias de frontend (vitest)
