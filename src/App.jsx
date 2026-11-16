import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import AdminLayout from './components/layout/AdminLayout'
import { isAuthenticated } from './utils/auth'

const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const Agenda = lazy(() => import('./pages/admin/Agenda'))
const Inventory = lazy(() => import('./pages/admin/Inventory'))
const Reportes = lazy(() => import('./pages/admin/Reportes'))
const Sucursales = lazy(() => import('./pages/admin/Sucursales'))
const Gastos = lazy(() => import('./pages/admin/Gastos'))
const Laboratorio = lazy(() => import('./pages/admin/Laboratorio'))
const Convenios = lazy(() => import('./pages/admin/Convenios'))
const Liquidaciones = lazy(() => import('./pages/admin/Liquidaciones'))
const Settings = lazy(() => import('./pages/admin/Settings'))
const PatientsList = lazy(() => import('./pages/admin/PatientsList'))
const PatientHistory = lazy(() => import('./pages/admin/PatientHistory'))
const ImagenologiaLayout = lazy(() => import('./pages/Imagenologia/ImagenologiaLayout'))
const ImagenologiaDashboard = lazy(() => import('./pages/Imagenologia/Dashboard'))
const VisorEstudio = lazy(() => import('./pages/Imagenologia/VisorEstudio'))
const InformesDashboard = lazy(() => import('./pages/Informes/InformesDashboard'))
const ConstructorInformeMejorado = lazy(() => import('./pages/Informes/ConstructorInformeMejorado'))
const Plantillas = lazy(() => import('./pages/Imagenologia/Plantillas'))
const PatientSelfForm = lazy(() => import('./pages/PatientSelfForm'))

const RequireAuth = ({ children }) => {
  const location = useLocation()
  if (!isAuthenticated()) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

function App() {
  return (
    <Suspense fallback={null}>
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      
      <Route path="/admin" element={<RequireAuth><AdminLayout /></RequireAuth>}>
        <Route index element={<Dashboard />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="patients" element={<PatientsList />} />
        <Route path="patients/:id" element={<PatientHistory />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="reportes" element={<Reportes />} />
        <Route path="sucursales" element={<Sucursales />} />
        <Route path="gastos" element={<Gastos />} />
        <Route path="laboratorio" element={<Laboratorio />} />
        <Route path="convenios" element={<Convenios />} />
        <Route path="liquidaciones" element={<Liquidaciones />} />
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
    </Suspense>
  )
}

export default App
