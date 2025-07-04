import React, { useState, useEffect } from 'react'
import { supabase } from '../../config/supabase'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  Filter,
  X
} from 'lucide-react'
import LoadingSpinner from '../Common/LoadingSpinner'

const StudentManagement = () => {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCourse, setFilterCourse] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [courses, setCourses] = useState([])
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    fecha_nacimiento: '',
    direccion: '',
    telefono: '',
    email: '',
    curso_id: '',
    seccion: '',
    nombre_padre: '',
    telefono_padre: '',
    nombre_madre: '',
    telefono_madre: '',
    contacto_emergencia: '',
    telefono_emergencia: '',
    estado: 'activo'
  })

  // Manejo de sesión expirada y errores globales
  useEffect(() => {
    const fetchAll = async () => {
      try {
        await fetchStudents()
        await fetchCourses()
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

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('estudiantes')
        .select(`
          *,
          cursos (nombre, grado)
        `)
        .order('apellido', { ascending: true })

      if (error) throw error
      setStudents(data || [])
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('cursos')
        .select('*')
        .order('grado', { ascending: true })

      if (error) throw error
      setCourses(data || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingStudent) {
        const { error } = await supabase
          .from('estudiantes')
          .update(formData)
          .eq('id', editingStudent.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('estudiantes')
          .insert([formData])

        if (error) throw error
      }

      await fetchStudents()
      setShowModal(false)
      setEditingStudent(null)
      resetForm()
    } catch (error) {
      console.error('Error saving student:', error)
      alert('Error al guardar el estudiante')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (student) => {
    setEditingStudent(student)
    setFormData({
      nombre: student.nombre || '',
      apellido: student.apellido || '',
      cedula: student.cedula || '',
      fecha_nacimiento: student.fecha_nacimiento || '',
      direccion: student.direccion || '',
      telefono: student.telefono || '',
      email: student.email || '',
      curso_id: student.curso_id || '',
      seccion: student.seccion || '',
      nombre_padre: student.nombre_padre || '',
      telefono_padre: student.telefono_padre || '',
      nombre_madre: student.nombre_madre || '',
      telefono_madre: student.telefono_madre || '',
      contacto_emergencia: student.contacto_emergencia || '',
      telefono_emergencia: student.telefono_emergencia || '',
      estado: student.estado || 'activo'
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este estudiante?')) return

    try {
      const { error } = await supabase
        .from('estudiantes')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchStudents()
    } catch (error) {
      console.error('Error deleting student:', error)
      alert('Error al eliminar el estudiante')
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      apellido: '',
      cedula: '',
      fecha_nacimiento: '',
      direccion: '',
      telefono: '',
      email: '',
      curso_id: '',
      seccion: '',
      nombre_padre: '',
      telefono_padre: '',
      nombre_madre: '',
      telefono_madre: '',
      contacto_emergencia: '',
      telefono_emergencia: '',
      estado: 'activo'
    })
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.cedula?.includes(searchTerm)
    
    const matchesCourse = !filterCourse || student.curso_id === filterCourse
    
    return matchesSearch && matchesCourse
  })

  const exportToCSV = () => {
    const headers = ['Nombre', 'Apellido', 'Cédula', 'Curso', 'Sección', 'Teléfono', 'Email', 'Estado']
    const csvContent = [
      headers.join(','),
      ...filteredStudents.map(student => [
        student.nombre,
        student.apellido,
        student.cedula,
        student.cursos?.nombre || '',
        student.seccion,
        student.telefono,
        student.email,
        student.estado
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'estudiantes.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading && students.length === 0) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Estudiantes</h1>
          <p className="text-gray-600">Administra la información de los estudiantes</p>
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
              setEditingStudent(null)
              setShowModal(true)
            }}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Estudiante
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar por nombre, apellido o cédula..."
                className="form-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <select
                className="form-select"
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
              >
                <option value="">Todos los cursos</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.grado} - {course.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Filter className="h-4 w-4 mr-2" />
              {filteredStudents.length} de {students.length} estudiantes
            </div>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre Completo</th>
                <th>Cédula</th>
                <th>Curso</th>
                <th>Sección</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td>
                    <div>
                      <div className="font-medium text-gray-900">
                        {student.nombre} {student.apellido}
                      </div>
                      <div className="text-sm text-gray-500">{student.email}</div>
                    </div>
                  </td>
                  <td>{student.cedula}</td>
                  <td>{student.cursos?.nombre || 'Sin asignar'}</td>
                  <td>{student.seccion}</td>
                  <td>{student.telefono}</td>
                  <td>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      student.estado === 'activo' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {student.estado}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(student)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">
                {editingStudent ? 'Editar Estudiante' : 'Nuevo Estudiante'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingStudent(null)
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

                {/* Información de Contacto y Académica */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Contacto y Académico</h4>
                  
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
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Curso</label>
                    <select
                      className="form-select"
                      value={formData.curso_id}
                      onChange={(e) => setFormData({...formData, curso_id: e.target.value})}
                    >
                      <option value="">Seleccionar curso</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.grado} - {course.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Sección</label>
                    <select
                      className="form-select"
                      value={formData.seccion}
                      onChange={(e) => setFormData({...formData, seccion: e.target.value})}
                    >
                      <option value="">Seleccionar sección</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
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
                      <option value="graduado">Graduado</option>
                      <option value="retirado">Retirado</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Información de Padres */}
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 mb-4">Información de Padres/Tutores</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="form-group">
                      <label className="form-label">Nombre del Padre</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.nombre_padre}
                        onChange={(e) => setFormData({...formData, nombre_padre: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Teléfono del Padre</label>
                      <input
                        type="tel"
                        className="form-input"
                        value={formData.telefono_padre}
                        onChange={(e) => setFormData({...formData, telefono_padre: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="form-group">
                      <label className="form-label">Nombre de la Madre</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.nombre_madre}
                        onChange={(e) => setFormData({...formData, nombre_madre: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Teléfono de la Madre</label>
                      <input
                        type="tel"
                        className="form-input"
                        value={formData.telefono_madre}
                        onChange={(e) => setFormData({...formData, telefono_madre: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div className="form-group">
                    <label className="form-label">Contacto de Emergencia</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.contacto_emergencia}
                      onChange={(e) => setFormData({...formData, contacto_emergencia: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teléfono de Emergencia</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={formData.telefono_emergencia}
                      onChange={(e) => setFormData({...formData, telefono_emergencia: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingStudent(null)
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
                  {loading ? 'Guardando...' : (editingStudent ? 'Actualizar' : 'Crear')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentManagement