import React, { useState, useEffect } from 'react'
import { supabase, handleSupabaseError } from '../../config/supabase'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  DollarSign,
  Download,
  X,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import LoadingSpinner from '../Common/LoadingSpinner'
import jsPDF from 'jspdf'

const PaymentManagement = () => {
  const [payments, setPayments] = useState([])
  const [totalPayments, setTotalPayments] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingPayment, setEditingPayment] = useState(null)
  // const [selectedPayment, setSelectedPayment] = useState(null)
  // const [showReceiptModal, setShowReceiptModal] = useState(false)
  
  const [formData, setFormData] = useState({
    estudiante_id: '',
    tipo_pago: 'mensualidad',
    monto: '',
    fecha_vencimiento: '',
    fecha_pago: '',
    estado: 'pendiente',
    metodo_pago: 'efectivo',
    descripcion: '',
    numero_recibo: ''
  })

  const paymentTypes = [
    { value: 'mensualidad', label: 'Mensualidad' },
    { value: 'matricula', label: 'Matrícula' },
    { value: 'uniforme', label: 'Uniforme' },
    { value: 'transporte', label: 'Transporte' },
    { value: 'materiales', label: 'Materiales' },
    { value: 'otros', label: 'Otros' }
  ]

  const paymentMethods = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'tarjeta', label: 'Tarjeta' }
  ]

  const paymentStatuses = [
    { value: 'pendiente', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'pagado', label: 'Pagado', color: 'bg-green-100 text-green-800' },
    { value: 'vencido', label: 'Vencido', color: 'bg-red-100 text-red-800' },
    { value: 'parcial', label: 'Parcial', color: 'bg-blue-100 text-blue-800' }
  ]


  // Manejo de sesión expirada y errores globales
  useEffect(() => {
    const fetchAll = async () => {
      try {
        await fetchPayments()
        await fetchStudents()
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
    // eslint-disable-next-line
  }, [page])

  const fetchPayments = async () => {
    setLoading(true)
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    const { data, error, count } = await supabase
      .from('pagos')
      .select('id, estudiante_id, tipo_pago, monto, fecha_pago, estado, metodo_pago, descripcion, numero_recibo, created_at', { count: 'exact' })
      .order('fecha_pago', { ascending: false })
      .range(from, to)
    if (error) {
      // Propaga el error para manejo global
      throw error
    }
    setPayments(data || [])
    setTotalPayments(count || 0)
    setLoading(false)
  }

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('estudiantes')
      .select('id, nombre, apellido, cedula')
      .eq('estado', 'activo')
      .order('apellido', { ascending: true })

    if (error) throw error
    setStudents(data || [])
  }

  const generateReceiptNumber = () => {
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `REC-${timestamp}-${random}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const dataToSave = {
        ...formData,
        monto: parseFloat(formData.monto),
        numero_recibo: formData.numero_recibo || generateReceiptNumber()
      }

      if (editingPayment) {
        const { error } = await supabase
          .from('pagos')
          .update(dataToSave)
          .eq('id', editingPayment.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('pagos')
          .insert([dataToSave])

        if (error) throw error
      }

      await fetchPayments()
      setShowModal(false)
      setEditingPayment(null)
      resetForm()
    } catch (error) {
      console.error('Error saving payment:', handleSupabaseError(error))
      alert(handleSupabaseError(error))
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (payment) => {
    setEditingPayment(payment)
    setFormData({
      estudiante_id: payment.estudiante_id || '',
      tipo_pago: payment.tipo_pago || 'mensualidad',
      monto: payment.monto || '',
      fecha_vencimiento: payment.fecha_vencimiento || '',
      fecha_pago: payment.fecha_pago || '',
      estado: payment.estado || 'pendiente',
      metodo_pago: payment.metodo_pago || 'efectivo',
      descripcion: payment.descripcion || '',
      numero_recibo: payment.numero_recibo || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este pago?')) return

    try {
      const { error } = await supabase
        .from('pagos')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchPayments()
    } catch (error) {
      console.error('Error deleting payment:', handleSupabaseError(error))
      alert(handleSupabaseError(error))
    }
  }

  const resetForm = () => {
    setFormData({
      estudiante_id: '',
      tipo_pago: 'mensualidad',
      monto: '',
      fecha_vencimiento: '',
      fecha_pago: '',
      estado: 'pendiente',
      metodo_pago: 'efectivo',
      descripcion: '',
      numero_recibo: ''
    })
  }

  const generateReceipt = (payment) => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    
    // Header
    doc.setFontSize(20)
    doc.text('RECIBO DE PAGO', pageWidth / 2, 20, { align: 'center' })
    
    // Receipt info
    doc.setFontSize(12)
    doc.text(`Recibo No: ${payment.numero_recibo}`, 20, 40)
    doc.text(`Fecha: ${new Date(payment.fecha_pago || payment.created_at).toLocaleDateString()}`, 20, 50)
    
    // Student info
    doc.text('DATOS DEL ESTUDIANTE:', 20, 70)
    doc.text(`Nombre: ${payment.estudiantes?.nombre} ${payment.estudiantes?.apellido}`, 20, 80)
    doc.text(`Cédula: ${payment.estudiantes?.cedula}`, 20, 90)
    
    // Payment details
    doc.text('DETALLES DEL PAGO:', 20, 110)
    doc.text(`Concepto: ${paymentTypes.find(t => t.value === payment.tipo_pago)?.label}`, 20, 120)
    doc.text(`Monto: $${payment.monto.toFixed(2)}`, 20, 130)
    doc.text(`Método de Pago: ${paymentMethods.find(m => m.value === payment.metodo_pago)?.label}`, 20, 140)
    doc.text(`Estado: ${payment.estado}`, 20, 150)
    
    if (payment.descripcion) {
      doc.text(`Descripción: ${payment.descripcion}`, 20, 160)
    }
    
    // Footer
    doc.text('Gracias por su pago', pageWidth / 2, 200, { align: 'center' })
    
    doc.save(`recibo_${payment.numero_recibo}.pdf`)
  }

  const exportPaymentsToCSV = () => {
    const headers = ['Estudiante', 'Tipo', 'Monto', 'Vencimiento', 'Fecha Pago', 'Estado', 'Método', 'Recibo']
    const csvContent = [
      headers.join(','),
      ...filteredPayments.map(payment => [
        `"${payment.estudiantes?.nombre} ${payment.estudiantes?.apellido}"`,
        `"${paymentTypes.find(t => t.value === payment.tipo_pago)?.label}"`,
        payment.monto,
        payment.fecha_vencimiento,
        payment.fecha_pago || '',
        payment.estado,
        `"${paymentMethods.find(m => m.value === payment.metodo_pago)?.label}"`,
        payment.numero_recibo
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pagos.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pagado':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'vencido':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'pendiente':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-blue-600" />
    }
  }


  // Unir pagos con estudiantes en frontend
  const paymentsWithStudent = payments.map(payment => ({
    ...payment,
    estudiante: students.find(s => s.id === payment.estudiante_id) || null
  }))

  const filteredPayments = paymentsWithStudent.filter(payment => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = (
      payment.estudiante?.nombre?.toLowerCase().includes(searchLower) ||
      payment.estudiante?.apellido?.toLowerCase().includes(searchLower) ||
      payment.estudiante?.cedula?.toLowerCase().includes(searchLower) ||
      payment.numero_recibo?.toLowerCase().includes(searchLower)
    )
    const matchesStatus = !statusFilter || payment.estado === statusFilter
    const matchesType = !typeFilter || payment.tipo_pago === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.monto, 0)
  const paidAmount = filteredPayments
    .filter(payment => payment.estado === 'pagado')
    .reduce((sum, payment) => sum + payment.monto, 0)
  const pendingAmount = filteredPayments
    .filter(payment => payment.estado === 'pendiente')
    .reduce((sum, payment) => sum + payment.monto, 0)

  if (loading && payments.length === 0) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Pagos</h1>
          <p className="text-gray-600">Administra los pagos y facturación</p>
        </div>
        <button
          onClick={exportPaymentsToCSV}
          className="btn btn-outline"
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">${totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pagado</p>
                <p className="text-2xl font-bold text-green-600">${paidAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendiente</p>
                <p className="text-2xl font-bold text-yellow-600">${pendingAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="form-group">
              <label className="form-label">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar estudiante o recibo..."
                  className="form-input pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Estado</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Todos los estados</option>
                {paymentStatuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Tipo</label>
              <select
                className="form-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">Todos los tipos</option>
                {paymentTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => {
                  setEditingPayment(null)
                  resetForm()
                  setShowModal(true)
                }}
                className="btn btn-primary w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Pago
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Payments Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Tipo</th>
                <th>Monto</th>
                <th>Fecha Pago</th>
                <th>Estado</th>
                <th>Método</th>
                <th>Recibo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id}>
                  <td>
                    <div>
                      <div className="font-medium text-gray-900">
                        {payment.estudiante?.nombre} {payment.estudiante?.apellido}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.estudiante?.cedula}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      {paymentTypes.find(t => t.value === payment.tipo_pago)?.label}
                    </span>
                  </td>
                  <td className="font-semibold">${payment.monto.toFixed(2)}</td>
                  <td>{payment.fecha_pago ? new Date(payment.fecha_pago).toLocaleDateString() : '-'}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(payment.estado)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        paymentStatuses.find(s => s.value === payment.estado)?.color
                      }`}>
                        {paymentStatuses.find(s => s.value === payment.estado)?.label}
                      </span>
                    </div>
                  </td>
                  <td>{paymentMethods.find(m => m.value === payment.metodo_pago)?.label}</td>
                  <td>
                    <button
                      onClick={() => generateReceipt(payment)}
                      className="text-blue-600 hover:text-blue-900 text-sm"
                    >
                      {payment.numero_recibo}
                    </button>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(payment)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => generateReceipt(payment)}
                        className="text-green-600 hover:text-green-900"
                        title="Descargar Recibo"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(payment.id)}
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
        {/* Pagination Controls */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="btn btn-outline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Anterior
          </button>
          <span>Página {page}</span>
          <button
            className="btn btn-outline"
            disabled={page * pageSize >= totalPayments}
            onClick={() => setPage(page + 1)}
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">
                {editingPayment ? 'Editar Pago' : 'Nuevo Pago'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingPayment(null)
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
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.nombre} {student.apellido} - {student.cedula}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Tipo de Pago *</label>
                  <select
                    required
                    className="form-select"
                    value={formData.tipo_pago}
                    onChange={(e) => setFormData({...formData, tipo_pago: e.target.value})}
                  >
                    {paymentTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Monto *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    className="form-input"
                    value={formData.monto}
                    onChange={(e) => setFormData({...formData, monto: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Fecha de Vencimiento *</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={formData.fecha_vencimiento}
                    onChange={(e) => setFormData({...formData, fecha_vencimiento: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Fecha de Pago</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.fecha_pago}
                    onChange={(e) => setFormData({...formData, fecha_pago: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Estado *</label>
                  <select
                    required
                    className="form-select"
                    value={formData.estado}
                    onChange={(e) => setFormData({...formData, estado: e.target.value})}
                  >
                    {paymentStatuses.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Método de Pago *</label>
                  <select
                    required
                    className="form-select"
                    value={formData.metodo_pago}
                    onChange={(e) => setFormData({...formData, metodo_pago: e.target.value})}
                  >
                    {paymentMethods.map(method => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Número de Recibo</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.numero_recibo}
                    onChange={(e) => setFormData({...formData, numero_recibo: e.target.value})}
                    placeholder="Se generará automáticamente"
                  />
                </div>
              </div>
              
              <div className="form-group mt-6">
                <label className="form-label">Descripción</label>
                <textarea
                  className="form-textarea"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  placeholder="Descripción adicional del pago..."
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
                  {loading ? 'Guardando...' : (editingPayment ? 'Actualizar' : 'Crear')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PaymentManagement