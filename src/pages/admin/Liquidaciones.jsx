import React from 'react';
import RecordsPage from '../../components/pro/RecordsPage';
import { usePersistentState } from '../../utils/usePersistentState';
import { localDateStr } from '../../utils/date';
import { money } from '../../utils/format';
import { sucursalNombre } from '../../utils/sucursales';
import { PROFESIONALES_KEY, LIQUIDACIONES_KEY, calcularLiquidacion } from '../../data/proConfig';

const Liquidaciones = () => {
  const [profesionales] = usePersistentState(PROFESIONALES_KEY, []);
  const nombres = profesionales.map(p => p.nombre);

  return (
    <>
      <RecordsPage
        storageKey={PROFESIONALES_KEY}
        title="Profesionales"
        description="Profesionales de la clínica y el porcentaje que se les liquida sobre sus honorarios."
        singular="Profesional"
        emptyRecord={{ nombre: '', especialidad: '', porcentaje: '' }}
        fields={[
          { key: 'nombre', label: 'Nombre', required: true },
          { key: 'especialidad', label: 'Especialidad' },
          { key: 'porcentaje', label: 'Liquidación (%)', type: 'number', step: '0.1', required: true },
        ]}
        columns={[
          { key: 'nombre', label: 'Nombre' },
          { key: 'especialidad', label: 'Especialidad' },
          { key: 'porcentaje', label: 'Liquidación (%)' },
        ]}
        exportName="profesionales"
      />

      <RecordsPage
        storageKey={LIQUIDACIONES_KEY}
        title="Liquidaciones"
        description="Liquidaciones mensuales por profesional. El monto se calcula con el porcentaje del profesional."
        singular="Liquidación"
        emptyRecord={{ periodo: localDateStr(), profesional: nombres[0] || '', sucursalId: '', honorarios: '', estado: 'Pendiente' }}
        transform={(r) => {
          const pro = profesionales.find(p => p.nombre === r.profesional);
          const porcentaje = Number(pro?.porcentaje) || 0;
          return { ...r, porcentaje, monto: calcularLiquidacion(r.honorarios, porcentaje) };
        }}
        fields={[
          { key: 'periodo', label: 'Periodo', type: 'date', required: true },
          { key: 'profesional', label: 'Profesional', type: 'select', required: true, options: nombres.length ? nombres : [''] },
          { key: 'honorarios', label: 'Honorarios brutos ($)', type: 'number', required: true },
          { key: 'sucursalId', label: 'Sucursal', type: 'sucursal' },
          { key: 'estado', label: 'Estado', type: 'select', options: ['Pendiente', 'Pagada'] },
        ]}
        columns={[
          { key: 'periodo', label: 'Periodo' },
          { key: 'profesional', label: 'Profesional' },
          {
            key: 'sucursalId', label: 'Sucursal',
            plain: (r, { sucursales }) => sucursalNombre(sucursales, r.sucursalId),
            render: (r, { sucursales }) => sucursalNombre(sucursales, r.sucursalId),
          },
          { key: 'honorarios', label: 'Honorarios', plain: r => Number(r.honorarios).toFixed(2), render: r => money(r.honorarios) },
          { key: 'porcentaje', label: 'Liquidación (%)' },
          { key: 'monto', label: 'Monto liquidado', plain: r => Number(r.monto).toFixed(2), render: r => money(r.monto) },
          { key: 'estado', label: 'Estado' },
        ]}
        exportName="liquidaciones"
      />
    </>
  );
};

export default Liquidaciones;
