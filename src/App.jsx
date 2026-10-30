import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import AdminLayout from './components/layout/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import Agenda from './pages/admin/Agenda'
import Inventory from './pages/admin/Inventory'
import Settings from './pages/admin/Settings'
import PatientsList from './pages/admin/PatientsList'
import PatientHistory from './pages/admin/PatientHistory'
import ImagenologiaLayout from './pages/Imagenologia/ImagenologiaLayout'
import ImagenologiaDashboard from './pages/Imagenologia/Dashboard'
import VisorEstudio from './pages/Imagenologia/VisorEstudio'
import InformesDashboard from './pages/Informes/InformesDashboard'
import ConstructorInformeMejorado from './pages/Informes/ConstructorInformeMejorado'
import Plantillas from './pages/Imagenologia/Plantillas'
import PatientSelfForm from './pages/PatientSelfForm'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="patients" element={<PatientsList />} />
        <Route path="patients/:id" element={<PatientHistory />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="settings" element={<Settings />} />
        
        {/* Rutas de Imagenología */}
        <Route path="imagenologia" element={<ImagenologiaLayout />}>
          <Route index element={<ImagenologiaDashboard />} />
          <Route path="estudio/:id" element={<VisorEstudio />} />
          <Route path="plantillas" element={<Plantillas />} />
        </Route>

        {/* Rutas de Informes Radiológicos */}
        <Route path="informes">
          <Route index element={<InformesDashboard />} />
          <Route path="constructor/:id" element={<ConstructorInformeMejorado />} />
        </Route>
      </Route>
      
      {/* Ruta pública para que el paciente llene su historia clínica */}
      <Route path="/paciente/ficha/:patientId" element={<PatientSelfForm />} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
