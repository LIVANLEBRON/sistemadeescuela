import { supabase } from '../config/supabase';

/**
 * Función para inicializar la base de datos con datos de prueba
 * Esta función se ejecutará automáticamente al iniciar la aplicación
 * si no hay usuarios en la base de datos
 */
export const initializeDatabase = async () => {
  try {
    console.log('Verificando si la base de datos necesita inicialización...');
    
    // Verificar si ya existen usuarios
    const { data: existingUsers, error: usersError } = await supabase
      .from('usuarios')
      .select('id')
      .limit(1);
    
    if (usersError) {
      console.error('Error al verificar usuarios existentes:', usersError);
      return;
    }
    
    // Si ya hay usuarios, no hacer nada
    if (existingUsers && existingUsers.length > 0) {
      console.log('La base de datos ya está inicializada.');
      return;
    }
    
    console.log('Inicializando la base de datos con datos de prueba...');
    
    // Crear usuarios de prueba en Auth
    const users = [
      { email: 'admin@escuela.com', password: 'admin123', rol: 'admin' },
      { email: 'secretaria@escuela.com', password: 'secretaria123', rol: 'secretaria' },
      { email: 'profesor@escuela.com', password: 'profesor123', rol: 'profesor' }
    ];
    
    // Crear usuarios en Auth y en la tabla usuarios
    for (const user of users) {
      try {
        // Crear usuario en Auth
        const { data: authUser, error: authError } = await supabase.auth.signUp({
          email: user.email,
          password: user.password
        });
        
        if (authError) {
          console.error(`Error al crear usuario ${user.email}:`, authError);
          continue;
        }
        
        // Insertar en la tabla usuarios
        const { error: insertError } = await supabase
          .from('usuarios')
          .insert([{
            id: authUser.user.id,
            email: user.email,
            rol: user.rol,
            nombre: user.rol.charAt(0).toUpperCase() + user.rol.slice(1),
            apellido: 'Demo'
          }]);
        
        if (insertError) {
          console.error(`Error al insertar usuario ${user.email} en la tabla:`, insertError);
        } else {
          console.log(`Usuario ${user.email} creado correctamente.`);
        }
      } catch (error) {
        console.error(`Error al procesar usuario ${user.email}:`, error);
      }
    }
    
    console.log('Inicialización de la base de datos completada.');
  } catch (error) {
    console.error('Error durante la inicialización de la base de datos:', error);
  }
};

/**
 * Función para verificar y crear las tablas necesarias si no existen
 */
export const ensureTablesExist = async () => {
  try {
    console.log('Verificando tablas necesarias...');
    
    // Lista de tablas necesarias y sus definiciones SQL
    const requiredTables = [
      {
        name: 'usuarios',
        sql: `
          CREATE TABLE IF NOT EXISTS usuarios (
            id UUID PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            rol TEXT NOT NULL CHECK (rol IN ('admin', 'secretaria', 'profesor')),
            nombre TEXT,
            apellido TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      },
      {
        name: 'estudiantes',
        sql: `
          CREATE TABLE IF NOT EXISTS estudiantes (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            cedula TEXT UNIQUE NOT NULL,
            nombre TEXT NOT NULL,
            apellido TEXT NOT NULL,
            fecha_nacimiento DATE,
            direccion TEXT,
            telefono TEXT,
            email TEXT,
            nombre_padre TEXT,
            telefono_padre TEXT,
            nombre_madre TEXT,
            telefono_madre TEXT,
            curso_id UUID,
            estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      },
      // Añadir más tablas según sea necesario
    ];
    
    // Verificar cada tabla
    for (const table of requiredTables) {
      // Verificar si la tabla existe
      const { data, error } = await supabase
        .from(table.name)
        .select('id')
        .limit(1);
      
      if (error && error.code === '42P01') { // Código para "tabla no existe"
        console.log(`Tabla ${table.name} no existe. Creando...`);
        
        // Crear la tabla usando SQL
        const { error: sqlError } = await supabase
          .rpc('execute_sql', { sql_query: table.sql });
        
        if (sqlError) {
          console.error(`Error al crear tabla ${table.name}:`, sqlError);
        } else {
          console.log(`Tabla ${table.name} creada correctamente.`);
        }
      } else if (error) {
        console.error(`Error al verificar tabla ${table.name}:`, error);
      } else {
        console.log(`Tabla ${table.name} ya existe.`);
      }
    }
    
    console.log('Verificación de tablas completada.');
  } catch (error) {
    console.error('Error durante la verificación de tablas:', error);
  }
};
