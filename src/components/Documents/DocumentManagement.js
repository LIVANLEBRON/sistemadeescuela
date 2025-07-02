import React, { useState, useEffect } from 'react'
import { supabase } from '../../config/supabase'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  FileText,
  Download,
  Upload,
  Eye,
  X,
  File,
  Image,
  Filter
} from 'lucide-react'
import LoadingSpinner from '../Common/LoadingSpinner'

const DocumentManagement = () => {
  const [documents, setDocuments] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [studentFilter, setStudentFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingDocument, setEditingDocument] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  
  const [formData, setFormData] = useState({
    estudiante_id: '',
    nombre: '',
    categoria: 'acta_nacimiento',
    descripcion: '',
    archivo_url: '',
    tipo_archivo: ''
  })

  const documentCategories = [
    { value: 'acta_nacimiento', label: 'Acta de Nacimiento' },
    { value: 'foto', label: 'Fotografía' },
    { value: 'constancia_medica', label: 'Constancia Médica' },
    { value: 'carnet_vacunacion', label: 'Carnet de Vacunación' },
    { value: 'cedula', label: 'Cédula de Identidad' },
    { value: 'notas_anteriores', label: 'Notas de Años Anteriores' },
    { value: 'constancia_trabajo', label: 'Constancia de Trabajo (Padres)' },
    { value: 'otros', label: 'Otros Documentos' }
  ]

  const allowedFileTypes = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchDocuments(),
        fetchStudents()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDocuments = async () => {
    const { data, error } = await supabase
      .from('documentos')
      .select(`
        *,
        estudiantes(nombre, apellido, cedula)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    setDocuments(data || [])
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

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!allowedFileTypes[file.type]) {
      alert('Tipo de archivo no permitido. Solo se permiten: JPG, PNG, GIF, PDF, DOC, DOCX')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo es muy grande. Tamaño máximo: 5MB')
      return
    }

    setSelectedFile(file)
    setFormData({
      ...formData,
      nombre: formData.nombre || file.name,
      tipo_archivo: allowedFileTypes[file.type]
    })
  }

  const uploadFile = async (file) => {
    const fileExt = allowedFileTypes[file.type]
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `documents/${fileName}`

    const { data, error } = await supabase.storage
      .from('documentos')
      .upload(filePath, file)

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('documentos')
      .getPublicUrl(filePath)

    return publicUrl
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setUploading(true)

    try {
      let fileUrl = formData.archivo_url

      // Upload new file if selected
      if (selectedFile) {
        fileUrl = await uploadFile(selectedFile)
      }

      const dataToSave = {
        ...formData,
        archivo_url: fileUrl
      }

      if (editingDocument) {
        const { error } = await supabase
          .from('documentos')
          .update(dataToSave)
          .eq('id', editingDocument.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('documentos')
          .insert([dataToSave])

        if (error) throw error
      }

      await fetchDocuments()
      setShowModal(false)
      setEditingDocument(null)
      setSelectedFile(null)
      resetForm()
    } catch (error) {
      console.error('Error saving document:', error)
      alert('Error al guardar el documento')
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = (document) => {
    setEditingDocument(document)
    setFormData({
      estudiante_id: document.estudiante_id || '',
      nombre: document.nombre || '',
      categoria: document.categoria || 'acta_nacimiento',
      descripcion: document.descripcion || '',
      archivo_url: document.archivo_url || '',
      tipo_archivo: document.tipo_archivo || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id, fileUrl) => {
    if (!window.confirm('¿Está seguro de eliminar este documento?')) return

    try {
      // Delete file from storage if exists
      if (fileUrl) {
        const filePath = fileUrl.split('/').pop()
        await supabase.storage
          .from('documentos')
          .remove([`documents/${filePath}`])
      }

      // Delete record from database
      const { error } = await supabase
        .from('documentos')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchDocuments()
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Error al eliminar el documento')
    }
  }

  const handlePreview = (document) => {
    setPreviewUrl(document.archivo_url)
    setShowPreview(true)
  }

  const handleDownload = (document) => {
    const link = document.createElement('a')
    link.href = document.archivo_url
    link.download = document.nombre
    link.target = '_blank'
    link.click()
  }

  const resetForm = () => {
    setFormData({
      estudiante_id: '',
      nombre: '',
      categoria: 'acta_nacimiento',
      descripcion: '',
      archivo_url: '',
      tipo_archivo: ''
    })
  }

  const getFileIcon = (tipoArchivo) => {
    switch (tipoArchivo) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-600" />
      case 'jpg':
      case 'png':
      case 'gif':
        return <Image className="h-5 w-5 text-blue-600" />
      case 'doc':
      case 'docx':
        return <File className="h-5 w-5 text-blue-800" />
      default:
        return <File className="h-5 w-5 text-gray-600" />
    }
  }

  const filteredDocuments = documents.filter(document => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = (
      document.nombre?.toLowerCase().includes(searchLower) ||
      document.estudiantes?.nombre?.toLowerCase().includes(searchLower) ||
      document.estudiantes?.apellido?.toLowerCase().includes(searchLower) ||
      document.estudiantes?.cedula?.toLowerCase().includes(searchLower)
    )
    
    const matchesCategory = !categoryFilter || document.categoria === categoryFilter
    const matchesStudent = !studentFilter || document.estudiante_id === studentFilter
    
    return matchesSearch && matchesCategory && matchesStudent
  })

  if (loading && documents.length === 0) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Documentos</h1>
          <p className="text-gray-600">Administra los documentos de los estudiantes</p>
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
                  placeholder="Buscar documento o estudiante..."
                  className="form-input pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Categoría</label>
              <select
                className="form-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                {documentCategories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Estudiante</label>
              <select
                className="form-select"
                value={studentFilter}
                onChange={(e) => setStudentFilter(e.target.value)}
              >
                <option value="">Todos los estudiantes</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.nombre} {student.apellido}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => {
                  setEditingDocument(null)
                  setSelectedFile(null)
                  resetForm()
                  setShowModal(true)
                }}
                className="btn btn-primary w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Subir Documento
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.map((document) => (
          <div key={document.id} className="card">
            <div className="card-content">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  {getFileIcon(document.tipo_archivo)}
                  <div className="ml-3">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {document.nombre}
                    </h3>
                    <p className="text-xs text-gray-600">
                      {documentCategories.find(c => c.value === document.categoria)?.label}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="text-sm text-gray-600">
                  <strong>Estudiante:</strong> {document.estudiantes?.nombre} {document.estudiantes?.apellido}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Cédula:</strong> {document.estudiantes?.cedula}
                </div>
                {document.descripcion && (
                  <div className="text-sm text-gray-600">
                    <strong>Descripción:</strong> {document.descripcion}
                  </div>
                )}
                <div className="text-sm text-gray-600">
                  <strong>Subido:</strong> {new Date(document.created_at).toLocaleDateString()}
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  {document.tipo_archivo && ['jpg', 'png', 'gif', 'pdf'].includes(document.tipo_archivo) && (
                    <button
                      onClick={() => handlePreview(document)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Vista previa"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDownload(document)}
                    className="text-green-600 hover:text-green-900"
                    title="Descargar"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(document)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(document.id, document.archivo_url)}
                    className="text-red-600 hover:text-red-900"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-xs text-gray-500 uppercase">
                  {document.tipo_archivo}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay documentos</h3>
          <p className="mt-1 text-sm text-gray-500">
            No se encontraron documentos con los filtros aplicados.
          </p>
        </div>
      )}

      {/* Document Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">
                {editingDocument ? 'Editar Documento' : 'Subir Documento'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingDocument(null)
                  setSelectedFile(null)
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
                  <label className="form-label">Categoría *</label>
                  <select
                    required
                    className="form-select"
                    value={formData.categoria}
                    onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                  >
                    {documentCategories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group md:col-span-2">
                  <label className="form-label">Nombre del Documento *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    placeholder="Nombre descriptivo del documento"
                  />
                </div>
                
                <div className="form-group md:col-span-2">
                  <label className="form-label">
                    {editingDocument ? 'Cambiar Archivo' : 'Archivo *'}
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                          <span>Subir archivo</span>
                          <input
                            type="file"
                            className="sr-only"
                            accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx"
                            onChange={handleFileSelect}
                            required={!editingDocument}
                          />
                        </label>
                        <p className="pl-1">o arrastra y suelta</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        JPG, PNG, GIF, PDF, DOC, DOCX hasta 5MB
                      </p>
                      {selectedFile && (
                        <p className="text-sm text-green-600">
                          Archivo seleccionado: {selectedFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="form-group mt-6">
                <label className="form-label">Descripción</label>
                <textarea
                  className="form-textarea"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  placeholder="Descripción adicional del documento..."
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
                  disabled={uploading}
                  className="btn btn-primary"
                >
                  {uploading ? 'Subiendo...' : (editingDocument ? 'Actualizar' : 'Subir')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-screen overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Vista Previa</h3>
              <button
                onClick={() => {
                  setShowPreview(false)
                  setPreviewUrl('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-4 max-h-96 overflow-auto">
              {previewUrl.endsWith('.pdf') ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-96"
                  title="Vista previa PDF"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Vista previa"
                  className="max-w-full h-auto mx-auto"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DocumentManagement