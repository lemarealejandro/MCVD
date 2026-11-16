import React from 'react';
import RecordsPage from '../../components/pro/RecordsPage';
import { TIPOS_CONVENIO } from '../../data/proConfig';

const Convenios = () => (
  <RecordsPage
    storageKey="clinicplus_convenios"
    title="Convenios"
    description="Acuerdos con aseguradoras, empresas y particulares, con su descuento vigente."
    singular="Convenio"
    emptyRecord={{ nombre: '', tipo: TIPOS_CONVENIO[0], descuento: '', vigente: 'Sí', notas: '' }}
    fields={[
      { key: 'nombre', label: 'Nombre', required: true, wide: true },
      { key: 'tipo', label: 'Tipo', type: 'select', options: TIPOS_CONVENIO },
      { key: 'descuento', label: 'Descuento (%)', type: 'number', step: '0.1', required: true },
      { key: 'vigente', label: 'Vigente', type: 'select', options: ['Sí', 'No'] },
      { key: 'notas', label: 'Notas', wide: true },
    ]}
    columns={[
      { key: 'nombre', label: 'Nombre' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'descuento', label: 'Descuento (%)' },
      { key: 'vigente', label: 'Vigente' },
      { key: 'notas', label: 'Notas' },
    ]}
    exportName="convenios"
  />
);

export default Convenios;
