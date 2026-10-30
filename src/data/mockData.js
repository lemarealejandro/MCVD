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
