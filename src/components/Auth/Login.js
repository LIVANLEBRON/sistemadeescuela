import React, { useState } from 'react'
import { supabase, handleSupabaseError } from '../../config/supabase'
import { Eye, EyeOff, School, Mail, Lock } from 'lucide-react'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('Intentando iniciar sesión con:', { email })
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Error de inicio de sesión:', error)
        setError(handleSupabaseError(error))
        return
      }
      
      console.log('Inicio de sesión exitoso:', data.user?.email)
    } catch (error) {
      console.error('Error inesperado durante el inicio de sesión:', error)
      setError('Error de conexión. Intente nuevamente. Detalles: ' + (error.message || 'Desconocido'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <School className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Sistema Escolar
            </h2>
            <p className="text-gray-600">
              Ingrese sus credenciales para acceder
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-error mb-6">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="form-input pl-10"
                  placeholder="usuario@escuela.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="form-input pl-10 pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary py-3 text-base"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="spinner w-5 h-5 mr-2"></div>
                    Iniciando sesión...
                  </div>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              ¿Problemas para acceder?{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500">
                Contacte al administrador
              </a>
            </p>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Credenciales de Prueba
          </h3>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Administrador:</strong>
              <br />
              Email: admin@escuela.com
              <br />
              Contraseña: admin123
            </div>
            <div>
              <strong>Secretaría:</strong>
              <br />
              Email: secretaria@escuela.com
              <br />
              Contraseña: secretaria123
            </div>
            <div>
              <strong>Profesor:</strong>
              <br />
              Email: profesor@escuela.com
              <br />
              Contraseña: profesor123
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login