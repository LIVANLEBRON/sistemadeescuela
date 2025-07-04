import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../config/supabase'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  BookOpen,
  Users,
  X,
  GraduationCap
} from 'lucide-react'
import LoadingSpinner from '../Common/LoadingSpinner'

const CourseManagement = () => {
  // Estados para paginación y conteo
  const [courses, setCourses] = useState([])
  const [coursesCount, setCoursesCount] = useState(0)
  const [coursesPage, setCoursesPage] = useState(1)
  const coursesPageSize = 12
  const [subjects, setSubjects] = useState([])
  const [subjectsCount, setSubjectsCount] = useState(0)
  const [subjectsPage, setSubjectsPage] = useState(1)
  const subjectsPageSize = 12
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('courses')
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('course') // 'course' or 'subject'
  const [editingItem, setEditingItem] = useState(null)
  const [courseFormData, setCourseFormData] = useState({
    nombre: '',
    grado: '',
    seccion: '',
    descripcion: '',
    capacidad_maxima: '',
    ano_escolar: new Date().getFullYear().toString(),
    estado: 'activo'
  })
  const [subjectFormData, setSubjectFormData] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    creditos: '',
    horas_semanales: '',
    curso_id: '',
    profesor_id: '',
    estado: 'activo'
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchCourses(),
        fetchSubjects(),
        fetchTeachers()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Optimización: paginación y solo columnas necesarias
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const from = (coursesPage - 1) * coursesPageSize;
      const to = from + coursesPageSize - 1;
      const { data, error, count } = await supabase
        .from('cursos')
        .select('id, nombre, grado, seccion, descripcion, capacidad_maxima, ano_escolar, estado', { count: 'exact' })
        .order('grado', { ascending: true })
        .range(from, to);
      if (error) throw error;
      setCourses(data || []);
      setCoursesCount(count || 0);
    } catch (error) {
      console.error('Error en fetchCourses:', error);
      setCourses([]);
      setCoursesCount(0);
    } finally {
      setLoading(false);
    }
  }

  // Optimización: paginación y solo columnas necesarias (sin bucles de relaciones)
  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const from = (subjectsPage - 1) * subjectsPageSize;
      const to = from + subjectsPageSize - 1;
      const { data, error, count } = await supabase
        .from('materias')
        .select('id, nombre, codigo, descripcion, creditos, horas_semanales, curso_id, profesor_id, estado', { count: 'exact' })
        .order('nombre', { ascending: true })
        .range(from, to);
      if (error) throw error;
      setSubjects(data || []);
      setSubjectsCount(count || 0);
    } catch (error) {
      console.error('Error en fetchSubjects:', error);
      setSubjects([]);
      setSubjectsCount(0);
    } finally {
      setLoading(false);
    }
  }

  const fetchTeachers = async () => {
    const { data, error } = await supabase
      .from('profesores')
      .select('id, nombre, apellido, especialidad')
      .eq('estado', 'activo')
      .order('apellido', { ascending: true })

    if (error) throw error
    setTeachers(data || [])
  }

  const handleCourseSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Asegurar que grado sea un número
      const gradoValue = courseFormData.grado ? parseInt(courseFormData.grado) : null;
      if (isNaN(gradoValue)) {
        alert('El campo "grado" debe ser un número (ejemplo: 6, 1, 2, etc.)');
        setLoading(false);
        return;
      }
      const dataToSave = {
        ...courseFormData,
        grado: gradoValue,
        capacidad_maxima: courseFormData.capacidad_maxima ? parseInt(courseFormData.capacidad_maxima) : null
      }

      if (editingItem) {
        const { error } = await supabase
          .from('cursos')
          .update(dataToSave)
          .eq('id', editingItem.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('cursos')
          .insert([dataToSave])

        if (error) throw error
      }

      await fetchCourses()
      setShowModal(false)
      setEditingItem(null)
      resetCourseForm()
    } catch (error) {
      console.error('Error saving course:', error)
      alert('Error al guardar el curso: ' + (error.message || error.code || error))
    } finally {
      setLoading(false)
    }
  }

  const handleSubjectSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const dataToSave = {
        ...subjectFormData,
        creditos: subjectFormData.creditos ? parseInt(subjectFormData.creditos) : null,
        horas_semanales: subjectFormData.horas_semanales ? parseInt(subjectFormData.horas_semanales) : null
      }

      if (editingItem) {
        const { error } = await supabase
          .from('materias')
          .update(dataToSave)
          .eq('id', editingItem.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('materias')
          .insert([dataToSave])

        if (error) throw error
      }

      await fetchSubjects()
      setShowModal(false)
      setEditingItem(null)
      resetSubjectForm()
    } catch (error) {
      console.error('Error saving subject:', error)
      alert('Error al guardar la materia')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (item, type) => {
    setEditingItem(item)
    setModalType(type)
    
    if (type === 'course') {
      setCourseFormData({
        nombre: item.nombre || '',
        grado: item.grado || '',
        seccion: item.seccion || '',
        descripcion: item.descripcion || '',
        capacidad_maxima: item.capacidad_maxima || '',
        ano_escolar: item.ano_escolar || new Date().getFullYear().toString(),
        estado: item.estado || 'activo'
      })
    } else {
      setSubjectFormData({
        nombre: item.nombre || '',
        codigo: item.codigo || '',
        descripcion: item.descripcion || '',
        creditos: item.creditos || '',
        horas_semanales: item.horas_semanales || '',
        curso_id: item.curso_id || '',
        profesor_id: item.profesor_id || '',
        estado: item.estado || 'activo'
      })
    }
    
    setShowModal(true)
  }

  const handleDelete = async (id, type) => {
    const itemName = type === 'course' ? 'curso' : 'materia'
    if (!window.confirm(`¿Está seguro de eliminar este ${itemName}?`)) return

    try {
      const table = type === 'course' ? 'cursos' : 'materias'
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)

      if (error) throw error
      
      if (type === 'course') {
        await fetchCourses()
      } else {
        await fetchSubjects()
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error)
      alert(`Error al eliminar el ${itemName}`)
    }
  }

  const resetCourseForm = () => {
    setCourseFormData({
      nombre: '',
      grado: '',
      seccion: '',
      descripcion: '',
      capacidad_maxima: '',
      ano_escolar: new Date().getFullYear().toString(),
      estado: 'activo'
    })
  }

  const resetSubjectForm = () => {
    setSubjectFormData({
      nombre: '',
      codigo: '',
      descripcion: '',
      creditos: '',
      horas_semanales: '',
      curso_id: '',
      profesor_id: '',
      estado: 'activo'
    })
  }

  // Memoización para filtros
  const filteredCourses = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return courses.filter(course =>
      course.nombre?.toLowerCase().includes(searchLower) ||
      String(course.grado).toLowerCase().includes(searchLower) ||
      course.seccion?.toLowerCase().includes(searchLower)
    );
  }, [courses, searchTerm]);

  const filteredSubjects = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return subjects.filter(subject =>
      subject.nombre?.toLowerCase().includes(searchLower) ||
      subject.codigo?.toLowerCase().includes(searchLower)
    );
  }, [subjects, searchTerm]);

  if (loading && courses.length === 0 && subjects.length === 0) {
    return <LoadingSpinner />
  }

  // Paginación UI (ejemplo simple, puedes mejorar el diseño)
  const totalCoursesPages = Math.ceil(coursesCount / coursesPageSize);
  const totalSubjectsPages = Math.ceil(subjectsCount / subjectsPageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Cursos y Materias</h1>
          <p className="text-gray-600">Administra los cursos académicos y sus materias</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('courses')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'courses'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BookOpen className="h-4 w-4 inline mr-2" />
            Cursos
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'subjects'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <GraduationCap className="h-4 w-4 inline mr-2" />
            Materias
          </button>
        </nav>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder={`Buscar ${activeTab === 'courses' ? 'cursos' : 'materias'}...`}
            className="form-input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => {
            setModalType(activeTab === 'courses' ? 'course' : 'subject')
            setEditingItem(null)
            if (activeTab === 'courses') {
              resetCourseForm()
            } else {
              resetSubjectForm()
            }
            setShowModal(true)
          }}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          {activeTab === 'courses' ? 'Nuevo Curso' : 'Nueva Materia'}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'courses' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div key={course.id} className="card">
                <div className="card-content">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-3 rounded-full">
                        <BookOpen className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {course.grado} - {course.nombre}
                        </h3>
                        <p className="text-sm text-gray-600">Sección {course.seccion}</p>
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      course.estado === 'activo' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {course.estado}
                    </span>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="text-sm text-gray-600">
                      <strong>Año Escolar:</strong> {course.ano_escolar}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Capacidad:</strong> {course.capacidad_maxima || 'No definida'}
                    </div>
                    {/* Si quieres mostrar conteos, deberás traerlos con una vista o RPC optimizada */}
                    {course.descripcion && (
                      <div className="text-sm text-gray-600">
                        <strong>Descripción:</strong> {course.descripcion}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(course, 'course')}
                      className="text-blue-600 hover:text-blue-900"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(course.id, 'course')}
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
          {/* Paginación de cursos */}
          {totalCoursesPages > 1 && (
            <div className="flex justify-center mt-4 gap-2">
              <button
                className="btn btn-sm"
                disabled={coursesPage === 1}
                onClick={() => setCoursesPage(coursesPage - 1)}
              >Anterior</button>
              <span className="px-2 py-1">Página {coursesPage} de {totalCoursesPages}</span>
              <button
                className="btn btn-sm"
                disabled={coursesPage === totalCoursesPages}
                onClick={() => setCoursesPage(coursesPage + 1)}
              >Siguiente</button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="card">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Materia</th>
                    <th>Código</th>
                    <th>Curso</th>
                    <th>Profesor</th>
                    <th>Créditos</th>
                    <th>Horas/Semana</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubjects.map((subject) => (
                    <tr key={subject.id}>
                      <td>
                        <div>
                          <div className="font-medium text-gray-900">{subject.nombre}</div>
                          {subject.descripcion && (
                            <div className="text-sm text-gray-500">{subject.descripcion}</div>
                          )}
                        </div>
                      </td>
                      <td>{subject.codigo}</td>
                      <td>{courses.find(c => c.id === subject.curso_id)?.nombre || 'Sin asignar'}</td>
                      <td>{teachers.find(t => t.id === subject.profesor_id) ? `${teachers.find(t => t.id === subject.profesor_id).nombre} ${teachers.find(t => t.id === subject.profesor_id).apellido}` : 'Sin asignar'}</td>
                      <td>{subject.creditos || '-'}</td>
                      <td>{subject.horas_semanales || '-'}</td>
                      <td>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          subject.estado === 'activo' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {subject.estado}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(subject, 'subject')}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(subject.id, 'subject')}
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
          {/* Paginación de materias */}
          {totalSubjectsPages > 1 && (
            <div className="flex justify-center mt-4 gap-2">
              <button
                className="btn btn-sm"
                disabled={subjectsPage === 1}
                onClick={() => setSubjectsPage(subjectsPage - 1)}
              >Anterior</button>
              <span className="px-2 py-1">Página {subjectsPage} de {totalSubjectsPages}</span>
              <button
                className="btn btn-sm"
                disabled={subjectsPage === totalSubjectsPages}
                onClick={() => setSubjectsPage(subjectsPage + 1)}
              >Siguiente</button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">
                {editingItem ? 
                  `Editar ${modalType === 'course' ? 'Curso' : 'Materia'}` : 
                  `Nuevo ${modalType === 'course' ? 'Curso' : 'Materia'}`
                }
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingItem(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {modalType === 'course' ? (
              <form onSubmit={handleCourseSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label className="form-label">Nombre del Curso *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={courseFormData.nombre}
                      onChange={(e) => setCourseFormData({...courseFormData, nombre: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Grado *</label>
                    <select
                      required
                      className="form-select"
                      value={courseFormData.grado}
                      onChange={(e) => setCourseFormData({...courseFormData, grado: e.target.value})}
                    >
                      <option value="">Seleccionar grado</option>
                      <option value="1">1ro</option>
                      <option value="2">2do</option>
                      <option value="3">3ro</option>
                      <option value="4">4to</option>
                      <option value="5">5to</option>
                      <option value="6">6to</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Sección *</label>
                    <select
                      required
                      className="form-select"
                      value={courseFormData.seccion}
                      onChange={(e) => setCourseFormData({...courseFormData, seccion: e.target.value})}
                    >
                      <option value="">Seleccionar sección</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Capacidad Máxima</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={courseFormData.capacidad_maxima}
                      onChange={(e) => setCourseFormData({...courseFormData, capacidad_maxima: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Año Escolar</label>
                    <input
                      type="text"
                      className="form-input"
                      value={courseFormData.ano_escolar}
                      onChange={(e) => setCourseFormData({...courseFormData, ano_escolar: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Estado</label>
                    <select
                      className="form-select"
                      value={courseFormData.estado}
                      onChange={(e) => setCourseFormData({...courseFormData, estado: e.target.value})}
                    >
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group mt-6">
                  <label className="form-label">Descripción</label>
                  <textarea
                    className="form-textarea"
                    value={courseFormData.descripcion}
                    onChange={(e) => setCourseFormData({...courseFormData, descripcion: e.target.value})}
                  />
                </div>

                <div className="flex justify-end gap-4 mt-6 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-outline"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    {loading ? 'Guardando...' : (editingItem ? 'Actualizar' : 'Crear')}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubjectSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label className="form-label">Nombre de la Materia *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={subjectFormData.nombre}
                      onChange={(e) => setSubjectFormData({...subjectFormData, nombre: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Código</label>
                    <input
                      type="text"
                      className="form-input"
                      value={subjectFormData.codigo}
                      onChange={(e) => setSubjectFormData({...subjectFormData, codigo: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Curso *</label>
                    <select
                      required
                      className="form-select"
                      value={subjectFormData.curso_id}
                      onChange={(e) => setSubjectFormData({...subjectFormData, curso_id: e.target.value})}
                    >
                      <option value="">Seleccionar curso</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.grado} - {course.nombre} (Sección {course.seccion})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Profesor</label>
                    <select
                      className="form-select"
                      value={subjectFormData.profesor_id}
                      onChange={(e) => setSubjectFormData({...subjectFormData, profesor_id: e.target.value})}
                    >
                      <option value="">Seleccionar profesor</option>
                      {teachers.map(teacher => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.nombre} {teacher.apellido} - {teacher.especialidad}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Créditos</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={subjectFormData.creditos}
                      onChange={(e) => setSubjectFormData({...subjectFormData, creditos: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Horas por Semana</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={subjectFormData.horas_semanales}
                      onChange={(e) => setSubjectFormData({...subjectFormData, horas_semanales: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group md:col-span-2">
                    <label className="form-label">Estado</label>
                    <select
                      className="form-select"
                      value={subjectFormData.estado}
                      onChange={(e) => setSubjectFormData({...subjectFormData, estado: e.target.value})}
                    >
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group mt-6">
                  <label className="form-label">Descripción</label>
                  <textarea
                    className="form-textarea"
                    value={subjectFormData.descripcion}
                    onChange={(e) => setSubjectFormData({...subjectFormData, descripcion: e.target.value})}
                  />
                </div>

                <div className="flex justify-end gap-4 mt-6 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-outline"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    {loading ? 'Guardando...' : (editingItem ? 'Actualizar' : 'Crear')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CourseManagement