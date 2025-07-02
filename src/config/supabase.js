import { createClient } from '@supabase/supabase-js'

// Obtener las variables de entorno o usar valores de desarrollo
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://xyzcompany.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example-key'

// Mostrar advertencia en lugar de lanzar error
if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
  console.warn('⚠️ Usando valores de desarrollo para Supabase. Configure el archivo .env para producción.')
}

// Crear cliente de Supabase con opciones mejoradas de manejo de errores
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    // Interceptor para mejorar el manejo de errores
    fetch: (...args) => {
      return fetch(...args).catch(error => {
        console.error('Error de red en Supabase:', error)
        throw error
      })
    }
  }
})

// Añadir manejador global de errores para depuración
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Evento de autenticación:', event, session ? 'Con sesión' : 'Sin sesión')
})

// Función para manejar errores de Supabase
export const handleSupabaseError = (error) => {
  if (!error) return 'Error desconocido';
  
  // Convertir el error a un formato legible
  let errorDetails;
  try {
    if (typeof error === 'object') {
      errorDetails = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
    } else {
      errorDetails = String(error);
    }
    console.error('Error de Supabase:', errorDetails);
  } catch (e) {
    console.error('Error al procesar el objeto de error:', e);
    errorDetails = 'No se pudo procesar el error';
  }
  
  // Extraer el mensaje de error según su estructura
  const errorMessage = 
    error.message || 
    error.error_description || 
    (error.details ? String(error.details) : 'Error desconocido');
  
  return `Error: ${errorMessage}`;
}

// Configuración de roles
export const ROLES = {
  ADMIN: 'admin',
  SECRETARIA: 'secretaria',
  PROFESOR: 'profesor'
}

// Configuración de tablas
export const TABLES = {
  ESTUDIANTES: 'estudiantes',
  PROFESORES: 'profesores',
  CURSOS: 'cursos',
  MATERIAS: 'materias',
  NOTAS: 'notas',
  PAGOS: 'pagos',
  DOCUMENTOS: 'documentos',
  USUARIOS: 'usuarios'
}