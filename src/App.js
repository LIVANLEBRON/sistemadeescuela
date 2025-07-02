import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { supabase, handleSupabaseError } from './config/supabase'
import { initializeDatabase } from './utils/initializeDatabase'
import { formatError } from './utils/errorHandler'
import Login from './components/Auth/Login'
import Dashboard from './components/Dashboard/Dashboard'
import StudentManagement from './components/Students/StudentManagement'
import TeacherManagement from './components/Teachers/TeacherManagement'
import CourseManagement from './components/Courses/CourseManagement'
import GradeManagement from './components/Grades/GradeManagement'
import PaymentManagement from './components/Payments/PaymentManagement'
import DocumentManagement from './components/Documents/DocumentManagement'
import Reports from './components/Reports/Reports'
import LayoutNew from './components/Layout/LayoutNew'
import LoadingSpinner from './components/Common/LoadingSpinner'
import './App.css'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)

  // Función para obtener el rol del usuario
  const fetchUserRole = async (userId) => {
    try {
      console.log('Obteniendo rol para usuario:', userId)
      const { data, error } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error al obtener rol de usuario:')
        console.error(formatError(error))
        handleSupabaseError(error)
        console.log('Asignando rol por defecto: profesor')
        setUserRole('profesor') // Asignar rol por defecto
      } else if (data && data.rol) {
        console.log('Rol obtenido correctamente:', data.rol)
        setUserRole(data.rol)
      } else {
        console.log('No se encontró rol, asignando rol por defecto: profesor')
        setUserRole('profesor')
      }
    } catch (error) {
      console.error('Error inesperado al obtener rol:')
      console.error(formatError(error))
      console.log('Asignando rol por defecto: profesor')
      setUserRole('profesor') // Asignar rol por defecto en caso de error
    } finally {
      setLoading(false) // Actualizar estado de carga después de obtener el rol
    }
  }

  useEffect(() => {
    // Función para obtener la sesión inicial
    const getInitialSession = async () => {
      try {
        setLoading(true)
        console.log('Obteniendo sesión inicial...')
        
        // Inicializar base de datos si es necesario
        await initializeDatabase()
        
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Sesión obtenida:', session ? 'Activa' : 'Inactiva')
        
        setSession(session)
        
        if (session?.user?.id) {
          await fetchUserRole(session.user.id)
        } else {
          setLoading(false) // Importante: actualizar estado de carga si no hay sesión
        }
      } catch (error) {
        console.error('Error al obtener la sesión inicial:')
        console.error(formatError(error))
        setLoading(false) // Actualizar estado de carga en caso de error
      }
    }

    // Ejecutar la función para obtener la sesión inicial
    getInitialSession()

    // Configurar el listener para cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Evento de autenticación:', event)
        setSession(session)
        
        if (session?.user?.id) {
          await fetchUserRole(session.user.id)
        } else {
          setUserRole(null)
          setLoading(false) // Actualizar estado de carga cuando se cierra sesión
        }
      }
    )

    // Limpiar el listener cuando se desmonte el componente
    return () => {
      subscription.unsubscribe()
    }
  }, []) // Array vacío para que solo se ejecute una vez al montar el componente

  if (loading) {
    return <LoadingSpinner />
  }

  if (!session) {
    return <Login />
  }

  return (
    <Router>
      <LayoutNew session={session} userRole={userRole}>
        <Routes>
          <Route path="/" element={<Dashboard userRole={userRole} />} />
          
          {/* Todas las rutas disponibles para todos los usuarios */}
          <Route path="/estudiantes" element={<StudentManagement />} />
          <Route path="/profesores" element={<TeacherManagement />} />
          <Route path="/cursos" element={<CourseManagement />} />
          <Route path="/notas" element={<GradeManagement />} />
          <Route path="/pagos" element={<PaymentManagement />} />
          <Route path="/documentos" element={<DocumentManagement />} />
          <Route path="/reportes" element={<Reports />} />
          
          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </LayoutNew>
    </Router>
  )
}

export default App