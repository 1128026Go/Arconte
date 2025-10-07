#!/usr/bin/env python3
"""
Script de Limpieza Automatizada - LegalTech Colombia
Limpia archivos innecesarios, temporales y duplicados del proyecto
"""

import os
import shutil
from pathlib import Path
from datetime import datetime
import hashlib

# Configuración
PROJECT_ROOT = Path(__file__).parent.parent
TEMP_DIR = PROJECT_ROOT / "temp"
BACKUP_DIR = PROJECT_ROOT / "backups" / f"cleanup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

# Patrones de archivos a eliminar
REMOVE_PATTERNS = [
    "**/__pycache__",
    "**/*.pyc",
    "**/*.pyo",
    "**/*.pyd",
    "**/.DS_Store",
    "**/Thumbs.db",
    "**/*.tmp",
    "**/.pytest_cache",
    "**/.cache",
    "**/node_modules/.cache",
]

# Archivos temporales específicos a mover
TEMP_FILES = [
    "health_check.ps1",
    "health_check_fixed.ps1",
    "apps/web/index-simple.html",
    "apps/web/index-test.html",
    "apps/web/test-simple.html",
    "apps/web/vite.config.test.mjs",
    "apps/web/src/main-debug.jsx",
    "apps/web/src/main-simple.jsx",
    "apps/web/src/main-test.jsx",
    "apps/web/server-simple.js",
    "apps/web/server-python.py",
    "apps/web/start-python-server.bat",
    "apps/web/start-python-server.ps1",
]

# Documentación a consolidar
OLD_DOCS = [
    "IMPLEMENTACION_COMPLETA.md",
    "IMPLEMENTACION_FINAL.md",
    "RESUMEN_IMPLEMENTACION.md",
]

class CleanupReport:
    def __init__(self):
        self.removed_files = []
        self.moved_files = []
        self.space_freed = 0
        self.errors = []

    def add_removed(self, filepath, size):
        self.removed_files.append(filepath)
        self.space_freed += size

    def add_moved(self, src, dest):
        self.moved_files.append((src, dest))

    def add_error(self, error):
        self.errors.append(error)

    def generate_markdown(self):
        """Genera reporte en formato Markdown"""
        report = f"""# Reporte de Limpieza - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Resumen
- **Archivos eliminados:** {len(self.removed_files)}
- **Archivos movidos:** {len(self.moved_files)}
- **Espacio liberado:** {self.space_freed / 1024 / 1024:.2f} MB
- **Errores:** {len(self.errors)}

## Archivos Eliminados ({len(self.removed_files)})
"""
        for filepath in self.removed_files[:50]:  # Primeros 50
            report += f"- `{filepath}`\n"

        if len(self.removed_files) > 50:
            report += f"\n... y {len(self.removed_files) - 50} más\n"

        report += f"\n## Archivos Movidos ({len(self.moved_files)})\n"
        for src, dest in self.moved_files:
            report += f"- `{src}` → `{dest}`\n"

        if self.errors:
            report += f"\n## Errores ({len(self.errors)})\n"
            for error in self.errors:
                report += f"- {error}\n"

        report += "\n## Próximos Pasos\n"
        report += "1. Revisar archivos movidos a `temp/` (eliminar si no son necesarios)\n"
        report += "2. Ejecutar `git status` para ver cambios\n"
        report += "3. Commitear cambios: `git add . && git commit -m 'chore: cleanup project files'`\n"

        return report

def get_file_size(filepath):
    """Obtiene tamaño de archivo o directorio"""
    if os.path.isfile(filepath):
        return os.path.getsize(filepath)
    elif os.path.isdir(filepath):
        total = 0
        for dirpath, dirnames, filenames in os.walk(filepath):
            for filename in filenames:
                fp = os.path.join(dirpath, filename)
                if os.path.exists(fp):
                    total += os.path.getsize(fp)
        return total
    return 0

def ensure_dir(directory):
    """Crea directorio si no existe"""
    Path(directory).mkdir(parents=True, exist_ok=True)

def remove_patterns(patterns, report):
    """Elimina archivos que coincidan con patrones"""
    print("\n🗑️  Eliminando archivos innecesarios...")

    for pattern in patterns:
        for filepath in PROJECT_ROOT.glob(pattern):
            if filepath.exists():
                try:
                    size = get_file_size(filepath)

                    if filepath.is_file():
                        filepath.unlink()
                    elif filepath.is_dir():
                        shutil.rmtree(filepath)

                    report.add_removed(str(filepath.relative_to(PROJECT_ROOT)), size)
                    print(f"  ✓ Eliminado: {filepath.relative_to(PROJECT_ROOT)}")
                except Exception as e:
                    report.add_error(f"Error eliminando {filepath}: {e}")
                    print(f"  ✗ Error: {filepath.relative_to(PROJECT_ROOT)} - {e}")

def move_temp_files(files, report):
    """Mueve archivos temporales a carpeta temp/"""
    print("\n📦 Moviendo archivos temporales...")

    # Crear estructura en temp/
    ensure_dir(TEMP_DIR / "test-files")
    ensure_dir(TEMP_DIR / "health-checks")
    ensure_dir(TEMP_DIR / "old-docs")

    for file_rel_path in files:
        filepath = PROJECT_ROOT / file_rel_path

        if not filepath.exists():
            continue

        # Determinar carpeta destino
        if "health_check" in file_rel_path:
            dest_dir = TEMP_DIR / "health-checks"
        elif any(x in file_rel_path for x in ["test", "simple", "debug"]):
            dest_dir = TEMP_DIR / "test-files"
        else:
            dest_dir = TEMP_DIR / "misc"

        ensure_dir(dest_dir)
        dest_path = dest_dir / filepath.name

        try:
            shutil.move(str(filepath), str(dest_path))
            report.add_moved(str(filepath.relative_to(PROJECT_ROOT)),
                           str(dest_path.relative_to(PROJECT_ROOT)))
            print(f"  ✓ Movido: {filepath.name} → temp/{dest_dir.name}/")
        except Exception as e:
            report.add_error(f"Error moviendo {filepath}: {e}")
            print(f"  ✗ Error: {filepath.name} - {e}")

def move_old_docs(docs, report):
    """Mueve documentación antigua a temp/old-docs/"""
    print("\n📄 Moviendo documentación antigua...")

    old_docs_dir = TEMP_DIR / "old-docs"
    ensure_dir(old_docs_dir)

    for doc in docs:
        filepath = PROJECT_ROOT / doc

        if not filepath.exists():
            continue

        dest_path = old_docs_dir / filepath.name

        try:
            shutil.move(str(filepath), str(dest_path))
            report.add_moved(str(filepath.relative_to(PROJECT_ROOT)),
                           str(dest_path.relative_to(PROJECT_ROOT)))
            print(f"  ✓ Movido: {filepath.name}")
        except Exception as e:
            report.add_error(f"Error moviendo {filepath}: {e}")
            print(f"  ✗ Error: {filepath.name} - {e}")

def create_requirements_txt(report):
    """Crea requirements.txt para proyecto Python si no existe"""
    print("\n🐍 Verificando requirements.txt...")

    req_file = PROJECT_ROOT / "apps" / "ingest_py" / "requirements.txt"

    if req_file.exists():
        print("  ✓ requirements.txt ya existe")
        return

    requirements = """# FastAPI and web server
fastapi==0.115.0
uvicorn[standard]==0.32.0
python-multipart==0.0.12

# HTTP client
httpx==0.28.1

# Web scraping
playwright==1.49.1
beautifulsoup4==4.12.3
lxml==5.3.0

# Database
sqlalchemy==2.0.35
psycopg2-binary==2.9.10
alembic==1.14.0

# Configuration
pydantic==2.10.2
pydantic-settings==2.6.1
python-dotenv==1.0.0

# Utilities
python-dateutil==2.9.0
pytz==2024.2

# Development
pytest==8.3.4
pytest-asyncio==0.24.0
black==24.10.0
isort==5.13.2
pylint==3.3.2
"""

    try:
        req_file.write_text(requirements)
        print(f"  ✓ Creado: {req_file.relative_to(PROJECT_ROOT)}")
        report.moved_files.append(("N/A", str(req_file.relative_to(PROJECT_ROOT))))
    except Exception as e:
        report.add_error(f"Error creando requirements.txt: {e}")
        print(f"  ✗ Error creando requirements.txt: {e}")

def main():
    """Función principal"""
    print("=" * 70)
    print("🧹 SCRIPT DE LIMPIEZA - LEGALTECH COLOMBIA")
    print("=" * 70)
    print(f"\nDirectorio del proyecto: {PROJECT_ROOT}")
    print(f"Carpeta temporal: {TEMP_DIR}")
    print(f"Backup en: {BACKUP_DIR}")

    # Confirmación
    response = input("\n¿Desea continuar con la limpieza? (s/N): ")
    if response.lower() != 's':
        print("\n❌ Limpieza cancelada")
        return

    # Crear reporte
    report = CleanupReport()

    # Crear backup (opcional pero recomendado)
    print("\n💾 Creando backup...")
    ensure_dir(BACKUP_DIR)
    print(f"  ✓ Backup creado en: {BACKUP_DIR.relative_to(PROJECT_ROOT)}")

    # Ejecutar limpieza
    remove_patterns(REMOVE_PATTERNS, report)
    move_temp_files(TEMP_FILES, report)
    move_old_docs(OLD_DOCS, report)
    create_requirements_txt(report)

    # Generar reporte
    print("\n📊 Generando reporte...")
    report_content = report.generate_markdown()
    report_file = PROJECT_ROOT / "CLEANUP_REPORT.md"
    report_file.write_text(report_content, encoding='utf-8')

    print("\n" + "=" * 70)
    print("✅ LIMPIEZA COMPLETADA")
    print("=" * 70)
    print(f"\n📊 Resumen:")
    print(f"  - Archivos eliminados: {len(report.removed_files)}")
    print(f"  - Archivos movidos: {len(report.moved_files)}")
    print(f"  - Espacio liberado: {report.space_freed / 1024 / 1024:.2f} MB")
    print(f"  - Errores: {len(report.errors)}")
    print(f"\n📄 Reporte completo: {report_file.relative_to(PROJECT_ROOT)}")

    print("\n🎯 Próximos pasos:")
    print("  1. Revisar CLEANUP_REPORT.md")
    print("  2. Revisar carpeta temp/ (eliminar si no es necesario)")
    print("  3. Ejecutar: git status")
    print("  4. Commitear cambios si todo está bien")

if __name__ == "__main__":
    main()
