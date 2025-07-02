import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  School,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  CreditCard,
  FileText,
  BarChart3,
} from 'lucide-react';

const Navigation = ({ userRole }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: BarChart3,
      roles: ['admin', 'secretaria', 'profesor']
    },
    {
      name: 'Estudiantes',
      href: '/estudiantes',
      icon: Users,
      roles: ['admin', 'secretaria']
    },
    {
      name: 'Profesores',
      href: '/profesores',
      icon: GraduationCap,
      roles: ['admin']
    },
    {
      name: 'Cursos y Materias',
      href: '/cursos',
      icon: BookOpen,
      roles: ['admin']
    },
    {
      name: 'Notas',
      href: '/notas',
      icon: ClipboardList,
      roles: ['admin', 'secretaria', 'profesor']
    },
    {
      name: 'Pagos',
      href: '/pagos',
      icon: CreditCard,
      roles: ['admin', 'secretaria']
    },
    {
      name: 'Documentos',
      href: '/documentos',
      icon: FileText,
      roles: ['admin', 'secretaria']
    },
    {
      name: 'Reportes',
      href: '/reportes',
      icon: BarChart3,
      roles: ['admin', 'secretaria', 'profesor']
    }
  ];

  // Mostrar todos los módulos para todos los usuarios, sin filtrar por rol
  const filteredNavigation = navigation;

  // Verificar si una ruta está activa
  const isActive = (href) => {
    console.log('Verificando ruta activa:', { actual: location.pathname, esperada: href });
    return location.pathname === href;
  };

  // Manejar la navegación
  const handleNavigation = (path) => {
    console.log('Navegando a:', path);
    navigate(path);
  };

  return (
    <nav className="flex-1 px-4 py-4">
      <ul className="space-y-2">
        {filteredNavigation.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.name} className="mb-1">
              <button
                onClick={() => handleNavigation(item.href)}
                className={`flex items-center w-full px-3 py-2 rounded-md transition-colors ${
                  isActive(item.href)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Navigation;
