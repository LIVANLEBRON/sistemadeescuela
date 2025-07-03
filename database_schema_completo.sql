-- SCRIPT COMPLETO DE BASE DE DATOS PARA SISTEMA DE GESTIÓN ESCOLAR
-- Este script está diseñado para resolver todos los problemas identificados en el proyecto

-- PARTE 1: RESETEAR LA BASE DE DATOS
-- Eliminar el esquema público y recrearlo vacío para evitar conflictos
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
COMMENT ON SCHEMA public IS 'standard public schema';

-- PARTE 2: CREAR TABLAS CON ESTRUCTURA CORRECTA

-- Tabla de usuarios con roles (admin, secretaria, profesor)
CREATE TABLE usuarios (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('admin', 'secretaria', 'profesor')),
  nombre TEXT,
  apellido TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de cursos (grados escolares)
CREATE TABLE cursos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  grado INTEGER NOT NULL,
  seccion TEXT NOT NULL,
  descripcion TEXT,
  capacidad_maxima INTEGER,
  ano_escolar TEXT NOT NULL,
  estado TEXT DEFAULT 'activo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de profesores con todas las columnas necesarias
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

-- Tabla de materias
CREATE TABLE materias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  codigo TEXT UNIQUE,
  descripcion TEXT,
  creditos INTEGER,
  horas_semanales INTEGER,
  estado TEXT DEFAULT 'activo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla intermedia para la relación muchos a muchos entre cursos y materias
CREATE TABLE cursos_materias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  curso_id UUID REFERENCES cursos(id) ON DELETE CASCADE,
  materia_id UUID REFERENCES materias(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(curso_id, materia_id)
);

-- Tabla de asignaciones de profesores a materias
CREATE TABLE asignaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profesor_id UUID REFERENCES profesores(id) ON DELETE CASCADE,
  materia_id UUID REFERENCES materias(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profesor_id, materia_id)
);

-- Tabla de estudiantes con todas las columnas necesarias
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

-- Tabla de notas
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

-- Tabla de pagos
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

-- Tabla de documentos
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
  descripcion TEXT,
  capacidad_maxima INTEGER,
  ano_escolar TEXT,
  estado TEXT,
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
    c.descripcion,
    c.capacidad_maxima,
    c.ano_escolar,
    c.estado,
    c.created_at,
    c.updated_at,
    COUNT(DISTINCT e.id) AS estudiantes_count,
    COUNT(DISTINCT cm.materia_id) AS materias_count
  FROM 
    cursos c
    LEFT JOIN estudiantes e ON c.id = e.curso_id
    LEFT JOIN cursos_materias cm ON c.id = cm.curso_id
  GROUP BY 
    c.id, c.nombre, c.grado, c.seccion, c.descripcion, c.capacidad_maxima, c.ano_escolar, c.estado, c.created_at, c.updated_at
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

-- Función para obtener materias con sus cursos y profesores asignados
CREATE OR REPLACE FUNCTION get_materias_with_relations()
RETURNS TABLE (
  id UUID,
  nombre TEXT,
  codigo TEXT,
  descripcion TEXT,
  creditos INTEGER,
  horas_semanales INTEGER,
  estado TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  cursos JSON,
  profesores JSON
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.nombre,
    m.codigo,
    m.descripcion,
    m.creditos,
    m.horas_semanales,
    m.estado,
    m.created_at,
    m.updated_at,
    COALESCE(
      (SELECT json_agg(json_build_object(
        'id', c.id,
        'nombre', c.nombre,
        'grado', c.grado,
        'seccion', c.seccion
      ))
      FROM cursos c
      JOIN cursos_materias cm ON c.id = cm.curso_id
      WHERE cm.materia_id = m.id), '[]'::json
    ) AS cursos,
    COALESCE(
      (SELECT json_agg(json_build_object(
        'id', p.id,
        'nombre', p.nombre,
        'apellido', p.apellido,
        'especialidad', p.especialidad
      ))
      FROM profesores p
      JOIN asignaciones a ON p.id = a.profesor_id
      WHERE a.materia_id = m.id), '[]'::json
    ) AS profesores
  FROM 
    materias m
  ORDER BY 
    m.nombre ASC;
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

-- Insertar usuario administrador (ajusta el ID según tu usuario de Supabase)
INSERT INTO usuarios (id, email, rol, nombre, apellido)
VALUES 
  ('6fbde87d-f519-4030-971b-3ece426c4d4f', 'andreslivancon@gmail.com', 'admin', 'Andrés', 'Livan')
ON CONFLICT (id) DO UPDATE 
SET email = EXCLUDED.email, rol = EXCLUDED.rol;

-- Insertar cursos de ejemplo
INSERT INTO cursos (nombre, grado, seccion, ano_escolar, descripcion, capacidad_maxima)
VALUES 
  ('Primero A', 1, 'A', '2024-2025', 'Primer grado sección A', 30),
  ('Primero B', 1, 'B', '2024-2025', 'Primer grado sección B', 30),
  ('Segundo A', 2, 'A', '2024-2025', 'Segundo grado sección A', 30),
  ('Segundo B', 2, 'B', '2024-2025', 'Segundo grado sección B', 30),
  ('Tercero A', 3, 'A', '2024-2025', 'Tercer grado sección A', 30)
ON CONFLICT DO NOTHING;

-- Insertar profesores de ejemplo
INSERT INTO profesores (cedula, nombre, apellido, especialidad, telefono, email, direccion, titulo, experiencia_anos, salario, estado)
VALUES
  ('001-1111111-1', 'Juan', 'Pérez', 'Matemáticas', '809-111-1111', 'juan.perez@ejemplo.com', 'Calle Principal #1, Santo Domingo', 'Licenciado en Educación', 5, 35000.00, 'activo'),
  ('001-2222222-2', 'María', 'Rodríguez', 'Lengua Española', '809-222-2222', 'maria.rodriguez@ejemplo.com', 'Avenida Central #2, Santiago', 'Máster en Literatura', 8, 42000.00, 'activo'),
  ('001-3333333-3', 'Carlos', 'Gómez', 'Ciencias Naturales', '809-333-3333', 'carlos.gomez@ejemplo.com', 'Calle Secundaria #3, La Romana', 'Doctor en Biología', 10, 48000.00, 'activo'),
  ('001-4444444-4', 'Ana', 'Martínez', 'Ciencias Sociales', '809-444-4444', 'ana.martinez@ejemplo.com', 'Avenida Principal #4, Puerto Plata', 'Licenciada en Historia', 6, 38000.00, 'activo'),
  ('001-5555555-5', 'Luis', 'Hernández', 'Inglés', '809-555-5555', 'luis.hernandez@ejemplo.com', 'Calle Nueva #5, San Pedro', 'Certificado TEFL', 4, 32000.00, 'activo')
ON CONFLICT DO NOTHING;

-- Insertar materias de ejemplo
INSERT INTO materias (nombre, codigo, descripcion, creditos, horas_semanales, estado)
VALUES
  ('Matemáticas', 'MAT101', 'Fundamentos de matemáticas', 4, 5, 'activo'),
  ('Lengua Española', 'LEN101', 'Gramática y literatura', 4, 5, 'activo'),
  ('Ciencias Naturales', 'CIE101', 'Estudio de la naturaleza', 3, 4, 'activo'),
  ('Ciencias Sociales', 'SOC101', 'Historia y geografía', 3, 4, 'activo'),
  ('Inglés', 'ING101', 'Idioma inglés básico', 2, 3, 'activo'),
  ('Educación Física', 'EDF101', 'Deportes y actividad física', 2, 2, 'activo'),
  ('Arte', 'ART101', 'Expresión artística', 2, 2, 'activo'),
  ('Música', 'MUS101', 'Educación musical', 2, 2, 'activo')
ON CONFLICT DO NOTHING;

-- Asignar materias a cursos
DO $$
DECLARE
  v_curso_id UUID;
  v_materia_id UUID;
  v_cursos UUID[];
  v_materias UUID[];
BEGIN
  -- Obtener IDs de cursos
  SELECT array_agg(id) INTO v_cursos FROM cursos;
  
  -- Obtener IDs de materias
  SELECT array_agg(id) INTO v_materias FROM materias;
  
  -- Asignar todas las materias a todos los cursos
  FOREACH v_curso_id IN ARRAY v_cursos LOOP
    FOREACH v_materia_id IN ARRAY v_materias LOOP
      INSERT INTO cursos_materias (curso_id, materia_id)
      VALUES (v_curso_id, v_materia_id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- Asignar profesores a materias
DO $$
DECLARE
  v_profesor_matematicas UUID;
  v_profesor_espanol UUID;
  v_profesor_ciencias UUID;
  v_profesor_sociales UUID;
  v_profesor_ingles UUID;
  v_materia_matematicas UUID;
  v_materia_espanol UUID;
  v_materia_ciencias UUID;
  v_materia_sociales UUID;
  v_materia_ingles UUID;
BEGIN
  -- Obtener IDs de profesores por especialidad
  SELECT id INTO v_profesor_matematicas FROM profesores WHERE especialidad = 'Matemáticas' LIMIT 1;
  SELECT id INTO v_profesor_espanol FROM profesores WHERE especialidad = 'Lengua Española' LIMIT 1;
  SELECT id INTO v_profesor_ciencias FROM profesores WHERE especialidad = 'Ciencias Naturales' LIMIT 1;
  SELECT id INTO v_profesor_sociales FROM profesores WHERE especialidad = 'Ciencias Sociales' LIMIT 1;
  SELECT id INTO v_profesor_ingles FROM profesores WHERE especialidad = 'Inglés' LIMIT 1;
  
  -- Obtener IDs de materias por nombre
  SELECT id INTO v_materia_matematicas FROM materias WHERE nombre = 'Matemáticas' LIMIT 1;
  SELECT id INTO v_materia_espanol FROM materias WHERE nombre = 'Lengua Española' LIMIT 1;
  SELECT id INTO v_materia_ciencias FROM materias WHERE nombre = 'Ciencias Naturales' LIMIT 1;
  SELECT id INTO v_materia_sociales FROM materias WHERE nombre = 'Ciencias Sociales' LIMIT 1;
  SELECT id INTO v_materia_ingles FROM materias WHERE nombre = 'Inglés' LIMIT 1;
  
  -- Asignar profesores a materias según su especialidad
  IF v_profesor_matematicas IS NOT NULL AND v_materia_matematicas IS NOT NULL THEN
    INSERT INTO asignaciones (profesor_id, materia_id)
    VALUES (v_profesor_matematicas, v_materia_matematicas)
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF v_profesor_espanol IS NOT NULL AND v_materia_espanol IS NOT NULL THEN
    INSERT INTO asignaciones (profesor_id, materia_id)
    VALUES (v_profesor_espanol, v_materia_espanol)
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF v_profesor_ciencias IS NOT NULL AND v_materia_ciencias IS NOT NULL THEN
    INSERT INTO asignaciones (profesor_id, materia_id)
    VALUES (v_profesor_ciencias, v_materia_ciencias)
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF v_profesor_sociales IS NOT NULL AND v_materia_sociales IS NOT NULL THEN
    INSERT INTO asignaciones (profesor_id, materia_id)
    VALUES (v_profesor_sociales, v_materia_sociales)
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF v_profesor_ingles IS NOT NULL AND v_materia_ingles IS NOT NULL THEN
    INSERT INTO asignaciones (profesor_id, materia_id)
    VALUES (v_profesor_ingles, v_materia_ingles)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Insertar estudiantes de ejemplo
INSERT INTO estudiantes (
  cedula, nombre, apellido, fecha_nacimiento, direccion, telefono, email,
  curso_id, seccion, grado, genero, tipo_sangre, alergias, condiciones_medicas,
  nombre_padre, telefono_padre, nombre_madre, telefono_madre,
  contacto_emergencia, telefono_emergencia
)
SELECT
  '00' || i || '-0000000-' || i,
  CASE 
    WHEN i % 2 = 0 THEN 
      CASE WHEN i % 5 = 0 THEN 'Carlos' WHEN i % 5 = 1 THEN 'Miguel' WHEN i % 5 = 2 THEN 'José' WHEN i % 5 = 3 THEN 'Luis' ELSE 'Juan' END
    ELSE 
      CASE WHEN i % 5 = 0 THEN 'María' WHEN i % 5 = 1 THEN 'Ana' WHEN i % 5 = 2 THEN 'Laura' WHEN i % 5 = 3 THEN 'Sofía' ELSE 'Carmen' END
  END,
  CASE 
    WHEN i % 4 = 0 THEN 'Pérez' 
    WHEN i % 4 = 1 THEN 'Rodríguez' 
    WHEN i % 4 = 2 THEN 'Gómez' 
    ELSE 'Martínez' 
  END,
  ('2015-01-01'::date + (i * 30 || ' days')::interval)::date,
  'Calle Principal #' || i || ', Santo Domingo',
  '809-' || (100 + i) || '-' || (1000 + i),
  'estudiante' || i || '@ejemplo.com',
  (SELECT id FROM cursos ORDER BY CASE WHEN i % 5 = 0 THEN 1 WHEN i % 5 = 1 THEN 2 WHEN i % 5 = 2 THEN 3 WHEN i % 5 = 3 THEN 4 ELSE 5 END LIMIT 1),
  CASE WHEN i % 2 = 0 THEN 'A' ELSE 'B' END,
  CASE WHEN i % 5 = 0 THEN '1' WHEN i % 5 = 1 THEN '1' WHEN i % 5 = 2 THEN '2' WHEN i % 5 = 3 THEN '2' ELSE '3' END,
  CASE WHEN i % 2 = 0 THEN 'Masculino' ELSE 'Femenino' END,
  CASE WHEN i % 4 = 0 THEN 'O+' WHEN i % 4 = 1 THEN 'A+' WHEN i % 4 = 2 THEN 'B+' ELSE 'AB+' END,
  CASE WHEN i % 5 = 0 THEN 'Ninguna' WHEN i % 5 = 1 THEN 'Polen' WHEN i % 5 = 2 THEN 'Maní' WHEN i % 5 = 3 THEN 'Lactosa' ELSE 'Ninguna' END,
  CASE WHEN i % 6 = 0 THEN 'Ninguna' WHEN i % 6 = 1 THEN 'Asma' WHEN i % 6 = 2 THEN 'Diabetes' ELSE 'Ninguna' END,
  'Padre de Estudiante ' || i,
  '809-' || (200 + i) || '-' || (2000 + i),
  'Madre de Estudiante ' || i,
  '809-' || (300 + i) || '-' || (3000 + i),
  CASE WHEN i % 2 = 0 THEN 'Padre de Estudiante ' || i ELSE 'Madre de Estudiante ' || i END,
  CASE WHEN i % 2 = 0 THEN '809-' || (200 + i) || '-' || (2000 + i) ELSE '809-' || (300 + i) || '-' || (3000 + i) END
FROM generate_series(1, 20) i
ON CONFLICT DO NOTHING;

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Base de datos configurada correctamente con todas las correcciones aplicadas';
END $$;
