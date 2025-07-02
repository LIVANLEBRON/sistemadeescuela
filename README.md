# Sistema de Gestión Escolar

Un sistema completo de gestión escolar desarrollado con React.js y Supabase que permite administrar estudiantes, profesores, cursos, calificaciones, pagos y documentos.

## 🚀 Características

### 📚 Gestión Académica
- **Estudiantes**: Registro completo, historial académico, documentos
- **Profesores**: Gestión de docentes y asignación a materias
- **Cursos y Materias**: Organización por grados y secciones
- **Calificaciones**: Sistema de notas por períodos con cálculo automático de promedios

### 💰 Gestión Financiera
- **Pagos**: Control de mensualidades, matrículas y otros conceptos
- **Estados**: Seguimiento de pagos pendientes, realizados y vencidos
- **Reportes**: Generación de recibos y reportes financieros

### 📄 Gestión Documental
- **Documentos**: Subida y organización de archivos por estudiante
- **Categorías**: Actas de nacimiento, fotos, constancias médicas, etc.
- **Storage**: Almacenamiento seguro en Supabase Storage

### 📊 Reportes y Análisis
- **Reportes PDF**: Generación de reportes detallados
- **Exportación CSV**: Datos exportables para análisis externo
- **Gráficos**: Visualización de estadísticas con recharts
- **Dashboard**: Panel de control con métricas en tiempo real

### 🔐 Seguridad y Roles
- **Autenticación**: Sistema seguro con Supabase Auth
- **Roles**: Administrador, Secretaría, Profesor
- **Permisos**: Acceso controlado según el rol del usuario

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React.js, HTML5, CSS3, JavaScript ES6+
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Hosting**: Vercel
- **UI/UX**: Lucide React Icons, CSS personalizado
- **Tablas**: React Table
- **Búsqueda**: Fuse.js
- **Gráficos**: Recharts.js
- **PDF**: jsPDF
- **Pagos**: Stripe/PayPal (opcional)

## 📋 Requisitos Previos

- Node.js (versión 14 o superior)
- npm o yarn
- Cuenta en Supabase
- Cuenta en Vercel (para deployment)

## ⚙️ Configuración del Proyecto

### 1. Clonar el Repositorio
```bash
git clone <url-del-repositorio>
cd sistema-gestion-escolar
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Supabase

#### 3.1 Crear Proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Crea una nueva cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Anota la URL del proyecto y la clave anónima

#### 3.2 Configurar Base de Datos
Ejecuta los siguientes scripts SQL en el editor SQL de Supabase:

```sql
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
  año_escolar TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de estudiantes
CREATE TABLE estudiantes (
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
  curso_id UUID REFERENCES cursos(id),
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de profesores
CREATE TABLE profesores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cedula TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  especialidad TEXT,
  telefono TEXT,
  email TEXT,
  direccion TEXT,
  fecha_contratacion DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de materias
CREATE TABLE materias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  codigo TEXT UNIQUE,
  descripcion TEXT,
  curso_id UUID REFERENCES cursos(id),
  profesor_id UUID REFERENCES profesores(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de notas
CREATE TABLE notas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  estudiante_id UUID REFERENCES estudiantes(id) NOT NULL,
  materia_id UUID REFERENCES materias(id) NOT NULL,
  curso_id UUID REFERENCES cursos(id) NOT NULL,
  nota DECIMAL(5,2) NOT NULL,
  periodo TEXT NOT NULL,
  tipo_evaluacion TEXT DEFAULT 'examen',
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de pagos
CREATE TABLE pagos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  estudiante_id UUID REFERENCES estudiantes(id) NOT NULL,
  concepto TEXT NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  fecha_vencimiento DATE,
  fecha_pago DATE,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado', 'vencido')),
  metodo_pago TEXT,
  referencia TEXT,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de documentos
CREATE TABLE documentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  estudiante_id UUID REFERENCES estudiantes(id) NOT NULL,
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL,
  descripcion TEXT,
  archivo_url TEXT NOT NULL,
  tipo_archivo TEXT,
  tamaño_archivo INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear políticas de seguridad (RLS)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profesores ENABLE ROW LEVEL SECURITY;
ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE materias ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios autenticados
CREATE POLICY "Usuarios pueden ver sus propios datos" ON usuarios
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Admins pueden ver todos los datos" ON usuarios
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Políticas similares para otras tablas
CREATE POLICY "Usuarios autenticados pueden ver estudiantes" ON estudiantes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Solo admins y secretaria pueden modificar estudiantes" ON estudiantes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() AND rol IN ('admin', 'secretaria')
    )
  );
```

#### 3.3 Configurar Storage
1. Ve a Storage en tu proyecto de Supabase
2. Crea un bucket llamado "documentos"
3. Configura las políticas de acceso según tus necesidades

### 4. Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto:

```env
REACT_APP_SUPABASE_URL=tu_url_de_supabase
REACT_APP_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase

# Opcional: Para pagos
REACT_APP_STRIPE_PUBLIC_KEY=tu_clave_publica_de_stripe
```

### 5. Ejecutar en Desarrollo
```bash
npm start
```

La aplicación estará disponible en `http://localhost:3000`

## 🚀 Deployment en Vercel

### 1. Preparar para Producción
```bash
npm run build
```

### 2. Deploy en Vercel
1. Instala Vercel CLI: `npm i -g vercel`
2. Ejecuta: `vercel`
3. Sigue las instrucciones
4. Configura las variables de entorno en el dashboard de Vercel

### 3. Configurar Dominio (Opcional)
- En el dashboard de Vercel, ve a Settings > Domains
- Agrega tu dominio personalizado

## 👥 Usuarios de Demostración

Para probar el sistema, puedes crear usuarios con los siguientes roles:

### Administrador
- **Email**: admin@escuela.com
- **Rol**: admin
- **Permisos**: Acceso completo al sistema

### Secretaría
- **Email**: secretaria@escuela.com
- **Rol**: secretaria
- **Permisos**: Gestión de estudiantes, pagos y documentos

### Profesor
- **Email**: profesor@escuela.com
- **Rol**: profesor
- **Permisos**: Solo sus cursos y calificaciones

## 📱 Características Responsivas

El sistema está completamente optimizado para:
- 💻 **Desktop**: Experiencia completa
- 📱 **Tablet**: Interfaz adaptada
- 📱 **Móvil**: Navegación optimizada

## 🔧 Estructura del Proyecto

```
src/
├── components/
│   ├── Auth/
│   │   └── Login.js
│   ├── Common/
│   │   └── LoadingSpinner.js
│   ├── Dashboard/
│   │   └── Dashboard.js
│   ├── Students/
│   │   └── StudentManagement.js
│   ├── Teachers/
│   │   └── TeacherManagement.js
│   ├── Courses/
│   │   └── CourseManagement.js
│   ├── Grades/
│   │   └── GradeManagement.js
│   ├── Payments/
│   │   └── PaymentManagement.js
│   ├── Documents/
│   │   └── DocumentManagement.js
│   ├── Reports/
│   │   └── Reports.js
│   └── Layout/
│       └── Layout.js
├── config/
│   └── supabase.js
├── App.js
├── App.css
└── index.js
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Si tienes preguntas o necesitas ayuda:
- 📧 Email: soporte@tuescuela.com
- 📱 WhatsApp: +1234567890
- 🌐 Website: [tuescuela.com](https://tuescuela.com)

## 🙏 Agradecimientos

- [React.js](https://reactjs.org/) - Framework de JavaScript
- [Supabase](https://supabase.com/) - Backend as a Service
- [Vercel](https://vercel.com/) - Plataforma de deployment
- [Lucide](https://lucide.dev/) - Iconos
- [Recharts](https://recharts.org/) - Gráficos para React

---

**¡Gracias por usar nuestro Sistema de Gestión Escolar!** 🎓