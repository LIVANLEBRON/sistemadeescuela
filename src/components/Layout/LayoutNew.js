import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase, handleSupabaseError } from '../../config/supabase'
import Navigation from './Navigation'
import {
  School,
  Menu,
  X,
  LogOut,
  User
} from 'lucide-react'

const LayoutNew = ({ children, session, userRole }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    try {
      console.log('Intentando cerrar sesión...')
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error al cerrar sesión:')
        handleSupabaseError(error)
        return
      }
      console.log('Sesión cerrada correctamente')
      navigate('/')
    } catch (error) {
      console.error('Error inesperado al cerrar sesión:')
      handleSupabaseError(error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4 border-b">
            <div className="flex items-center">
              <School className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">EscuelaApp</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Navegación móvil */}
          <Navigation userRole={userRole} />
          
          {/* User info and logout */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center mb-3">
              <div className="bg-gray-100 p-2 rounded-full">
                <User className="h-5 w-5 text-gray-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {session?.user?.email}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {userRole}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4 border-b">
            <div className="flex items-center">
              <School className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">EscuelaApp</span>
            </div>
          </div>
          
          {/* Navegación desktop */}
          <Navigation userRole={userRole} />
          
          {/* User info and logout */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center mb-3">
              <div className="bg-gray-100 p-2 rounded-full">
                <User className="h-5 w-5 text-gray-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {session?.user?.email}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {userRole}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <h1 className="text-lg font-semibold text-gray-900">
                {location.pathname === '/' ? 'Dashboard' : 
                 location.pathname === '/estudiantes' ? 'Estudiantes' :
                 location.pathname === '/profesores' ? 'Profesores' :
                 location.pathname === '/cursos' ? 'Cursos y Materias' :
                 location.pathname === '/notas' ? 'Notas' :
                 location.pathname === '/pagos' ? 'Pagos' :
                 location.pathname === '/documentos' ? 'Documentos' :
                 location.pathname === '/reportes' ? 'Reportes' : 'Dashboard'}
              </h1>
            </div>
            
            <div className="flex items-center gap-x-4 lg:gap-x-6 ml-auto">
              <div className="hidden lg:block">
                <div className="flex items-center gap-x-2">
                  <div className="bg-gray-100 p-2 rounded-full">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {session?.user?.email}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {userRole}
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="hidden lg:flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default LayoutNew
