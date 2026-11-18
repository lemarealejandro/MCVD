# Propuesta: backend normalizado (NO aplicado)

Copia de referencia del diseño de backend que llegó en la rama `odontograma-diagnostico`
(commit `b4e00e6`, 2026-11-18). **No está aplicado en Supabase ni conectado a la app.**

- Unas 30 tablas por entidad (`patients`, `appointments`, `budgets`, `treatments_done`, …),
  roles por clínica (`admin`, `dentista`, `recepcion`, `solo_lectura`), auditoría,
  almacenamiento de archivos (Storage) y enlaces de formulario para pacientes.
- **No ejecutar estas migraciones sobre el proyecto actual:** crean tablas con los mismos
  nombres que las que ya están en uso (`clinics`, `platform_admins`) pero con otras columnas.
  Por eso están fuera de `supabase/migrations/`.

Adoptarlo es una segunda etapa: migrar los datos de `clinic_data` (JSON por colección) a
estas tablas, reconciliar `clinics`/`platform_admins`/`clinic_requests` con el modelo actual
y reescribir cómo guarda cada pantalla. Ver la documentación técnica, §15.
