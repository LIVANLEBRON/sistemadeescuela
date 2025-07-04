import React, { useState, useEffect } from 'react'
import { supabase } from '../../config/supabase'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Download,
  X,
  GraduationCap,
  Mail,
  Phone
} from 'lucide-react'
import LoadingSpinner from '../Common/LoadingSpinner'

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    email: '',
    telefono: '',
    direccion: '',
    fecha_nacimiento: '',
    fecha_ingreso: '',
    especialidad: '',
    titulo: '',
    experiencia_anos: '',
    salario: '',
    estado: 'activo'
  })

  // Manejo de sesión expirada y errores globales
  useEffect(() => {
    const fetchAll = async () => {
      try {
        await fetchTeachers()
      } catch (error) {
        if (error?.status === 401 || (error?.message && error.message.toLowerCase().includes('jwt'))) {
          alert('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.');
          if (supabase.auth) await supabase.auth.signOut();
          window.location.reload();
        } else {
          alert('Error de red o autenticación. Intenta recargar la página.');
        }
      }
    }
    fetchAll();
  }, [])

  const fetchTeachers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profesores')
        .select('*')
        .order('apellido', { ascending: true })

      if (error) throw error
      setTeachers(data || [])
    } catch (error) {
      console.error('Error fetching teachers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const dataToSave = {
        ...formData,
        experiencia_anos: formData.experiencia_anos ? parseInt(formData.experiencia_anos) : null,
        salario: formData.salario ? parseFloat(formData.salario) : null
      }

      if (editingTeacher) {
        const { error } = await supabase
          .from('profesores')
          .update(dataToSave)
          .eq('id', editingTeacher.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('profesores')
          .insert([dataToSave])

        if (error) throw error
      }

      await fetchTeachers()
      setShowModal(false)
      setEditingTeacher(null)
      resetForm()
    } catch (error) {
      console.error('Error saving teacher:', error)
      alert('Error al guardar el profesor')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher)
    setFormData({
      nombre: teacher.nombre || '',
      apellido: teacher.apellido || '',
      cedula: teacher.cedula || '',
      email: teacher.email || '',
      telefono: teacher.telefono || '',
      direccion: teacher.direccion || '',
      fecha_nacimiento: teacher.fecha_nacimiento || '',
      fecha_ingreso: teacher.fecha_ingreso || '',
      especialidad: teacher.especialidad || '',
      titulo: teacher.titulo || '',
      experiencia_anos: teacher.experiencia_anos || '',
      salario: teacher.salario || '',
      estado: teacher.estado || 'activo'
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este profesor?')) return

    try {
      const { error } = await supabase
        .from('profesores')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchTeachers()
    } catch (error) {
      console.error('Error deleting teacher:', error)
      alert('Error al eliminar el profesor')
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      apellido: '',
      cedula: '',
      email: '',
      telefono: '',
      direccion: '',
      fecha_nacimiento: '',
      fecha_ingreso: '',
      especialidad: '',
      titulo: '',
      experiencia_anos: '',
      salario: '',
      estado: 'activo'
    })
  }

  const filteredTeachers = teachers.filter(teacher => {
    const searchLower = searchTerm.toLowerCase()
    return (
      teacher.nombre?.toLowerCase().includes(searchLower) ||
      teacher.apellido?.toLowerCase().includes(searchLower) ||
      teacher.cedula?.includes(searchTerm) ||
      teacher.email?.toLowerCase().includes(searchLower) ||
      teacher.especialidad?.toLowerCase().includes(searchLower)
    )
  })

  const exportToCSV = () => {
    const headers = ['Nombre', 'Apellido', 'Cédula', 'Email', 'Teléfono', 'Especialidad', 'Experiencia', 'Estado']
    const csvContent = [
      headers.join(','),
      ...filteredTeachers.map(teacher => [
        teacher.nombre,
        teacher.apellido,
        teacher.cedula,
        teacher.email,
        teacher.telefono,
        teacher.especialidad,
        teacher.experiencia_anos + ' años',
        teacher.estado
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'profesores.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading && teachers.length === 0) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Profesores</h1>
          <p className="text-gray-600">Administra la información del personal docente</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="btn btn-outline"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </button>
          <button
            onClick={() => {
              resetForm()
              setEditingTeacher(null)
              setShowModal(true)
            }}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Profesor
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="card-content">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar por nombre, cédula, email o especialidad..."
              className="form-input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {filteredTeachers.length} de {teachers.length} profesores
          </div>
        </div>
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeachers.map((teacher) => (
          <div key={teacher.id} className="card">
            <div className="card-content">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <GraduationCap className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {teacher.nombre} {teacher.apellido}
                    </h3>
                    <p className="text-sm text-gray-600">{teacher.especialidad}</p>
                  </div>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  teacher.estado === 'activo' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {teacher.estado}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {teacher.email}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  {teacher.telefono}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Cédula:</strong> {teacher.cedula}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Experiencia:</strong> {teacher.experiencia_anos} años
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Título:</strong> {teacher.titulo}
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => handleEdit(teacher)}
                  className="text-blue-600 hover:text-blue-900"
                  title="Editar"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(teacher.id)}
                  className="text-red-600 hover:text-red-900"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTeachers.length === 0 && (
        <div className="text-center py-12">
          <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay profesores</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'No se encontraron profesores con ese criterio de búsqueda.' : 'Comience agregando un nuevo profesor.'}
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">
                {editingTeacher ? 'Editar Profesor' : 'Nuevo Profesor'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingTeacher(null)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información Personal */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Información Personal</h4>
                  
                  <div className="form-group">
                    <label className="form-label">Nombre *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Apellido *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={formData.apellido}
                      onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Cédula *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={formData.cedula}
                      onChange={(e) => setFormData({...formData, cedula: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Fecha de Nacimiento</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.fecha_nacimiento}
                      onChange={(e) => setFormData({...formData, fecha_nacimiento: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Dirección</label>
                    <textarea
                      className="form-textarea"
                      value={formData.direccion}
                      onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                    />
                  </div>
                </div>

                {/* Información de Contacto y Profesional */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Información Profesional</h4>
                  
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      required
                      className="form-input"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Teléfono</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={formData.telefono}
                      onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Especialidad *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="Ej: Matemáticas, Español, Ciencias"
                      value={formData.especialidad}
                      onChange={(e) => setFormData({...formData, especialidad: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Título Académico</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ej: Licenciado en Educación"
                      value={formData.titulo}
                      onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Años de Experiencia</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={formData.experiencia_anos}
                      onChange={(e) => setFormData({...formData, experiencia_anos: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Información Laboral */}
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 mb-4">Información Laboral</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="form-group">
                    <label className="form-label">Fecha de Ingreso</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.fecha_ingreso}
                      onChange={(e) => setFormData({...formData, fecha_ingreso: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Salario</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      placeholder="0.00"
                      value={formData.salario}
                      onChange={(e) => setFormData({...formData, salario: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Estado</label>
                    <select
                      className="form-select"
                      value={formData.estado}
                      onChange={(e) => setFormData({...formData, estado: e.target.value})}
                    >
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                      <option value="licencia">En Licencia</option>
                      <option value="retirado">Retirado</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingTeacher(null)
                    resetForm()
                  }}
                  className="btn btn-outline"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? 'Guardando...' : (editingTeacher ? 'Actualizar' : 'Crear')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeacherManagement