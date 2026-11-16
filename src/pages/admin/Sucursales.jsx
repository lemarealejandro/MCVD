import React from 'react';
import RecordsPage from '../../components/pro/RecordsPage';
import { SUCURSALES_KEY } from '../../utils/sucursales';

const Sucursales = () => (
  <RecordsPage
    storageKey={SUCURSALES_KEY}
    title="Sucursales"
    description="Sedes de la clínica. Gastos, laboratorio, liquidaciones y reportes pueden filtrarse por sucursal."
    singular="Sucursal"
    emptyRecord={{ nombre: '', direccion: '', responsable: '' }}
    fields={[
      { key: 'nombre', label: 'Nombre', required: true, wide: true },
      { key: 'direccion', label: 'Dirección', wide: true },
      { key: 'responsable', label: 'Responsable' },
    ]}
    columns={[
      { key: 'nombre', label: 'Nombre' },
      { key: 'direccion', label: 'Dirección' },
      { key: 'responsable', label: 'Responsable' },
    ]}
    exportName="sucursales"
  />
);

export default Sucursales;
