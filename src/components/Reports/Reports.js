import React, { useState, useEffect } from 'react'
import { supabase } from '../../config/supabase'
import {
  FileText,
  Download,
  Calendar,
  Users,
  GraduationCap,
  DollarSign,
  TrendingUp,
  BarChart3,
  Filter,
  Search
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import LoadingSpinner from '../Common/LoadingSpinner'

const Reports = () => {
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState('students')
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [courseFilter, setCourseFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  
  // Data states
  const [studentsData, setStudentsData] = useState([])
  const [teachersData, setTeachersData] = useState([])
  const [coursesData, setCoursesData] = useState([])
  const [gradesData, setGradesData] = useState([])
  const [paymentsData, setPaymentsData] = useState([])
  const [financialData, setFinancialData] = useState([])
  
  // Chart data
  const [chartData, setChartData] = useState([])
  const [pieData, setPieData] = useState([])
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

  useEffect(() => {
    fetchAllData()
  }, [])

  useEffect(() => {
    generateChartData()
  }, [reportType, studentsData, paymentsData, gradesData, coursesData])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchStudents(),
        fetchTeachers(),
        fetchCourses(),
        fetchGrades(),
        fetchPayments(),
        fetchFinancialData()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('estudiantes')
      .select(`
        *,
        cursos(nombre, grado)
      `)
      .order('apellido', { ascending: true })

    if (error) throw error
    setStudentsData(data || [])
  }

  const fetchTeachers = async () => {
    const { data, error } = await supabase
      .from('profesores')
      .select('*')
      .order('apellido', { ascending: true })

    if (error) throw error
    setTeachersData(data || [])
  }

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from('cursos')
      .select(`
        *,
        estudiantes(id),
        materias(id, nombre)
      `)
      .order('grado', { ascending: true })

    if (error) throw error
    setCoursesData(data || [])
  }

  const fetchGrades = async () => {
    const { data, error } = await supabase
      .from('notas')
      .select(`
        *,
        estudiantes(nombre, apellido, cedula),
        materias(nombre),
        cursos(nombre, grado)
      `)
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end + 'T23:59:59')
      .order('created_at', { ascending: false })

    if (error) throw error
    setGradesData(data || [])
  }

  const fetchPayments = async () => {
    const { data, error } = await supabase
      .from('pagos')
      .select(`
        *,
        estudiantes(nombre, apellido, cedula)
      `)
      .gte('fecha_pago', dateRange.start)
      .lte('fecha_pago', dateRange.end)
      .order('fecha_pago', { ascending: false })

    if (error) throw error
    setPaymentsData(data || [])
  }

  const fetchFinancialData = async () => {
    const { data, error } = await supabase
      .from('pagos')
      .select('monto, fecha_pago, estado')
      .gte('fecha_pago', dateRange.start)
      .lte('fecha_pago', dateRange.end)

    if (error) throw error
    setFinancialData(data || [])
  }

  const generateChartData = () => {
    switch (reportType) {
      case 'students':
        generateStudentCharts()
        break
      case 'payments':
        generatePaymentCharts()
        break
      case 'grades':
        generateGradeCharts()
        break
      case 'courses':
        generateCourseCharts()
        break
      default:
        setChartData([])
        setPieData([])
    }
  }

  const generateStudentCharts = () => {
    // Students by course
    const courseCount = {}
    studentsData.forEach(student => {
      const courseName = student.cursos?.nombre || 'Sin curso'
      courseCount[courseName] = (courseCount[courseName] || 0) + 1
    })

    const barData = Object.entries(courseCount).map(([course, count]) => ({
      name: course,
      value: count
    }))

    // Students by status
    const statusCount = {}
    studentsData.forEach(student => {
      statusCount[student.estado] = (statusCount[student.estado] || 0) + 1
    })

    const pieData = Object.entries(statusCount).map(([status, count]) => ({
      name: status === 'activo' ? 'Activos' : 'Inactivos',
      value: count
    }))

    setChartData(barData)
    setPieData(pieData)
  }

  const generatePaymentCharts = () => {
    // Monthly payments
    const monthlyPayments = {}
    paymentsData.forEach(payment => {
      const month = new Date(payment.fecha_pago).toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short' 
      })
      monthlyPayments[month] = (monthlyPayments[month] || 0) + parseFloat(payment.monto)
    })

    const barData = Object.entries(monthlyPayments).map(([month, amount]) => ({
      name: month,
      value: amount
    }))

    // Payment status
    const statusCount = {}
    paymentsData.forEach(payment => {
      const status = payment.estado === 'pagado' ? 'Pagados' : 
                    payment.estado === 'pendiente' ? 'Pendientes' : 'Vencidos'
      statusCount[status] = (statusCount[status] || 0) + 1
    })

    const pieData = Object.entries(statusCount).map(([status, count]) => ({
      name: status,
      value: count
    }))

    setChartData(barData)
    setPieData(pieData)
  }

  const generateGradeCharts = () => {
    // Average grades by subject
    const subjectGrades = {}
    gradesData.forEach(grade => {
      const subject = grade.materias?.nombre || 'Sin materia'
      if (!subjectGrades[subject]) {
        subjectGrades[subject] = []
      }
      subjectGrades[subject].push(parseFloat(grade.nota))
    })

    const barData = Object.entries(subjectGrades).map(([subject, grades]) => ({
      name: subject,
      value: grades.reduce((sum, grade) => sum + grade, 0) / grades.length
    }))

    // Grade distribution
    const gradeRanges = {
      'A (90-100)': 0,
      'B (80-89)': 0,
      'C (70-79)': 0,
      'D (60-69)': 0,
      'F (0-59)': 0
    }

    gradesData.forEach(grade => {
      const nota = parseFloat(grade.nota)
      if (nota >= 90) gradeRanges['A (90-100)']++
      else if (nota >= 80) gradeRanges['B (80-89)']++
      else if (nota >= 70) gradeRanges['C (70-79)']++
      else if (nota >= 60) gradeRanges['D (60-69)']++
      else gradeRanges['F (0-59)']++
    })

    const pieData = Object.entries(gradeRanges).map(([range, count]) => ({
      name: range,
      value: count
    }))

    setChartData(barData)
    setPieData(pieData)
  }

  const generateCourseCharts = () => {
    // Students per course
    const barData = coursesData.map(course => ({
      name: `${course.grado}° ${course.seccion}`,
      value: course.estudiantes?.length || 0
    }))

    // Subjects per course
    const subjectCount = {}
    coursesData.forEach(course => {
      const subjectNum = course.materias?.length || 0
      const range = subjectNum <= 5 ? '1-5' : subjectNum <= 10 ? '6-10' : '11+'
      subjectCount[range] = (subjectCount[range] || 0) + 1
    })

    const pieData = Object.entries(subjectCount).map(([range, count]) => ({
      name: `${range} materias`,
      value: count
    }))

    setChartData(barData)
    setPieData(pieData)
  }

  const generatePDF = () => {
    const doc = new jsPDF()
    const title = getReportTitle()
    
    // Header
    doc.setFontSize(20)
    doc.text(title, 20, 20)
    doc.setFontSize(12)
    doc.text(`Período: ${dateRange.start} - ${dateRange.end}`, 20, 30)
    doc.text(`Generado: ${new Date().toLocaleDateString()}`, 20, 40)
    
    let yPosition = 60
    
    switch (reportType) {
      case 'students':
        generateStudentPDF(doc, yPosition)
        break
      case 'teachers':
        generateTeacherPDF(doc, yPosition)
        break
      case 'payments':
        generatePaymentPDF(doc, yPosition)
        break
      case 'grades':
        generateGradePDF(doc, yPosition)
        break
      case 'courses':
        generateCoursePDF(doc, yPosition)
        break
    }
    
    doc.save(`${reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const generateStudentPDF = (doc, yPosition) => {
    const tableData = studentsData.map(student => [
      student.cedula,
      `${student.nombre} ${student.apellido}`,
      student.cursos?.nombre || 'Sin curso',
      student.telefono || 'N/A',
      student.estado
    ])

    doc.autoTable({
      head: [['Cédula', 'Nombre Completo', 'Curso', 'Teléfono', 'Estado']],
      body: tableData,
      startY: yPosition,
      styles: { fontSize: 8 }
    })
  }

  const generateTeacherPDF = (doc, yPosition) => {
    const tableData = teachersData.map(teacher => [
      teacher.cedula,
      `${teacher.nombre} ${teacher.apellido}`,
      teacher.especialidad || 'N/A',
      teacher.telefono || 'N/A',
      teacher.email || 'N/A'
    ])

    doc.autoTable({
      head: [['Cédula', 'Nombre Completo', 'Especialidad', 'Teléfono', 'Email']],
      body: tableData,
      startY: yPosition,
      styles: { fontSize: 8 }
    })
  }

  const generatePaymentPDF = (doc, yPosition) => {
    const tableData = paymentsData.map(payment => [
      payment.estudiantes?.cedula || 'N/A',
      `${payment.estudiantes?.nombre || ''} ${payment.estudiantes?.apellido || ''}`,
      payment.concepto,
      `$${parseFloat(payment.monto).toFixed(2)}`,
      payment.fecha_pago,
      payment.estado
    ])

    doc.autoTable({
      head: [['Cédula', 'Estudiante', 'Concepto', 'Monto', 'Fecha', 'Estado']],
      body: tableData,
      startY: yPosition,
      styles: { fontSize: 8 }
    })

    // Add summary
    const totalAmount = paymentsData.reduce((sum, payment) => sum + parseFloat(payment.monto), 0)
    const finalY = doc.lastAutoTable.finalY + 20
    doc.text(`Total recaudado: $${totalAmount.toFixed(2)}`, 20, finalY)
  }

  const generateGradePDF = (doc, yPosition) => {
    const tableData = gradesData.map(grade => [
      grade.estudiantes?.cedula || 'N/A',
      `${grade.estudiantes?.nombre || ''} ${grade.estudiantes?.apellido || ''}`,
      grade.materias?.nombre || 'N/A',
      grade.nota,
      grade.periodo,
      new Date(grade.created_at).toLocaleDateString()
    ])

    doc.autoTable({
      head: [['Cédula', 'Estudiante', 'Materia', 'Nota', 'Período', 'Fecha']],
      body: tableData,
      startY: yPosition,
      styles: { fontSize: 8 }
    })
  }

  const generateCoursePDF = (doc, yPosition) => {
    const tableData = coursesData.map(course => [
      `${course.grado}° ${course.seccion}`,
      course.nombre,
      course.estudiantes?.length || 0,
      course.materias?.length || 0,
      course.año_escolar
    ])

    doc.autoTable({
      head: [['Grado/Sección', 'Nombre', 'Estudiantes', 'Materias', 'Año Escolar']],
      body: tableData,
      startY: yPosition,
      styles: { fontSize: 8 }
    })
  }

  const exportToCSV = () => {
    let csvContent = ''
    let filename = ''
    
    switch (reportType) {
      case 'students':
        csvContent = generateStudentCSV()
        filename = 'estudiantes'
        break
      case 'teachers':
        csvContent = generateTeacherCSV()
        filename = 'profesores'
        break
      case 'payments':
        csvContent = generatePaymentCSV()
        filename = 'pagos'
        break
      case 'grades':
        csvContent = generateGradeCSV()
        filename = 'notas'
        break
      case 'courses':
        csvContent = generateCourseCSV()
        filename = 'cursos'
        break
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const generateStudentCSV = () => {
    const headers = 'Cédula,Nombre,Apellido,Curso,Teléfono,Email,Estado\n'
    const rows = studentsData.map(student => 
      `${student.cedula},${student.nombre},${student.apellido},${student.cursos?.nombre || ''},${student.telefono || ''},${student.email || ''},${student.estado}`
    ).join('\n')
    return headers + rows
  }

  const generateTeacherCSV = () => {
    const headers = 'Cédula,Nombre,Apellido,Especialidad,Teléfono,Email\n'
    const rows = teachersData.map(teacher => 
      `${teacher.cedula},${teacher.nombre},${teacher.apellido},${teacher.especialidad || ''},${teacher.telefono || ''},${teacher.email || ''}`
    ).join('\n')
    return headers + rows
  }

  const generatePaymentCSV = () => {
    const headers = 'Cédula Estudiante,Estudiante,Concepto,Monto,Fecha Pago,Estado\n'
    const rows = paymentsData.map(payment => 
      `${payment.estudiantes?.cedula || ''},${payment.estudiantes?.nombre || ''} ${payment.estudiantes?.apellido || ''},${payment.concepto},${payment.monto},${payment.fecha_pago},${payment.estado}`
    ).join('\n')
    return headers + rows
  }

  const generateGradeCSV = () => {
    const headers = 'Cédula Estudiante,Estudiante,Materia,Nota,Período,Fecha\n'
    const rows = gradesData.map(grade => 
      `${grade.estudiantes?.cedula || ''},${grade.estudiantes?.nombre || ''} ${grade.estudiantes?.apellido || ''},${grade.materias?.nombre || ''},${grade.nota},${grade.periodo},${new Date(grade.created_at).toLocaleDateString()}`
    ).join('\n')
    return headers + rows
  }

  const generateCourseCSV = () => {
    const headers = 'Grado,Sección,Nombre,Estudiantes,Materias,Año Escolar\n'
    const rows = coursesData.map(course => 
      `${course.grado},${course.seccion},${course.nombre},${course.estudiantes?.length || 0},${course.materias?.length || 0},${course.año_escolar}`
    ).join('\n')
    return headers + rows
  }

  const getReportTitle = () => {
    switch (reportType) {
      case 'students': return 'Reporte de Estudiantes'
      case 'teachers': return 'Reporte de Profesores'
      case 'payments': return 'Reporte de Pagos'
      case 'grades': return 'Reporte de Calificaciones'
      case 'courses': return 'Reporte de Cursos'
      default: return 'Reporte'
    }
  }

  const getStatsCards = () => {
    switch (reportType) {
      case 'students':
        return [
          {
            title: 'Total Estudiantes',
            value: studentsData.length,
            icon: Users,
            color: 'text-blue-600'
          },
          {
            title: 'Estudiantes Activos',
            value: studentsData.filter(s => s.estado === 'activo').length,
            icon: GraduationCap,
            color: 'text-green-600'
          }
        ]
      case 'payments':
        const totalAmount = paymentsData.reduce((sum, p) => sum + parseFloat(p.monto), 0)
        const paidAmount = paymentsData.filter(p => p.estado === 'pagado').reduce((sum, p) => sum + parseFloat(p.monto), 0)
        return [
          {
            title: 'Total Pagos',
            value: paymentsData.length,
            icon: FileText,
            color: 'text-blue-600'
          },
          {
            title: 'Monto Total',
            value: `$${totalAmount.toFixed(2)}`,
            icon: DollarSign,
            color: 'text-green-600'
          },
          {
            title: 'Pagos Realizados',
            value: `$${paidAmount.toFixed(2)}`,
            icon: TrendingUp,
            color: 'text-emerald-600'
          }
        ]
      case 'grades':
        const avgGrade = gradesData.length > 0 ? 
          gradesData.reduce((sum, g) => sum + parseFloat(g.nota), 0) / gradesData.length : 0
        return [
          {
            title: 'Total Calificaciones',
            value: gradesData.length,
            icon: FileText,
            color: 'text-blue-600'
          },
          {
            title: 'Promedio General',
            value: avgGrade.toFixed(2),
            icon: TrendingUp,
            color: 'text-green-600'
          }
        ]
      case 'courses':
        return [
          {
            title: 'Total Cursos',
            value: coursesData.length,
            icon: GraduationCap,
            color: 'text-blue-600'
          },
          {
            title: 'Total Estudiantes',
            value: coursesData.reduce((sum, c) => sum + (c.estudiantes?.length || 0), 0),
            icon: Users,
            color: 'text-green-600'
          }
        ]
      default:
        return []
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes y Análisis</h1>
          <p className="text-gray-600">Genera reportes detallados y visualiza estadísticas</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="form-group">
              <label className="form-label">Tipo de Reporte</label>
              <select
                className="form-select"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="students">Estudiantes</option>
                <option value="teachers">Profesores</option>
                <option value="payments">Pagos</option>
                <option value="grades">Calificaciones</option>
                <option value="courses">Cursos</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Fecha Inicio</label>
              <input
                type="date"
                className="form-input"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Fecha Fin</label>
              <input
                type="date"
                className="form-input"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              />
            </div>
            
            <div className="flex items-end gap-2">
              <button
                onClick={generatePDF}
                className="btn btn-primary flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </button>
              <button
                onClick={exportToCSV}
                className="btn btn-outline flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getStatsCards().map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="card">
              <div className="card-content">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Distribución por Categoría
            </h3>
          </div>
          <div className="card-content">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Distribución Porcentual
            </h3>
          </div>
          <div className="card-content">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data Table Preview */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Vista Previa de Datos</h3>
        </div>
        <div className="card-content">
          <div className="overflow-x-auto">
            {reportType === 'students' && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Cédula</th>
                    <th>Nombre Completo</th>
                    <th>Curso</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsData.slice(0, 10).map(student => (
                    <tr key={student.id}>
                      <td>{student.cedula}</td>
                      <td>{student.nombre} {student.apellido}</td>
                      <td>{student.cursos?.nombre || 'Sin curso'}</td>
                      <td>
                        <span className={`badge ${
                          student.estado === 'activo' ? 'badge-success' : 'badge-secondary'
                        }`}>
                          {student.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            
            {reportType === 'payments' && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    <th>Concepto</th>
                    <th>Monto</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsData.slice(0, 10).map(payment => (
                    <tr key={payment.id}>
                      <td>{payment.estudiantes?.nombre} {payment.estudiantes?.apellido}</td>
                      <td>{payment.concepto}</td>
                      <td>${parseFloat(payment.monto).toFixed(2)}</td>
                      <td>{payment.fecha_pago}</td>
                      <td>
                        <span className={`badge ${
                          payment.estado === 'pagado' ? 'badge-success' : 
                          payment.estado === 'pendiente' ? 'badge-warning' : 'badge-danger'
                        }`}>
                          {payment.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            
            {reportType === 'grades' && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    <th>Materia</th>
                    <th>Nota</th>
                    <th>Período</th>
                  </tr>
                </thead>
                <tbody>
                  {gradesData.slice(0, 10).map(grade => (
                    <tr key={grade.id}>
                      <td>{grade.estudiantes?.nombre} {grade.estudiantes?.apellido}</td>
                      <td>{grade.materias?.nombre}</td>
                      <td>
                        <span className={`badge ${
                          parseFloat(grade.nota) >= 80 ? 'badge-success' : 
                          parseFloat(grade.nota) >= 70 ? 'badge-warning' : 'badge-danger'
                        }`}>
                          {grade.nota}
                        </span>
                      </td>
                      <td>{grade.periodo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            
            {reportType === 'courses' && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Grado/Sección</th>
                    <th>Nombre</th>
                    <th>Estudiantes</th>
                    <th>Materias</th>
                  </tr>
                </thead>
                <tbody>
                  {coursesData.slice(0, 10).map(course => (
                    <tr key={course.id}>
                      <td>{course.grado}° {course.seccion}</td>
                      <td>{course.nombre}</td>
                      <td>{course.estudiantes?.length || 0}</td>
                      <td>{course.materias?.length || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            
            {reportType === 'teachers' && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Cédula</th>
                    <th>Nombre Completo</th>
                    <th>Especialidad</th>
                    <th>Teléfono</th>
                  </tr>
                </thead>
                <tbody>
                  {teachersData.slice(0, 10).map(teacher => (
                    <tr key={teacher.id}>
                      <td>{teacher.cedula}</td>
                      <td>{teacher.nombre} {teacher.apellido}</td>
                      <td>{teacher.especialidad || 'N/A'}</td>
                      <td>{teacher.telefono || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {((reportType === 'students' && studentsData.length > 10) ||
            (reportType === 'payments' && paymentsData.length > 10) ||
            (reportType === 'grades' && gradesData.length > 10) ||
            (reportType === 'courses' && coursesData.length > 10) ||
            (reportType === 'teachers' && teachersData.length > 10)) && (
            <div className="mt-4 text-center text-gray-500">
              Mostrando los primeros 10 registros. Exporta para ver todos los datos.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Reports