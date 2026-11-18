// Plan de tratamiento: dientes pendientes de tratar, enviados desde el odontograma.
// Funciones puras sobre la lista `patient.planTratamientos`.

// Enviar un diente al plan. Si ya hay un pendiente para ese diente, lo actualiza
// (hallazgos nuevos) y conserva el procedimiento elegido.
export const enviarAPlan = (lista = [], item, nuevoId) => {
  const ahora = new Date().toISOString();
  const existente = lista.find(p => p.tooth === item.tooth && p.status === 'pendiente');
  if (existente) {
    return lista.map(p => (p.id === existente.id ? { ...p, ...item, updatedAt: ahora } : p));
  }
  return [...lista, { id: nuevoId, procedureId: '', status: 'pendiente', createdAt: ahora, ...item }];
};

export const elegirProcedimiento = (lista = [], id, procedureId) =>
  lista.map(p => (p.id === id ? { ...p, procedureId } : p));

export const quitarDelPlan = (lista = [], id) => lista.filter(p => p.id !== id);

export const dientesPendientes = (lista = []) =>
  lista.filter(p => p.status === 'pendiente').map(p => p.tooth);
