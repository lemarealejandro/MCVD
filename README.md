# ClinicPlus / MCVD

Sistema de gestión para clínicas dentales: agenda, fichas clínicas (odontograma, periodontodiagrama, tratamientos, presupuesto en PDF, consentimiento con firma digital), inventario, imagenología, informes radiológicos, sucursales, gastos, laboratorio, convenios, liquidaciones y reportes.

- **Frontend:** React 19 + Vite 8, desplegado en Vercel.
- **Backend:** Supabase (PostgreSQL + Auth). Cada clínica ve solo sus datos gracias a reglas RLS en la base.

## Documentación

- 📘 [Manual de uso](docs/MANUAL_DE_USO.md): para el personal de la clínica y quien administra los accesos.
- 🛠️ [Documentación técnica](docs/DOCUMENTACION_TECNICA.md): arquitectura, base de datos, seguridad, despliegue y operación.

## Inicio rápido (desarrollo)

Requisitos: Node.js 20 o superior.

```bash
npm install
```

```bash
cp .env.example .env
```

```bash
npm run dev
```

Abre `http://localhost:5173` y entra con un usuario de Supabase asignado a una clínica (ver la [documentación técnica, §12](docs/DOCUMENTACION_TECNICA.md#12-operación-usuarios-clínicas-y-migraciones)).

Otros comandos: `npm run lint`, `npm run build`, `npm run preview`.

## Ambientes

| | Rama | App | Supabase |
|---|---|---|---|
| Producción | `main` | https://mcvd.vercel.app | CliniPlus Project |
| Pruebas | `staging` | Preview de Vercel de `staging` | CliniPlus Pruebas |

Flujo: cambios a `staging` → probar → pull request `staging` → `main`. Detalle en la [documentación técnica, §11.5](docs/DOCUMENTACION_TECNICA.md).

## Variables de entorno

Obligatorias: `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` (ya incluidas en `.env.example`). Opcionales: las de EmailJS para enviar correos. Detalle en la [documentación técnica, §10](docs/DOCUMENTACION_TECNICA.md#10-configuración-y-variables-de-entorno).

## Base de datos

El esquema y las reglas de acceso están en [`supabase/migrations/`](supabase/migrations/). Toda tabla nueva debe tener RLS activado.
