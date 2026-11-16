import React from 'react';
import RecordsPage from '../../components/pro/RecordsPage';
import { localDateStr } from '../../utils/date';
import { money } from '../../utils/format';
import { sucursalNombre } from '../../utils/sucursales';
import { CATEGORIAS_GASTO } from '../../data/proConfig';

const Gastos = () => (
  <RecordsPage
    storageKey="clinicplus_gastos"
    title="Gastos"
    description="Registro de gastos operativos por categoría y sucursal."
    singular="Gasto"
    emptyRecord={{ fecha: localDateStr(), categoria: CATEGORIAS_GASTO[0], descripcion: '', monto: '', sucursalId: '' }}
    fields={[
      { key: 'fecha', label: 'Fecha', type: 'date', required: true },
      { key: 'categoria', label: 'Categoría', type: 'select', options: CATEGORIAS_GASTO },
      { key: 'monto', label: 'Monto ($)', type: 'number', required: true },
      { key: 'sucursalId', label: 'Sucursal', type: 'sucursal' },
      { key: 'descripcion', label: 'Descripción', wide: true, required: true },
    ]}
    columns={[
      { key: 'fecha', label: 'Fecha' },
      { key: 'categoria', label: 'Categoría' },
      { key: 'descripcion', label: 'Descripción' },
      {
        key: 'sucursalId', label: 'Sucursal',
        plain: (r, { sucursales }) => sucursalNombre(sucursales, r.sucursalId),
        render: (r, { sucursales }) => sucursalNombre(sucursales, r.sucursalId),
      },
      { key: 'monto', label: 'Monto', plain: r => Number(r.monto).toFixed(2), render: r => money(r.monto) },
    ]}
    exportName="gastos"
  />
);

export default Gastos;
