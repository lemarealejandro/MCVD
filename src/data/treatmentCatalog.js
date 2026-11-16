export const DENTAL_TREATMENTS = [
  {
    category: 'Prevención y Diagnóstico',
    items: [
      { id: 'dx-01', name: 'Consulta y Diagnóstico', unit: 'Sesión', priceUSD: 25 },
      { id: 'dx-02', name: 'Radiografía Periapical', unit: 'Por diente', priceUSD: 8 },
      { id: 'dx-03', name: 'Radiografía Panorámica', unit: 'Por placa', priceUSD: 40 },
      { id: 'dx-04', name: 'Radiografía Bitewing', unit: 'Por placa', priceUSD: 15 },
      { id: 'dx-05', name: 'Profilaxis / Limpieza con Ultrasonido', unit: 'Sesión', priceUSD: 60 },
      { id: 'dx-06', name: 'Aplicación de Flúor', unit: 'Sesión', priceUSD: 20 },
      { id: 'dx-07', name: 'Sellantes de Fosas y Fisuras', unit: 'Por diente', priceUSD: 18 },
    ]
  },
  {
    category: 'Operatoria Dental (Restauraciones)',
    items: [
      { id: 'op-01', name: 'Restauración de Resina Simple (1 cara)', unit: 'Por diente', priceUSD: 45 },
      { id: 'op-02', name: 'Restauración de Resina Compuesta (2 caras)', unit: 'Por diente', priceUSD: 65 },
      { id: 'op-03', name: 'Restauración de Resina Compuesta (3+ caras)', unit: 'Por diente', priceUSD: 80 },
      { id: 'op-04', name: 'Incrustación de Porcelana (Inlay/Onlay)', unit: 'Por diente', priceUSD: 250 },
      { id: 'op-05', name: 'Incrustación Metálica', unit: 'Por diente', priceUSD: 180 },
      { id: 'op-06', name: 'Reconstrucción Coronal Total', unit: 'Por diente', priceUSD: 120 },
    ]
  },
  {
    category: 'Endodoncia (Tratamientos de Conducto)',
    items: [
      { id: 'en-01', name: 'Endodoncia Anterior (1 conducto)', unit: 'Por diente', priceUSD: 150 },
      { id: 'en-02', name: 'Endodoncia Premolar (2 conductos)', unit: 'Por diente', priceUSD: 200 },
      { id: 'en-03', name: 'Endodoncia Molar (3-4 conductos)', unit: 'Por diente', priceUSD: 280 },
      { id: 'en-04', name: 'Retratamiento Endodóntico', unit: 'Por conducto', priceUSD: 120 },
      { id: 'en-05', name: 'Pulpotomía', unit: 'Por diente', priceUSD: 80 },
    ]
  },
  {
    category: 'Periodoncia (Encías)',
    items: [
      { id: 'pe-01', name: 'Tartrectomía Supragingival', unit: 'Arcada', priceUSD: 50 },
      { id: 'pe-02', name: 'Raspado y Alisado Radicular (RAR)', unit: 'Por cuadrante', priceUSD: 80 },
      { id: 'pe-03', name: 'Gingivectomía', unit: 'Por cuadrante', priceUSD: 150 },
      { id: 'pe-04', name: 'Cirugía de Colgajo Periodontal', unit: 'Por cuadrante', priceUSD: 300 },
      { id: 'pe-05', name: 'Frenectomía', unit: 'Procedimiento', priceUSD: 180 },
    ]
  },
  {
    category: 'Cirugía Oral',
    items: [
      { id: 'ci-01', name: 'Extracción Simple', unit: 'Por diente', priceUSD: 40 },
      { id: 'ci-02', name: 'Extracción Complicada / Quirúrgica', unit: 'Por diente', priceUSD: 90 },
      { id: 'ci-03', name: 'Extracción de Muela del Juicio (Cordal)', unit: 'Por diente', priceUSD: 180 },
      { id: 'ci-04', name: 'Apicectomía', unit: 'Por diente', priceUSD: 250 },
      { id: 'ci-05', name: 'Biopsia de Tejidos Blandos', unit: 'Procedimiento', priceUSD: 120 },
    ]
  },
  {
    category: 'Prótesis Dental',
    items: [
      { id: 'pr-01', name: 'Corona de Porcelana sobre Metal', unit: 'Por diente', priceUSD: 350 },
      { id: 'pr-02', name: 'Corona Totalmente Cerámica (E-Max/Zirconio)', unit: 'Por diente', priceUSD: 500 },
      { id: 'pr-03', name: 'Corona Metálica', unit: 'Por diente', priceUSD: 200 },
      { id: 'pr-04', name: 'Puente Fijo (3 unidades)', unit: 'Puente', priceUSD: 900 },
      { id: 'pr-05', name: 'Prótesis Parcial Removible (Esquelética)', unit: 'Prótesis', priceUSD: 400 },
      { id: 'pr-06', name: 'Prótesis Total / Dentadura Completa', unit: 'Por arcada', priceUSD: 350 },
      { id: 'pr-07', name: 'Overdenture (Retenida por Implantes)', unit: 'Por arcada', priceUSD: 1800 },
    ]
  },
  {
    category: 'Implantología',
    items: [
      { id: 'im-01', name: 'Implante Dental (Titanio)', unit: 'Por implante', priceUSD: 900 },
      { id: 'im-02', name: 'Corona sobre Implante (Porcelana)', unit: 'Por corona', priceUSD: 500 },
      { id: 'im-03', name: 'Injerto Óseo Guiado (GBR)', unit: 'Por zona', priceUSD: 450 },
      { id: 'im-04', name: 'Elevación de Seno Maxilar', unit: 'Por seno', priceUSD: 700 },
    ]
  },
  {
    category: 'Odontología Estética',
    items: [
      { id: 'es-01', name: 'Blanqueamiento Dental Profesional (Lámpara)', unit: 'Sesión', priceUSD: 180 },
      { id: 'es-02', name: 'Blanqueamiento en Casa (Kit)', unit: 'Kit', priceUSD: 80 },
      { id: 'es-03', name: 'Carilla de Porcelana', unit: 'Por diente', priceUSD: 400 },
      { id: 'es-04', name: 'Carilla de Resina Directa', unit: 'Por diente', priceUSD: 120 },
      { id: 'es-05', name: 'Diseño Digital de Sonrisa (DSD)', unit: 'Sesión', priceUSD: 50 },
    ]
  },
  {
    category: 'Ortodoncia',
    items: [
      { id: 'or-01', name: 'Ortodoncia Metálica Tradicional', unit: 'Tratamiento completo', priceUSD: 1800 },
      { id: 'or-02', name: 'Ortodoncia de Zafiro / Cerámica', unit: 'Tratamiento completo', priceUSD: 2500 },
      { id: 'or-03', name: 'Alineadores Transparentes (Invisalign-like)', unit: 'Tratamiento completo', priceUSD: 3500 },
      { id: 'or-04', name: 'Consulta de Ortodoncia', unit: 'Sesión', priceUSD: 30 },
      { id: 'or-05', name: 'Retenedor (Fijo o Removible)', unit: 'Por arcada', priceUSD: 120 },
    ]
  },
  {
    category: 'Odontopediatría',
    items: [
      { id: 'pd-01', name: 'Consulta Pediátrica', unit: 'Sesión', priceUSD: 20 },
      { id: 'pd-02', name: 'Restauración en Diente de Leche', unit: 'Por diente', priceUSD: 30 },
      { id: 'pd-03', name: 'Extracción de Diente Temporal', unit: 'Por diente', priceUSD: 25 },
      { id: 'pd-04', name: 'Corona de Acero (Pediátrica)', unit: 'Por diente', priceUSD: 90 },
      { id: 'pd-05', name: 'Mantenedor de Espacio', unit: 'Por zona', priceUSD: 150 },
    ]
  },
];
