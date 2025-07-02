import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../config/supabase'
import Navigation from './Navigation'
import {
  School,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  CreditCard,
  FileText,
  BarChart3,
  Menu,
  X,
  LogOut,
  User
} from 'lucide-react'

const Layout = ({ children, session, userRole }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error al cerrar sesión:', error)
        return
      }
      console.log('Sesión cerrada correctamente')
      navigate('/')
    } catch (error) {
      console.error('Error inesperado al cerrar sesión:', error)
    }
  }

  const handleNavigation = (path) => {
    console.log('Navegando a:', path)
    navigate(path)
    setSidebarOpen(false)
  }

  // La navegación ahora se maneja en el componente Navigation

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
          <nav className="flex-1 px-4 py-4">
            <ul className="space-y-2">
              {filteredNavigation.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.name} className="mb-1">
                    <Link
                      to={item.href}
                      onClick={() => handleNavigation(item.href)}
                      className={`flex items-center px-3 py-2 rounded-md transition-colors ${location.pathname === item.href
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4 border-b">
            <School className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">EscuelaApp</span>
          </div>
          <nav className="flex-1 px-4 py-4">
            <ul className="space-y-2">
              {filteredNavigation.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.name} className="mb-1">
                    <Link
                      to={item.href}
                      onClick={() => handleNavigation(item.href)}
                      className={`flex items-center px-3 py-2 rounded-md transition-colors ${location.pathname === item.href
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
          
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
                {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
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
                <LogOut className="h-4 w-4" />
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

export default Layout