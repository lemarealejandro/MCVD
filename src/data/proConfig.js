// Catálogos y claves de los módulos Pro (sin IA).
export const CATEGORIAS_GASTO = ['Arriendo', 'Sueldos', 'Insumos', 'Servicios básicos', 'Laboratorio externo', 'Marketing', 'Otros'];

export const ESTADOS_LAB = ['Enviado', 'En proceso', 'Recibido', 'Entregado'];

export const TIPOS_CONVENIO = ['Aseguradora', 'Empresa', 'Convenio particular', 'Otro'];

export const PROFESIONALES_KEY = 'clinicplus_profesionales';
export const LIQUIDACIONES_KEY = 'clinicplus_liquidaciones';

// Liquidación = honorarios brutos × porcentaje del profesional, calculado al guardar.
export const calcularLiquidacion = (honorarios, porcentaje) =>
  Number((Number(honorarios || 0) * Number(porcentaje || 0) / 100).toFixed(2));
