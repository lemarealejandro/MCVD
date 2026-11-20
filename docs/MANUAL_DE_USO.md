# ClinicPlus / MCVD — Manual de uso

**Actualizado:** 2026-11-18.

**Para quién:** personal de la clínica (recepción, odontólogos, administración) y para quien administre los accesos. La documentación técnica está en [`DOCUMENTACION_TECNICA.md`](./DOCUMENTACION_TECNICA.md).

---

## Índice

1. [Antes de empezar](#1-antes-de-empezar)
2. [Entrar y salir](#2-entrar-y-salir)
3. [Cómo se guardan los datos](#3-cómo-se-guardan-los-datos)
4. [Dashboard](#4-dashboard)
5. [Agenda](#5-agenda)
6. [Pacientes y ficha clínica](#6-pacientes-y-ficha-clínica)
7. [Formulario que llena el paciente](#7-formulario-que-llena-el-paciente)
8. [Inventario](#8-inventario)
9. [Imagenología e informes](#9-imagenología-e-informes)
10. [Gestión: sucursales, gastos, laboratorio, convenios y liquidaciones](#10-gestión-sucursales-gastos-laboratorio-convenios-y-liquidaciones)
11. [Reportes](#11-reportes)
12. [Configuración](#12-configuración)
13. [Para el administrador: usuarios y accesos](#13-para-el-administrador-usuarios-y-accesos)
14. [Preguntas frecuentes y problemas](#14-preguntas-frecuentes-y-problemas)
15. [Funciones que todavía no están disponibles](#15-funciones-que-todavía-no-están-disponibles)

---

## 1. Antes de empezar

- Se usa desde el navegador (Chrome, Edge, Safari o Firefox actualizados), en computadora o tablet. No hay que instalar nada.
- Necesitas un **correo y contraseña**. Si tu clínica es nueva, pulsa **Solicita acceso** en la pantalla de inicio de sesión: creas tu contraseña y entras cuando el administrador apruebe la solicitud. Si tu clínica ya existe, pide tu usuario al responsable.
- Hay dos clínicas configuradas:
  - **Clínica MCVD:** la clínica real. Empieza vacía.
  - **Demo MCVD:** trae pacientes, citas e inventario de ejemplo para practicar. **No ingreses datos de pacientes reales aquí.**

  La clínica en la que entras depende de tu usuario: lo define el administrador.

---

## 2. Entrar y salir

### Entrar

1. Abre la dirección de la app.
2. Escribe tu **correo** y tu **contraseña**.
3. Pulsa **Ingresar**.

Entrarás a la **Agenda** (o a la página que intentabas abrir).

| Mensaje | Qué significa | Qué hacer |
|---|---|---|
| "Correo o contraseña incorrectos." | Algún dato no coincide | Revisa mayúsculas y que el correo esté bien escrito |
| "…está pendiente de aprobación." | Registraste tu clínica y aún no la aprueban | Espera la aprobación |
| "Tu usuario no tiene una clínica asignada." | Tu cuenta existe pero no está asignada a una clínica | Pide al administrador que te asigne (§13) |
| "No se pudo iniciar sesión: …" | Problema de conexión u otro error | Revisa tu internet y vuelve a intentar |

La sesión queda abierta en ese navegador aunque lo cierres. **En equipos compartidos, cierra sesión siempre al terminar.**

### Salir

Pulsa **Cerrar sesión** al final del menú lateral.

### Olvidé mi contraseña

Por ahora la app no tiene ese botón. Pide al administrador que te envíe un correo de recuperación (§13.3).

---

## 3. Cómo se guardan los datos

- **Todo se guarda solo y en línea**, sin botón de "guardar general". Medio segundo después de un cambio, queda guardado en la base de datos de la clínica.
- Puedes entrar desde cualquier equipo con tu usuario y verás los mismos datos.
- Solo las personas de tu clínica ven sus datos.
- **Si dos personas editan la misma sección al mismo tiempo**, se queda el último cambio guardado y el de la otra persona puede perderse. Recomendación: que una sola persona edite la agenda a la vez y que cada odontólogo edite solo las fichas de sus pacientes.
- **Los cambios de otras personas** se ven al recargar la página (F5) o al volver a entrar a la sección.
- **Primera vez con la versión nueva:** si antes usabas la app (cuando los datos se guardaban solo en el navegador), la primera vez que entres a cada sección se suben automáticamente los datos que había en ese equipo. Por eso, **la primera persona en entrar debe hacerlo desde el equipo que tenía los datos reales.**

---

## 4. Dashboard

Menú: **Dashboard**. Muestra un resumen:

- **Pacientes registrados**, **citas de la semana** y **citas del mes**.
- **Alertas de inventario:** artículos por debajo del stock mínimo, con el botón **Reponer**, que te lleva al Inventario.
- **Generar Link de Pago:** ⚠️ es una demostración. Crea un enlace de ejemplo que **no cobra** y no está conectado a ningún medio de pago. No lo envíes a pacientes.

---

## 5. Agenda

Menú: **Agenda**.

### Ver citas

- Arriba verás los contadores: **Citas Hoy**, **Esta Semana**, **Pendientes** y **Total**.
- Filtra por estado con **Todos los estados**, o usa el buscador (paciente, servicio…).
- Estados: **Pendiente**, **Confirmada**, **Completada**, **Cancelada**.

### Crear una cita

1. Pulsa **Nueva Cita**.
2. Completa **Paciente**, **Fecha**, **Hora** y **Servicio** (obligatorios), y si quieres doctor/profesional, duración, teléfono, email y notas.
3. Pulsa guardar.

### Ficha del paciente automática al confirmar

Al **confirmar** una cita (en el formulario o cambiando su estado a **Confirmada**), el sistema crea la ficha del paciente o la vincula a una existente:

- Busca primero por **RUT**, sin importar puntos ni guion (`15.234.567-8` y `152345678` son el mismo).
- Sin RUT, solo vincula por nombre si hay un único paciente con ese nombre.
- Si la ficha ya existe, solo completa los datos que estaban vacíos; no reemplaza nada.

Por eso el formulario de la cita pide además **RUT**, **fecha de nacimiento**, **género** y **dirección**.

### Enviar confirmación por correo

En el formulario de la cita, escribe el **Email del Paciente** y pulsa **Enviar Confirmación**. Verás "Correo enviado exitosamente" si salió bien.

### Editar o eliminar

Usa los íconos **Editar** (lápiz) o **Eliminar** (papelera) en la fila de la cita. Para cancelar una cita sin borrarla, edítala y cambia su estado a **Cancelada**.

---

## 6. Pacientes y ficha clínica

Menú: **Pacientes**.

### Crear un paciente

Usa el buscador para encontrar pacientes por nombre o RUT.

1. Pulsa **Nuevo Paciente**.
2. Completa **Nombre Completo**, **RUT / Cédula**, teléfono, email, grupo sanguíneo, etc.
3. Pulsa **Crear Paciente**.

### Abrir la ficha

En la lista, pulsa **Ver Historia** en la fila del paciente. La ficha tiene cinco pestañas:

| Pestaña | Para qué sirve |
|---|---|
| **Historia Clínica** | Datos personales, antecedentes médicos y odontológicos, alergias, medicamentos, hábitos, motivo de consulta |
| **Odontograma** | Estado de cada pieza dental. Selecciona el diente y la cara (mesial, distal, oclusal, vestibular, lingual/palatino) y marca la condición |
| **Periodontodiagrama** | Sondaje en 6 puntos por pieza, sangrado, supuración, recesión y movilidad |
| **Tratamientos** | Historial de tratamientos realizados y presupuesto |
| **Consentimiento** | Consentimiento informado con **firma digital** del paciente en pantalla (con el dedo o lápiz en tablet, o con el mouse) |
| **Pagos** | Lo que debe, lo que ha pagado, la forma de pago y si está al día |

### Tratamientos y presupuesto

1. En **Tratamientos**, pulsa **Ir al Catálogo** para ver el **Catálogo Completo de Procedimientos**.
2. En cada procedimiento puedes:
   - **Agregarlo al historial** (tratamiento realizado): indica diente/zona, fecha, odontólogo y notas clínicas, y pulsa **Guardar Tratamiento**.
   - **Agregarlo al presupuesto.**
3. En el presupuesto ajusta la **Tasa USD/VES** del día. Verás el total en dólares y en bolívares.
4. Pulsa el botón de **PDF** para descargar el presupuesto en formato A4.

⚠️ **El presupuesto no se guarda:** si sales de la ficha o recargas la página, se pierde. Descarga el PDF antes de salir.

### Pagos del paciente

La pestaña **Pagos** une el presupuesto, lo que se ha hecho y lo que se ha pagado.

**1. Pasar el presupuesto a Pagos.** Hay dos formas:
- En **Tratamientos → Presupuesto**, pulsa **Pasar a Pagos**. Se usa una fecha límite de pago de 30 días.
- En **Pagos**, elige la **fecha límite de pago** y pulsa **Pasar a Pagos**.

Cada unidad queda como una línea propia: "Resina compuesta × 2" se convierte en **Resina compuesta #1** y **#2**, porque pueden hacerse y pagarse en días distintos. Si después agregas procedimientos al presupuesto, solo se pasan los nuevos. El aviso en Tratamientos dice si falta algo por pasar.

**2. Marcar lo realizado.** En la tabla **Procedimientos y pagos**, marca la casilla **Realizado** cuando se haga el procedimiento:
- Se anota en el **historial de Tratamientos** con la fecha y quién lo marcó.
- Si la desmarcas, se quita del historial. Si lo borras del historial, la casilla se desmarca sola.

**3. Registrar pagos eligiendo qué se paga.**
- Pulsa **Pagar** en la fila de un procedimiento, o **Registrar pago** arriba.
- En **¿Qué está pagando?** marca uno o varios procedimientos: el monto se llena solo con lo que falta (en Bs, con la tasa del día). Puedes cambiarlo:
  - **Menos** que lo seleccionado: es un **abono**; el procedimiento queda **Abonado**.
  - **Más**: lo que sobra se aplica a lo más antiguo pendiente o queda **a favor**.
  - **Sin elegir nada**: el pago se aplica a lo más antiguo.
- Completa la **forma de pago** (efectivo USD o Bs, transferencia, Pago Móvil, Zelle, tarjeta de débito o crédito, otro), referencia y nota.

**4. Ver el estado.**
- Cada procedimiento muestra monto, pagado, lo que debe, su estado (**Pagado**, **Abonado**, **Pendiente**, **Atrasado**) y **con qué pagos se cubrió**.
- En **Pagos recibidos**, cada pago dice qué procedimientos pagó.
- El **aviso** de arriba (también bajo el nombre del paciente) indica **Al día**, **Saldo pendiente** o **Pago atrasado**, y avisa si hay procedimientos **realizados sin pagar**. La pestaña muestra un punto ámbar o rojo cuando hay deuda.
- Los totales muestran cuánto hay en la cuenta, lo pagado, el saldo y cuántos procedimientos se han realizado.

**Corregir:** elimina un procedimiento o un pago con la papelera y confirma. El saldo se recalcula. Si eliminas un procedimiento realizado, también se quita del historial.

### Enviar el formulario al paciente

En la cabecera de la ficha, pulsa **Enviar Formulario**. El paciente recibe un correo con un enlace para llenar su historia desde su celular (ver §7). El paciente debe tener email registrado.

---

## 7. Formulario que llena el paciente

Es una página pública (el paciente **no** necesita usuario). Tiene tres pasos:

1. **Datos Personales** (nombre, RUT, fecha de nacimiento y teléfono son obligatorios).
2. **Antecedentes** (alergias, medicamentos, enfermedades crónicas, antecedentes familiares, hábitos).
3. **Consulta Dental** (motivo de consulta, antecedentes odontológicos, nivel de dolor, sensibilidad).

Al pulsar **Enviar Historia Clínica**, los datos llegan a la clínica.

- Si el paciente ve **"Este enlace está incompleto"**, el enlace es de antes de la actualización: envíale uno nuevo desde la ficha.
- Si ve **"No pudimos enviar tus datos"**, que revise su conexión e intente de nuevo.

**Dónde ver las fichas recibidas:** por ahora no aparecen dentro de la app. El administrador las consulta en Supabase (§13.5) y las traspasa a la ficha del paciente.

---

## 8. Inventario

Menú: **Inventario**. Control de insumos, materiales dentales y precios.

- **Nuevo Artículo:** nombre, categoría, **Stock actual**, **Stock mínimo** y precio en dólares.
- La columna **Estado** indica si el artículo está **Normal** o bajo el mínimo. Los artículos bajo mínimo aparecen también en el Dashboard.
- **Tasa del Día (BCV / Ref):** escribe la tasa y pulsa **Actualizar Tasa**. Los precios se muestran en **$** y **Bs**.
- **Conversor Rápido:** convierte montos entre dólares y bolívares con la tasa del día.
- Edita o elimina con los íconos de cada fila.

---

## 9. Imagenología e informes

### Estudios

Menú: **Imagenología**.

1. Pulsa **Nuevo Estudio**, elige **Paciente** y **Tipo de estudio**, y pulsa **Crear Estudio**.
2. En **Estudios Recientes**, abre un estudio para verlo en el **visor**: **Acercar**, **Alejar**, **Mover**, **Contraste** y **Restablecer**. La herramienta **Medir** está marcada como "próximamente".
3. Para borrar un estudio usa **Eliminar estudio**.

### Plantillas

Pestaña **Plantillas** dentro de Imagenología. **Gestión de Plantillas** de informes: crear, **Renombrar** y **Eliminar**.

### Informes radiológicos

Menú: **Informes**. Lista con contadores de **Total**, **Borradores**, **Pendientes** y **Finalizados**.

Al abrir un informe se entra al **constructor**: bloques arrastrables (Motivo de Consulta, Técnica Utilizada, Hallazgos Radiográficos, Evaluación Anatómica, Diagnóstico Presuntivo, Conclusión y Recomendaciones), **Imágenes Adjuntas**, **Vista Previa** y exportación a PDF.

⚠️ Hoy los informes son **de ejemplo** (solo en la clínica Demo) y los cambios en el constructor **no se guardan**. Exporta el PDF antes de salir.

---

## 10. Gestión: sucursales, gastos, laboratorio, convenios y liquidaciones

Estas secciones funcionan igual: una tabla con **buscador**, botón para **agregar**, íconos para **editar** y **eliminar**, y botón **Exportar a Excel** (descarga un archivo CSV).

**Empieza por Sucursales:** las demás secciones te piden elegir una sucursal.

| Sección | Campos | Opciones |
|---|---|---|
| **Sucursales** | Nombre, Dirección, Responsable | — |
| **Gastos** | Fecha, Categoría, Descripción, Monto ($), Sucursal | Categorías: Arriendo, Sueldos, Insumos, Servicios básicos, Laboratorio externo, Marketing, Otros |
| **Laboratorio** | Fecha, Paciente, Laboratorio, Trabajo (corona, prótesis…), Costo ($), Estado, Sucursal | Estados: Enviado, En proceso, Recibido, Entregado |
| **Convenios** | Nombre, Tipo, Descuento (%), Vigente, Notas | Tipos: Aseguradora, Empresa, Convenio particular, Otro |
| **Liquidaciones** | Dos tablas: **Profesionales** (Nombre, Especialidad, Liquidación %) y **Liquidaciones** (Profesional, Periodo, Honorarios brutos, Monto liquidado, Estado, Sucursal) | Estados: Pendiente, Pagada |

En **Liquidaciones**, registra primero a los **Profesionales**: luego aparecen para elegir en cada liquidación.

---

## 11. Reportes

Menú: **Reportes**. **Reportes de gestión** de la clínica.

1. Elige el periodo con **Desde** y **Hasta**, y la **Sucursal** (o **Todas las sucursales**).
2. Verás los indicadores: citas en el periodo, pacientes registrados, gastos del periodo, inventario bajo mínimo, laboratorio en curso y monto liquidado a profesionales.
3. Gráficos/tablas: **gastos por categoría**, **laboratorio por estado** y **liquidaciones por profesional**.
4. **Exportar datos:** descarga en CSV (abre en Excel) las citas, gastos, laboratorio, liquidaciones o inventario.

Nota: las citas no tienen sucursal, así que el filtro por sucursal no las afecta.

---

## 12. Configuración

Menú: **Configuración**.

- **Perfil de la Clínica:** nombre de la clínica y correo electrónico.
- **Preferencias Regionales:** idioma del sistema y **moneda principal** (Dólares USD o Bolívares VES).
- **Notificaciones:** alertas de bajo stock y avisos de nuevas citas.
- **Seguridad:** las contraseñas se gestionan en Supabase; pide un cambio al administrador.

---

## 13. Para el administrador: usuarios y accesos

Todo se hace en el panel de Supabase: <https://supabase.com/dashboard/project/elsgbeupmvsqwkdiineb>.

Si prefieres no usar SQL, pídeselo a Claude Code (tiene acceso a la base): por ejemplo, *"agrega a ana@clinica.cl a Clínica MCVD como staff"*.

### 13.1 Dar acceso a alguien nuevo

1. **Authentication → Users → Add user**.
   - **Create new user:** escribe correo y contraseña y marca **Auto Confirm User**. Entrega la contraseña a la persona por un canal seguro.
   - O **Send invitation:** la persona recibe un correo y elige su contraseña.
2. **SQL Editor** → pega y ejecuta (cambia el correo):

```sql
insert into public.clinic_members (clinic_id, user_id, role)
select '6736ae2a-6ab1-4ef4-9e52-876258092f19', id, 'staff'
from auth.users where email = 'persona@ejemplo.com';
```

- Para la clínica **Demo MCVD**, usa `28c51a1a-cacc-463b-a946-009f1a328fdb` en lugar del primer código.
- Usa `'owner'` en lugar de `'staff'` para responsables. (Hoy ambos roles tienen los mismos permisos.)

### 13.2 Quitar el acceso

```sql
delete from public.clinic_members
where user_id = (select id from auth.users where email = 'persona@ejemplo.com');
```

Para eliminar la cuenta por completo: **Authentication → Users →** (persona) **→ Delete user**.

### 13.3 Restablecer una contraseña

**Authentication → Users →** (persona) **→ Send password recovery**. Antes, revisa que en **Authentication → URL Configuration** la **Site URL** sea la dirección de la app, para que el enlace del correo lleve al lugar correcto.

### 13.4 Ajustes de seguridad recomendados (una sola vez)

- **Authentication → Sign In / Providers → Email:** desactiva **Allow new users to sign up**, para que nadie pueda crearse una cuenta por su cuenta.
- Usa contraseñas largas y distintas para cada persona. No compartas usuarios.

### 13.5 Ver las fichas que enviaron los pacientes

**Table Editor → patient_form_submissions.** Cada fila es una ficha: fecha de envío, referencia del paciente y los datos (columna `data`). Cuando la traspases a la ficha del paciente, pon la fecha en `reviewed_at` para marcarla como revisada.

### 13.6 Copias de seguridad

Supabase guarda copias automáticas según el plan contratado (**Database → Backups**). Antes de cambios grandes, conviene exportar los datos (ver la documentación técnica, §12.6).

### 13.7 Aprobar clínicas nuevas

Una clínica nueva puede pedir acceso sola desde **Solicita acceso** en la pantalla de inicio de sesión. Te llega un correo a lemarealejandro@gmail.com con el asunto **"Solicitud de alta: …"**.

1. Pulsa **Revisar solicitud** en el correo.
2. Revisa los datos (clínica, responsable, correo y teléfono).
3. Pulsa **Aprobar clínica**, o **Rechazar** y confirma.

Al aprobar se crea la clínica vacía y la persona ya puede entrar con su correo y la contraseña que eligió. No reenvíes el correo: el enlace permite aprobar la clínica.

### 13.8 Panel de administración

Con tu cuenta de administrador entras a **Administración de la plataforma** (`/plataforma`) al iniciar sesión. Ahí puedes:

- Ver cuántas **solicitudes pendientes**, **clínicas** y **usuarios** hay.
- **Aprobar** o **Rechazar** solicitudes sin depender del correo. Usa **Pendientes / Todas** para filtrar y el botón de actualizar para ver las nuevas.
- Ver la lista de **clínicas** con sus usuarios, su rol y su último ingreso.

El panel **no muestra pacientes ni datos clínicos** de las clínicas. Al aprobar, el sistema no le envía correo a la persona: avísale tú.

Si además perteneces a una clínica, entras a tu clínica y verás **Administración** al final del menú lateral.

### 13.9 Ambiente de pruebas

Existe una copia del sistema para probar cambios **sin tocar los datos reales**:

- **Producción** (la que usa la clínica): https://mcvd.vercel.app
- **Pruebas:** la dirección de la rama `staging` en Vercel (*Deployments* → el que dice **staging**).

Las dos tienen usuarios, clínicas y datos **separados**: una cuenta creada en pruebas no sirve en producción y viceversa. En pruebas puedes registrar clínicas, aprobar solicitudes y cargar pacientes ficticios sin riesgo. **No cargues datos de pacientes reales en pruebas.**

Los cambios nuevos se publican primero en pruebas y, cuando están revisados, pasan a producción. El detalle técnico está en la documentación técnica, §11.5.

---

## 14. Preguntas frecuentes y problemas

**No veo los cambios que hizo un compañero.**
Recarga la página (F5). Los cambios de otros no aparecen solos.

**Hice un cambio y desapareció.**
Puede que otra persona estuviera editando la misma sección y su guardado reemplazara el tuyo (§3). Vuelve a hacerlo y coordinen quién edita.

**Me saca de la sesión de repente.**
Tu sesión expiró o alguien cerró sesión con tu usuario en otra pestaña. Vuelve a entrar.

**Perdí el presupuesto que estaba armando.**
El presupuesto no se guarda (§6). Descarga siempre el PDF antes de salir de la ficha.

**El paciente dice que el formulario no le deja enviar.**
Si dice "enlace incompleto", envíale un enlace nuevo desde la ficha. Si no, que revise que llenó los campos obligatorios y su conexión.

**No llegan los correos.**
Revisa que el email esté bien escrito y la carpeta de spam. El servicio de correo tiene un límite mensual (200 en el plan gratuito). Si persiste, avisa al responsable técnico.

**Veo pacientes que no conozco.**
Probablemente estás en la clínica **Demo MCVD**, que tiene datos de ejemplo. Pide al administrador que te asigne a **Clínica MCVD**.

---

## 15. Funciones que todavía no están disponibles

- Pantalla dentro de la app para revisar las fichas enviadas por pacientes.
- "Olvidé mi contraseña" y gestión de usuarios desde la app.
- Actualización automática cuando otra persona hace un cambio.
- Guardar presupuestos e informes radiológicos.
- Asignar sucursal a las citas.
- Cobros reales (el link de pago es de demostración).
- Herramienta de medición en el visor de imágenes.
- Permisos distintos por rol (todos los usuarios de una clínica pueden ver y editar todo).
