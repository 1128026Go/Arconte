# 📁 Estructura del Repositorio Limpio

## 📄 Archivos en la Raíz

```
README.md                          # Intro y guía rápida
GUIA_MAESTRA.md                    # Guía COMPLETA (instalación + deployment)
ANALISIS_PROFUNDO_PROYECTO.md     # Análisis técnico detallado
LIMPIEZA_GIT.md                    # Cómo limpiar historial de Git
.gitignore                         # Archivos ignorados
```

## 📂 Estructura de Carpetas

```
Aplicacion Juridica/
├── apps/
│   ├── api_php/           # Backend Laravel
│   ├── web/               # Frontend React
│   └── ingest_py/         # Python FastAPI service
├── docs/
│   └── archive/           # Documentos antiguos (16 archivos)
├── scripts/               # Scripts de automatización (.bat)
└── .github/               # GitHub Actions CI/CD
```

## 🎯 Guía de Lectura

**Si eres nuevo:**
1. Empieza con `README.md`
2. Sigue los pasos de instalación en `GUIA_MAESTRA.md`
3. Crea usuario de prueba y explora

**Si vas a desplegar:**
1. Lee la sección "Deployment a Producción" en `GUIA_MAESTRA.md`
2. Sigue los pasos paso a paso
3. Configura HTTPS y backups

**Si quieres entender el código:**
1. Lee `ANALISIS_PROFUNDO_PROYECTO.md`
2. Revisa la arquitectura y módulos
3. Checa los issues y observaciones

**Si quieres limpiar Git:**
1. Lee `LIMPIEZA_GIT.md`
2. Decide si quieres empezar fresco o limpiar historial
3. Sigue los pasos con cuidado

## 📚 Documentación Adicional

Los archivos en `docs/archive/` contienen documentación histórica:
- Guías de frontend implementadas
- Checklists de pruebas
- Configuraciones antiguas
- Notas de desarrollo

**No los borres** - pueden ser útiles como referencia, pero no son necesarios para usar la app.

## 🧹 Mantenimiento

**Mantén limpio:**
- No agregues archivos `.md` nuevos en la raíz
- Usa `docs/` para documentación adicional
- Actualiza `GUIA_MAESTRA.md` cuando cambies algo importante

**Actualiza regularmente:**
- `README.md` cuando agregues features
- `GUIA_MAESTRA.md` cuando cambies deployment
- `ANALISIS_PROFUNDO_PROYECTO.md` después de refactors grandes
