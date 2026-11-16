import { localDateStr } from '../utils/date';

export const initialPatients = {
  '1': {
    id: '1',
    name: 'María Rodríguez',
    rut: '15.234.567-8',
    age: 34,
    dob: '1992-03-15',
    phone: '+56 9 1234 5678',
    email: 'maria.rodriguez@email.com',
    address: 'Av. Providencia 1234, Santiago',
    bloodType: 'O+',
    allergies: ['Penicilina', 'Látex (Leve)'],
    medications: ['Eutirox 50mcg'],
    chronicDiseases: ['Hipotiroidismo'],
    lastVisit: '2026-05-15',
    status: 'Activo',
    vitalSigns: {
      bloodPressure: '120/80 mmHg',
      heartRate: '72 lpm',
      lastCheck: '2026-05-15'
    },
    treatments: [
      { id: 101, date: '2026-05-15', procedure: 'Limpieza Dental Ultrasonido', tooth: 'Toda la boca', notes: 'Paciente presentó ligero sangrado en encías.', doctor: 'Dr. López' },
      { id: 102, date: '2025-10-10', procedure: 'Restauración Resina Simple', tooth: '14', notes: 'Caries de esmalte.', doctor: 'Dra. Martínez' },
    ],
    odontogramData: {
      '14': { center: 'caries' },
      '38': { whole: 'absent' }
    }
  },
  '2': {
    id: '2',
    name: 'Juan Pérez',
    rut: '18.987.654-3',
    age: 28,
    dob: '1998-07-22',
    phone: '+56 9 8765 4321',
    email: 'juan.perez@email.com',
    address: 'Calle Falsa 123',
    bloodType: 'A+',
    allergies: [],
    medications: [],
    chronicDiseases: [],
    lastVisit: '2026-06-01',
    status: 'Activo',
    vitalSigns: {
      bloodPressure: '110/70 mmHg',
      heartRate: '65 lpm',
      lastCheck: '2026-06-01'
    },
    treatments: [],
    odontogramData: {}
  }
};

const daysFromToday = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return localDateStr(d);
};

export const createInitialAppointments = () => [
  { id: 1, patient: 'María Rodríguez', patientEmail: 'maria.rodriguez@email.com', patientPhone: '+58 412 123 4567', service: 'Limpieza Dental', date: daysFromToday(0), time: '09:00', duration: 60, status: 'Confirmada', notes: '', doctor: 'Dr. López' },
  { id: 2, patient: 'Juan Pérez', patientEmail: 'juan.perez@email.com', patientPhone: '+58 416 987 6543', service: 'Extracción Simple', date: daysFromToday(0), time: '11:00', duration: 45, status: 'Pendiente', notes: 'Paciente nervioso', doctor: 'Dr. López' },
  { id: 3, patient: 'Ana Gómez', patientEmail: '', patientPhone: '', service: 'Blanqueamiento', date: daysFromToday(1), time: '15:00', duration: 90, status: 'Confirmada', notes: '', doctor: 'Dra. Martínez' },
  { id: 4, patient: 'Carlos López', patientEmail: '', patientPhone: '', service: 'Consulta General', date: daysFromToday(2), time: '16:00', duration: 30, status: 'Cancelada', notes: '', doctor: 'Dr. López' },
];

export const initialInventory = [
  { id: 1, item: 'Anestesia Local (Cajas)', category: 'Insumos Clínicos', quantity: 15, minStock: 5, priceUsd: 25.50 },
  { id: 2, item: 'Guantes de Látex Talla M', category: 'Material Desechable', quantity: 3, minStock: 10, priceUsd: 8.00 },
  { id: 3, item: 'Mascarillas Quirúrgicas', category: 'Material Desechable', quantity: 50, minStock: 20, priceUsd: 4.50 },
  { id: 4, item: 'Jeringas Desechables 5ml', category: 'Insumos Clínicos', quantity: 120, minStock: 50, priceUsd: 0.15 },
  { id: 5, item: 'Resina Compuesta (Kit)', category: 'Material Dental', quantity: 2, minStock: 3, priceUsd: 45.00 },
];

export const initialEstudios = [
  { id: 1, paciente: 'Juan Pérez', tipo: 'Tomografía CBCT', fecha: '2023-10-24', estado: 'Pendiente' },
  { id: 2, paciente: 'María García', tipo: 'Radiografía Panorámica', fecha: '2023-10-23', estado: 'Informado' },
  { id: 3, paciente: 'Carlos López', tipo: 'Radiografía Periapical', fecha: '2023-10-22', estado: 'Pendiente' },
];

export const mockInformes = [
  {
    id: 101, paciente: 'Juan Pérez', rut: '12.345.678-9',
    estudio: 'CBCT Maxilar Superior', tipo: 'Tomografía CBCT',
    fecha: '24 Oct 2023', medico: 'Dr. Rodríguez',
    estado: 'Borrador', bloques: 4, imagenes: 2
  },
  {
    id: 102, paciente: 'María García', rut: '9.876.543-2',
    estudio: 'Radiografía Panorámica', tipo: 'Panorámica',
    fecha: '23 Oct 2023', medico: 'Dr. Rodríguez',
    estado: 'Finalizado', bloques: 6, imagenes: 3
  },
  {
    id: 103, paciente: 'Carlos Fuentes', rut: '15.123.456-7',
    estudio: 'Periapical Zona Anterior', tipo: 'Periapical',
    fecha: '22 Oct 2023', medico: 'Dra. Martínez',
    estado: 'Finalizado', bloques: 5, imagenes: 1
  },
  {
    id: 104, paciente: 'Ana Torres', rut: '11.222.333-4',
    estudio: 'Bite-Wing Bilateral', tipo: 'Bite-Wing',
    fecha: '21 Oct 2023', medico: 'Dra. Martínez',
    estado: 'Pendiente', bloques: 0, imagenes: 0
  },
];
