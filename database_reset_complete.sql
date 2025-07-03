-- Script completo para resetear y configurar la base de datos de Supabase
-- Este script combina todos los arreglos y correcciones en un solo archivo

-- PARTE 1: RESETEAR LA BASE DE DATOS
-- Eliminar el esquema público y recrearlo vacío
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
COMMENT ON SCHEMA public IS 'standard public schema';

-- PARTE 2: CREAR TABLAS CON ESTRUCTURA CORRECTA

-- Crear tabla de usuarios con roles
CREATE TABLE usuarios (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('admin', 'secretaria', 'profesor')),
  nombre TEXT,
  apellido TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de cursos
CREATE TABLE cursos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  grado INTEGER NOT NULL,
  seccion TEXT NOT NULL,
  ano_escolar TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de profesores con todas las columnas necesarias
CREATE TABLE profesores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cedula TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  especialidad TEXT,
  telefono TEXT,
  email TEXT,
  direccion TEXT,
  fecha_nacimiento DATE,
  fecha_ingreso DATE,
  titulo TEXT,
  experiencia_anos INTEGER,
  salario NUMERIC(10,2),
  estado TEXT DEFAULT 'activo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de materias
CREATE TABLE materias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  codigo TEXT UNIQUE,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla intermedia para la relación muchos a muchos entre cursos y materias
CREATE TABLE cursos_materias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  curso_id UUID REFERENCES cursos(id) ON DELETE CASCADE,
  materia_id UUID REFERENCES materias(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(curso_id, materia_id)
);

-- Crear tabla de asignaciones de profesores a materias
CREATE TABLE asignaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profesor_id UUID REFERENCES profesores(id) ON DELETE CASCADE,
  materia_id UUID REFERENCES materias(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profesor_id, materia_id)
);

-- Crear tabla de estudiantes con todas las columnas necesarias
CREATE TABLE estudiantes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cedula TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  fecha_nacimiento DATE,
  direccion TEXT,
  telefono TEXT,
  email TEXT,
  curso_id UUID REFERENCES cursos(id),
  seccion TEXT,
  grado TEXT,
  estado TEXT DEFAULT 'activo',
  genero TEXT,
  tipo_sangre TEXT,
  alergias TEXT,
  condiciones_medicas TEXT,
  nacionalidad TEXT,
  lugar_nacimiento TEXT,
  religion TEXT,
  nombre_padre TEXT,
  telefono_padre TEXT,
  email_padre TEXT,
  direccion_padre TEXT,
  nombre_madre TEXT,
  telefono_madre TEXT,
  email_madre TEXT,
  direccion_madre TEXT,
  contacto_emergencia TEXT,
  telefono_emergencia TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de notas
CREATE TABLE notas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  estudiante_id UUID REFERENCES estudiantes(id) ON DELETE CASCADE,
  materia_id UUID REFERENCES materias(id) ON DELETE CASCADE,
  periodo TEXT NOT NULL,
  calificacion NUMERIC(5,2) NOT NULL,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(estudiante_id, materia_id, periodo)
);

-- Crear tabla de pagos
CREATE TABLE pagos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  estudiante_id UUID REFERENCES estudiantes(id) ON DELETE CASCADE,
  concepto TEXT NOT NULL,
  monto NUMERIC(10,2) NOT NULL,
  fecha_pago DATE NOT NULL,
  estado TEXT DEFAULT 'completado' CHECK (estado IN ('pendiente', 'completado', 'cancelado')),
  metodo_pago TEXT,
  referencia TEXT,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de documentos
CREATE TABLE documentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  estudiante_id UUID REFERENCES estudiantes(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL,
  descripcion TEXT,
  archivo_url TEXT NOT NULL,
  tipo_archivo TEXT,
  tamano_kb INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PARTE 3: CREAR VISTAS Y FUNCIONES RPC

-- Crear vista para facilitar la consulta de cursos y materias
CREATE OR REPLACE VIEW vista_cursos_materias AS
SELECT 
  c.id AS curso_id,
  c.nombre AS curso_nombre,
  c.grado AS curso_grado,
  c.seccion AS curso_seccion,
  c.ano_escolar,
  m.id AS materia_id,
  m.nombre AS materia_nombre,
  m.codigo AS materia_codigo,
  m.descripcion AS materia_descripcion
FROM cursos c
JOIN cursos_materias cm ON c.id = cm.curso_id
JOIN materias m ON m.id = cm.materia_id;

-- Función para obtener todos los cursos con conteo de estudiantes y materias
CREATE OR REPLACE FUNCTION get_all_cursos_with_counts()
RETURNS TABLE (
  id UUID,
  nombre TEXT,
  grado INTEGER,
  seccion TEXT,
  ano_escolar TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  estudiantes_count BIGINT,
  materias_count BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.nombre,
    c.grado,
    c.seccion,
    c.ano_escolar,
    c.created_at,
    c.updated_at,
    COUNT(DISTINCT e.id) AS estudiantes_count,
    COUNT(DISTINCT cm.materia_id) AS materias_count
  FROM 
    cursos c
    LEFT JOIN estudiantes e ON c.id = e.curso_id
    LEFT JOIN cursos_materias cm ON c.id = cm.curso_id
  GROUP BY 
    c.id, c.nombre, c.grado, c.seccion, c.ano_escolar, c.created_at, c.updated_at
  ORDER BY 
    c.grado ASC, c.seccion ASC;
END;
$$;

-- Función para asignar una materia a un curso
CREATE OR REPLACE FUNCTION asignar_materia_a_curso(
  p_curso_id UUID,
  p_materia_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_curso_nombre TEXT;
  v_materia_nombre TEXT;
BEGIN
  -- Verificar si el curso existe
  SELECT nombre INTO v_curso_nombre FROM cursos WHERE id = p_curso_id;
  IF v_curso_nombre IS NULL THEN
    RETURN 'Error: Curso no encontrado';
  END IF;
  
  -- Verificar si la materia existe
  SELECT nombre INTO v_materia_nombre FROM materias WHERE id = p_materia_id;
  IF v_materia_nombre IS NULL THEN
    RETURN 'Error: Materia no encontrada';
  END IF;
  
  -- Insertar en la tabla de relación
  INSERT INTO cursos_materias (curso_id, materia_id)
  VALUES (p_curso_id, p_materia_id)
  ON CONFLICT (curso_id, materia_id) DO NOTHING;
  
  RETURN 'Materia ' || v_materia_nombre || ' asignada al curso ' || v_curso_nombre;
END;
$$;

-- Función para eliminar una materia de un curso
CREATE OR REPLACE FUNCTION eliminar_materia_de_curso(
  p_curso_id UUID,
  p_materia_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_curso_nombre TEXT;
  v_materia_nombre TEXT;
  v_filas_eliminadas INTEGER;
BEGIN
  -- Verificar si el curso existe
  SELECT nombre INTO v_curso_nombre FROM cursos WHERE id = p_curso_id;
  IF v_curso_nombre IS NULL THEN
    RETURN 'Error: Curso no encontrado';
  END IF;
  
  -- Verificar si la materia existe
  SELECT nombre INTO v_materia_nombre FROM materias WHERE id = p_materia_id;
  IF v_materia_nombre IS NULL THEN
    RETURN 'Error: Materia no encontrada';
  END IF;
  
  -- Eliminar de la tabla de relación
  DELETE FROM cursos_materias 
  WHERE curso_id = p_curso_id AND materia_id = p_materia_id;
  
  GET DIAGNOSTICS v_filas_eliminadas = ROW_COUNT;
  
  IF v_filas_eliminadas > 0 THEN
    RETURN 'Materia ' || v_materia_nombre || ' eliminada del curso ' || v_curso_nombre;
  ELSE
    RETURN 'La materia no estaba asignada al curso';
  END IF;
END;
$$;

-- PARTE 4: CONFIGURAR PERMISOS Y POLÍTICAS RLS

-- Habilitar Row Level Security en todas las tablas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE profesores ENABLE ROW LEVEL SECURITY;
ALTER TABLE materias ENABLE ROW LEVEL SECURITY;
ALTER TABLE cursos_materias ENABLE ROW LEVEL SECURITY;
ALTER TABLE asignaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios datos" ON usuarios;
DROP POLICY IF EXISTS "Admins pueden ver todos los datos" ON usuarios;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver estudiantes" ON estudiantes;
DROP POLICY IF EXISTS "Solo admins y secretaria pueden modificar estudiantes" ON estudiantes;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver cursos" ON cursos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver profesores" ON profesores;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver materias" ON materias;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver notas" ON notas;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver pagos" ON pagos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver documentos" ON documentos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver cursos_materias" ON cursos_materias;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver asignaciones" ON asignaciones;

-- Crear políticas permisivas para desarrollo
-- NOTA: Para producción, estas políticas deberían ser más restrictivas
CREATE POLICY "Acceso completo a usuarios" ON usuarios FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
CREATE POLICY "Acceso completo a cursos" ON cursos FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
CREATE POLICY "Acceso completo a profesores" ON profesores FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
CREATE POLICY "Acceso completo a materias" ON materias FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
CREATE POLICY "Acceso completo a cursos_materias" ON cursos_materias FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
CREATE POLICY "Acceso completo a asignaciones" ON asignaciones FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
CREATE POLICY "Acceso completo a estudiantes" ON estudiantes FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
CREATE POLICY "Acceso completo a notas" ON notas FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
CREATE POLICY "Acceso completo a pagos" ON pagos FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
CREATE POLICY "Acceso completo a documentos" ON documentos FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

-- Otorgar permisos explícitos a los roles anon y authenticated
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- PARTE 5: INSERTAR DATOS DE PRUEBA

-- Insertar usuario administrador
INSERT INTO usuarios (id, email, rol, nombre, apellido)
VALUES 
  ('6fbde87d-f519-4030-971b-3ece426c4d4f', 'andreslivancon@gmail.com', 'admin', 'Andrés', 'Livan')
ON CONFLICT (id) DO UPDATE 
SET email = EXCLUDED.email, rol = EXCLUDED.rol;

-- Insertar cursos de ejemplo
INSERT INTO cursos (nombre, grado, seccion, ano_escolar)
VALUES 
  ('Primero A', 1, 'A', '2024-2025'),
  ('Primero B', 1, 'B', '2024-2025'),
  ('Segundo A', 2, 'A', '2024-2025'),
  ('Segundo B', 2, 'B', '2024-2025'),
  ('Tercero A', 3, 'A', '2024-2025')
ON CONFLICT DO NOTHING;

-- Insertar profesores de ejemplo
INSERT INTO profesores (cedula, nombre, apellido, especialidad, telefono, email, estado)
VALUES
  ('001-1111111-1', 'Juan', 'Pérez', 'Matemáticas', '809-111-1111', 'juan.perez@ejemplo.com', 'activo'),
  ('001-2222222-2', 'María', 'Rodríguez', 'Lengua Española', '809-222-2222', 'maria.rodriguez@ejemplo.com', 'activo'),
  ('001-3333333-3', 'Carlos', 'Gómez', 'Ciencias Naturales', '809-333-3333', 'carlos.gomez@ejemplo.com', 'activo')
ON CONFLICT DO NOTHING;

-- Insertar materias de ejemplo
INSERT INTO materias (nombre, codigo, descripcion)
VALUES
  ('Matemáticas', 'MAT101', 'Fundamentos de matemáticas'),
  ('Lengua Española', 'LEN101', 'Gramática y literatura'),
  ('Ciencias Naturales', 'CIE101', 'Estudio de la naturaleza'),
  ('Ciencias Sociales', 'SOC101', 'Historia y geografía'),
  ('Inglés', 'ING101', 'Idioma inglés básico')
ON CONFLICT DO NOTHING;

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Base de datos configurada correctamente con todas las correcciones aplicadas';
END $$;
