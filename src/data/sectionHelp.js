// Clave de sessionStorage con las secciones ya explicadas en la sesión actual.
export const COACH_SEEN_KEY = 'clinicplus_coach_seen';

// Texto de los coachmarks: una entrada por sección del panel, indexada por el primer segmento de la ruta.
export const SECTION_HELP = {
  dashboard: {
    title: 'Dashboard',
    text: 'Resumen de la clínica: citas de la semana y del mes, y pacientes registrados. Es la vista para empezar el día.',
  },
  agenda: {
    title: 'Agenda',
    text: 'Crea, edita y confirma citas por fecha y profesional. Desde la lista puedes cambiar el estado de cada cita.',
  },
  patients: {
    title: 'Pacientes',
    text: 'Lista de pacientes. Abre una ficha para ver y editar su historia clínica, odontograma y tratamientos.',
  },
  imagenologia: {
    title: 'Imagenología',
    text: 'Estudios de imagen (radiografías, tomografías). Incluye el dashboard de estudios, el visor y las plantillas de informe.',
  },
  informes: {
    title: 'Informes',
    text: 'Informes radiológicos. Crea y edita informes a partir de los estudios y consulta su estado.',
  },
  inventory: {
    title: 'Inventario',
    text: 'Control de stock de insumos y materiales, con alerta cuando baja del mínimo, precios en USD y conversor a bolívares.',
  },
  reportes: {
    title: 'Reportes',
    text: 'Indicadores de gestión filtrables por fecha y sucursal. Desde aquí exportas citas, gastos, laboratorio, liquidaciones e inventario a Excel.',
  },
  sucursales: {
    title: 'Sucursales',
    text: 'Registro de sedes. Al asignar una sucursal a gastos, laboratorio o liquidaciones, los reportes pueden filtrarse por sede.',
  },
  gastos: {
    title: 'Gastos',
    text: 'Registro de gastos operativos por categoría, monto y sucursal.',
  },
  laboratorio: {
    title: 'Laboratorio',
    text: 'Órdenes enviadas a laboratorio dental, con su estado (enviado, en proceso, recibido, entregado) y costo.',
  },
  convenios: {
    title: 'Convenios',
    text: 'Acuerdos con aseguradoras, empresas y convenios particulares, con su porcentaje de descuento y vigencia.',
  },
  liquidaciones: {
    title: 'Liquidaciones',
    text: 'Define el porcentaje de cada profesional y registra liquidaciones por periodo. El monto se calcula sobre los honorarios brutos.',
  },
  settings: {
    title: 'Configuración',
    text: 'Datos de la clínica (nombre, correo y moneda) y preferencias de alertas de stock y citas.',
  },
};
