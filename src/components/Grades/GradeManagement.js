import React, { useState, useEffect } from 'react'
import { supabase } from '../../config/supabase'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  FileText,
  Download,
  Filter,
  X,
  Calculator,
  TrendingUp
} from 'lucide-react'
import LoadingSpinner from '../Common/LoadingSpinner'
import jsPDF from 'jspdf'

const GradeManagement = () => {
  const [grades, setGrades] = useState([])
  const [students, setStudents] = useState([])
  const [subjects, setSubjects] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [editingGrade, setEditingGrade] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)
  
  const [formData, setFormData] = useState({
    estudiante_id: '',
    materia_id: '',
    periodo: '',
    nota: '',
    tipo_evaluacion: 'examen',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0]
  })

  const periods = ['Primer Trimestre', 'Segundo Trimestre', 'Tercer Trimestre']
  const evaluationTypes = [
    { value: 'examen', label: 'Examen' },
    { value: 'tarea', label: 'Tarea' },
    { value: 'proyecto', label: 'Proyecto' },
    { value: 'participacion', label: 'Participación' },
    { value: 'quiz', label: 'Quiz' }
  ]

  // Manejo de sesión expirada y errores globales
  useEffect(() => {
    const fetchAll = async () => {
      try {
        await fetchData()
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

  useEffect(() => {
    fetchGrades()
  }, [selectedCourse, selectedSubject, selectedPeriod])

  const fetchData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchCourses(),
        fetchSubjects(),
        fetchStudents(),
        fetchGrades()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from('cursos')
      .select('id, nombre, grado, seccion')
      .eq('estado', 'activo')
      .order('grado', { ascending: true })

    if (error) throw error
    setCourses(data || [])
  }

  const fetchSubjects = async () => {
    const { data, error } = await supabase
      .from('materias')
      .select(`
        id, nombre, codigo,
        cursos(id, nombre, grado)
      `)
      .eq('estado', 'activo')
      .order('nombre', { ascending: true })

    if (error) throw error
    setSubjects(data || [])
  }

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('estudiantes')
      .select(`
        id, nombre, apellido, cedula,
        cursos(id, nombre, grado)
      `)
      .eq('estado', 'activo')
      .order('apellido', { ascending: true })

    if (error) throw error
    setStudents(data || [])
  }

  const fetchGrades = async () => {
    let query = supabase
      .from('notas')
      .select(`
        *,
        estudiantes(nombre, apellido, cedula),
        materias(nombre, codigo),
        cursos(nombre, grado)
      `)
      .order('fecha', { ascending: false })

    if (selectedCourse) {
      query = query.eq('curso_id', selectedCourse)
    }
    if (selectedSubject) {
      query = query.eq('materia_id', selectedSubject)
    }
    if (selectedPeriod) {
      query = query.eq('periodo', selectedPeriod)
    }

    const { data, error } = await query
    if (error) throw error
    setGrades(data || [])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const dataToSave = {
        ...formData,
        nota: parseFloat(formData.nota),
        curso_id: selectedCourse || null
      }

      if (editingGrade) {
        const { error } = await supabase
          .from('notas')
          .update(dataToSave)
          .eq('id', editingGrade.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('notas')
          .insert([dataToSave])

        if (error) throw error
      }

      await fetchGrades()
      setShowModal(false)
      setEditingGrade(null)
      resetForm()
    } catch (error) {
      console.error('Error saving grade:', error)
      alert('Error al guardar la nota')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (grade) => {
    setEditingGrade(grade)
    setFormData({
      estudiante_id: grade.estudiante_id || '',
      materia_id: grade.materia_id || '',
      periodo: grade.periodo || '',
      nota: grade.nota || '',
      tipo_evaluacion: grade.tipo_evaluacion || 'examen',
      descripcion: grade.descripcion || '',
      fecha: grade.fecha || new Date().toISOString().split('T')[0]
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta nota?')) return

    try {
      const { error } = await supabase
        .from('notas')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchGrades()
    } catch (error) {
      console.error('Error deleting grade:', error)
      alert('Error al eliminar la nota')
    }
  }

  const resetForm = () => {
    setFormData({
      estudiante_id: '',
      materia_id: '',
      periodo: '',
      nota: '',
      tipo_evaluacion: 'examen',
      descripcion: '',
      fecha: new Date().toISOString().split('T')[0]
    })
  }

  const calculateAverage = (studentId, subjectId, period) => {
    const studentGrades = grades.filter(grade => 
      grade.estudiante_id === studentId && 
      grade.materia_id === subjectId && 
      grade.periodo === period
    )
    
    if (studentGrades.length === 0) return 0
    
    const sum = studentGrades.reduce((acc, grade) => acc + grade.nota, 0)
    return (sum / studentGrades.length).toFixed(2)
  }

  const generateStudentReport = async (student) => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    
    // Header
    doc.setFontSize(20)
    doc.text('Boletín de Calificaciones', pageWidth / 2, 20, { align: 'center' })
    
    doc.setFontSize(12)
    doc.text(`Estudiante: ${student.nombre} ${student.apellido}`, 20, 40)
    doc.text(`Cédula: ${student.cedula}`, 20, 50)
    doc.text(`Curso: ${student.cursos?.grado} - ${student.cursos?.nombre}`, 20, 60)
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 70)
    
    let yPosition = 90
    
    // Grades by period
    periods.forEach(period => {
      const periodGrades = grades.filter(grade => 
        grade.estudiante_id === student.id && grade.periodo === period
      )
      
      if (periodGrades.length > 0) {
        doc.setFontSize(14)
        doc.text(period, 20, yPosition)
        yPosition += 15
        
        doc.setFontSize(10)
        doc.text('Materia', 20, yPosition)
        doc.text('Evaluación', 80, yPosition)
        doc.text('Nota', 140, yPosition)
        doc.text('Fecha', 160, yPosition)
        yPosition += 10
        
        periodGrades.forEach(grade => {
          doc.text(grade.materias?.nombre || '', 20, yPosition)
          doc.text(grade.tipo_evaluacion, 80, yPosition)
          doc.text(grade.nota.toString(), 140, yPosition)
          doc.text(new Date(grade.fecha).toLocaleDateString(), 160, yPosition)
          yPosition += 8
        })
        
        yPosition += 10
      }
    })
    
    doc.save(`boletin_${student.nombre}_${student.apellido}.pdf`)
  }

  const exportGradesToCSV = () => {
    const headers = ['Estudiante', 'Materia', 'Período', 'Tipo', 'Nota', 'Descripción', 'Fecha']
    const csvContent = [
      headers.join(','),
      ...filteredGrades.map(grade => [
        `"${grade.estudiantes?.nombre} ${grade.estudiantes?.apellido}"`,
        `"${grade.materias?.nombre}"`,
        `"${grade.periodo}"`,
        `"${grade.tipo_evaluacion}"`,
        grade.nota,
        `"${grade.descripcion || ''}"`,
        grade.fecha
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'notas.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const filteredGrades = grades.filter(grade => {
    const searchLower = searchTerm.toLowerCase()
    return (
      grade.estudiantes?.nombre?.toLowerCase().includes(searchLower) ||
      grade.estudiantes?.apellido?.toLowerCase().includes(searchLower) ||
      grade.materias?.nombre?.toLowerCase().includes(searchLower) ||
      grade.periodo?.toLowerCase().includes(searchLower)
    )
  })

  const filteredStudents = students.filter(student => {
    if (!selectedCourse) return true
    return student.cursos?.id === selectedCourse
  })

  const filteredSubjects = subjects.filter(subject => {
    if (!selectedCourse) return true
    return subject.cursos?.id === selectedCourse
  })

  if (loading && grades.length === 0) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Notas</h1>
          <p className="text-gray-600">Administra las calificaciones y evaluaciones</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowReportModal(true)}
            className="btn btn-outline"
          >
            <FileText className="h-4 w-4 mr-2" />
            Reportes
          </button>
          <button
            onClick={exportGradesToCSV}
            className="btn btn-outline"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="form-group">
              <label className="form-label">Curso</label>
              <select
                className="form-select"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                <option value="">Todos los cursos</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.grado} - {course.nombre} ({course.seccion})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Materia</label>
              <select
                className="form-select"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="">Todas las materias</option>
                {filteredSubjects.map(subject => (
                  <option key={subject.id} value={subject.id}>
                    {subject.nombre}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Período</label>
              <select
                className="form-select"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <option value="">Todos los períodos</option>
                {periods.map(period => (
                  <option key={period} value={period}>
                    {period}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar estudiante o materia..."
                  className="form-input pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Mostrando {filteredGrades.length} notas
        </div>
        <button
          onClick={() => {
            setEditingGrade(null)
            resetForm()
            setShowModal(true)
          }}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Nota
        </button>
      </div>

      {/* Grades Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Materia</th>
                <th>Período</th>
                <th>Tipo</th>
                <th>Nota</th>
                <th>Descripción</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredGrades.map((grade) => (
                <tr key={grade.id}>
                  <td>
                    <div>
                      <div className="font-medium text-gray-900">
                        {grade.estudiantes?.nombre} {grade.estudiantes?.apellido}
                      </div>
                      <div className="text-sm text-gray-500">
                        {grade.estudiantes?.cedula}
                      </div>
                    </div>
                  </td>
                  <td>{grade.materias?.nombre}</td>
                  <td>{grade.periodo}</td>
                  <td>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {grade.tipo_evaluacion}
                    </span>
                  </td>
                  <td>
                    <span className={`font-semibold ${
                      grade.nota >= 70 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {grade.nota}
                    </span>
                  </td>
                  <td>{grade.descripcion || '-'}</td>
                  <td>{new Date(grade.fecha).toLocaleDateString()}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(grade)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(grade.id)}
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

      {/* Grade Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">
                {editingGrade ? 'Editar Nota' : 'Nueva Nota'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingGrade(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">Estudiante *</label>
                  <select
                    required
                    className="form-select"
                    value={formData.estudiante_id}
                    onChange={(e) => setFormData({...formData, estudiante_id: e.target.value})}
                  >
                    <option value="">Seleccionar estudiante</option>
                    {filteredStudents.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.nombre} {student.apellido} - {student.cedula}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Materia *</label>
                  <select
                    required
                    className="form-select"
                    value={formData.materia_id}
                    onChange={(e) => setFormData({...formData, materia_id: e.target.value})}
                  >
                    <option value="">Seleccionar materia</option>
                    {filteredSubjects.map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Período *</label>
                  <select
                    required
                    className="form-select"
                    value={formData.periodo}
                    onChange={(e) => setFormData({...formData, periodo: e.target.value})}
                  >
                    <option value="">Seleccionar período</option>
                    {periods.map(period => (
                      <option key={period} value={period}>
                        {period}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Tipo de Evaluación *</label>
                  <select
                    required
                    className="form-select"
                    value={formData.tipo_evaluacion}
                    onChange={(e) => setFormData({...formData, tipo_evaluacion: e.target.value})}
                  >
                    {evaluationTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Nota *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    required
                    className="form-input"
                    value={formData.nota}
                    onChange={(e) => setFormData({...formData, nota: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Fecha *</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={formData.fecha}
                    onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="form-group mt-6">
                <label className="form-label">Descripción</label>
                <textarea
                  className="form-textarea"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  placeholder="Descripción de la evaluación..."
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
                  {loading ? 'Guardando...' : (editingGrade ? 'Actualizar' : 'Crear')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">Generar Reporte</h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="form-group">
                <label className="form-label">Seleccionar Estudiante</label>
                <select
                  className="form-select"
                  value={selectedStudent?.id || ''}
                  onChange={(e) => {
                    const student = students.find(s => s.id === e.target.value)
                    setSelectedStudent(student)
                  }}
                >
                  <option value="">Seleccionar estudiante</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.nombre} {student.apellido}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="btn btn-outline"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (selectedStudent) {
                      generateStudentReport(selectedStudent)
                      setShowReportModal(false)
                      setSelectedStudent(null)
                    }
                  }}
                  disabled={!selectedStudent}
                  className="btn btn-primary"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Generar PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GradeManagement