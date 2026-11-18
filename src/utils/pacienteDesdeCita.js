// Crear o vincular la ficha de paciente cuando una cita se confirma.
// Funciones puras: reciben el mapa de pacientes y devuelven el mapa nuevo.

// "15.234.567-8" y "152345678" son el mismo RUT.
export const normalizarRut = (rut) => String(rut || '').replace(/[^0-9kK]/g, '').toUpperCase();

const normalizarNombre = (nombre) => String(nombre || '').trim().replace(/\s+/g, ' ').toLowerCase();

export const edadDesde = (dob) => {
  if (!dob) return '';
  const nac = new Date(dob);
  if (isNaN(nac)) return '';
  const hoy = new Date();
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad -= 1;
  return edad >= 0 ? edad : '';
};

// Datos de la cita que pertenecen a la ficha del paciente.
const datosDePaciente = (apt) => ({
  name: apt.patient?.trim() || '',
  rut: apt.patientRut?.trim() || '',
  dob: apt.patientDob || '',
  gender: apt.patientGender || '',
  address: apt.patientAddress?.trim() || '',
  phone: apt.patientPhone?.trim() || '',
  email: apt.patientEmail?.trim() || '',
});

// Busca la ficha que corresponde a la cita. Devuelve el id o null.
export const buscarPacienteDeCita = (patients, apt) => {
  // Primero por id ya vinculado.
  if (apt.patientId && patients[apt.patientId]) return apt.patientId;

  const rut = normalizarRut(apt.patientRut);
  const nombre = normalizarNombre(apt.patient);
  const lista = Object.values(patients);

  if (rut) {
    const porRut = lista.find(p => normalizarRut(p.rut) === rut);
    return porRut ? porRut.id : null;
  }

  // Sin RUT: solo se empareja por nombre si es inequívoco.
  const coincidencias = lista.filter(p => normalizarNombre(p.name) === nombre);
  return coincidencias.length === 1 ? coincidencias[0].id : null;
};

// Devuelve { patients, patientId }. Si ya existe, completa solo los campos vacíos;
// si no existe, crea la ficha con el id que se pasa.
export const asegurarPacienteDeCita = (patients, apt, nuevoId) => {
  const datos = datosDePaciente(apt);
  const existenteId = buscarPacienteDeCita(patients, apt);

  if (existenteId) {
    const actual = patients[existenteId];
    const completados = {};
    Object.entries(datos).forEach(([campo, valor]) => {
      if (valor && !actual[campo]) completados[campo] = valor;
    });
    if (actual.age === undefined || actual.age === '') {
      const edad = edadDesde(datos.dob);
      if (edad !== '') completados.age = edad;
    }
    if (Object.keys(completados).length === 0) {
      return { patients, patientId: existenteId };
    }
    return {
      patients: { ...patients, [existenteId]: { ...actual, ...completados } },
      patientId: existenteId,
    };
  }

  const ficha = {
    id: nuevoId,
    ...datos,
    age: edadDesde(datos.dob),
    bloodType: '',
    status: 'Activo',
    lastVisit: apt.date,
    allergies: [],
    medications: [],
    chronicDiseases: [],
    vitalSigns: { bloodPressure: 'N/A', heartRate: 'N/A', lastCheck: 'N/A' },
    treatments: [],
    odontogramData: {},
    origen: 'agenda',
  };
  return { patients: { ...patients, [nuevoId]: ficha }, patientId: nuevoId };
};

// Campos que el formulario de cita exige para confirmar.
export const faltantesParaConfirmar = (apt) => {
  const faltan = [];
  if (!apt.patient?.trim()) faltan.push('nombre del paciente');
  if (!normalizarRut(apt.patientRut)) faltan.push('RUT');
  return faltan;
};

// Id nuevo para una ficha creada desde la agenda.
export const nuevoIdPaciente = () => Date.now().toString();
