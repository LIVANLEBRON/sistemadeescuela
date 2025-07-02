import { createClient } from '@supabase/supabase-js'

// Usar directamente las credenciales de Supabase para simplificar el despliegue
const supabaseUrl = 'https://tvcizsllctptvxjzhagh.supabase.co'  // URL real de Supabase
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Y2l6c2xsY3RwdHZ4anpoYWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NjYyOTQsImV4cCI6MjA2NjA0MjI5NH0.1Gzk7YD3Xj2fhyu3IBTpzV5C4zljx5kP7GW41EOrI64'  // Clave anónima real de Supabase

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