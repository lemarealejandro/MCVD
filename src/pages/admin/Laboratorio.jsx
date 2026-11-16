import React from 'react';
import RecordsPage from '../../components/pro/RecordsPage';
import { localDateStr } from '../../utils/date';
import { money } from '../../utils/format';
import { sucursalNombre } from '../../utils/sucursales';
import { ESTADOS_LAB } from '../../data/proConfig';

const Laboratorio = () => (
  <RecordsPage
    storageKey="clinicplus_laboratorio"
    title="Laboratorio"
    description="Órdenes enviadas a laboratorio dental: seguimiento de estado y costo."
    singular="Orden"
    emptyRecord={{ fecha: localDateStr(), paciente: '', trabajo: '', laboratorio: '', estado: ESTADOS_LAB[0], costo: '', sucursalId: '' }}
    fields={[
      { key: 'fecha', label: 'Fecha', type: 'date', required: true },
      { key: 'paciente', label: 'Paciente', required: true },
      { key: 'trabajo', label: 'Trabajo (corona, prótesis, etc.)', required: true },
      { key: 'laboratorio', label: 'Laboratorio' },
      { key: 'estado', label: 'Estado', type: 'select', options: ESTADOS_LAB },
      { key: 'costo', label: 'Costo ($)', type: 'number' },
      { key: 'sucursalId', label: 'Sucursal', type: 'sucursal', wide: true },
    ]}
    columns={[
      { key: 'fecha', label: 'Fecha' },
      { key: 'paciente', label: 'Paciente' },
      { key: 'trabajo', label: 'Trabajo' },
      { key: 'laboratorio', label: 'Laboratorio' },
      { key: 'estado', label: 'Estado' },
      { key: 'costo', label: 'Costo', plain: r => Number(r.costo).toFixed(2), render: r => money(r.costo) },
      {
        key: 'sucursalId', label: 'Sucursal',
        plain: (r, { sucursales }) => sucursalNombre(sucursales, r.sucursalId),
        render: (r, { sucursales }) => sucursalNombre(sucursales, r.sucursalId),
      },
    ]}
    exportName="laboratorio"
  />
);

export default Laboratorio;
