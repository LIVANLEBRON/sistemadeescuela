import React, { useState, useEffect } from 'react'
import { supabase } from '../../config/supabase'
import {
  Users,
  GraduationCap,
  BookOpen,
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { ModernCard, ModernButton, StatsCard } from '../Common'

const Dashboard = ({ userRole }) => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    pendingPayments: 0,
    monthlyRevenue: 0,
    recentPayments: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Obtener estadísticas básicas solo con conteo
      const [studentsResult, teachersResult, coursesResult, paymentsResult, pendingPaymentsResult, monthlyRevenueResult] = await Promise.all([
        supabase.from('estudiantes').select('id', { count: 'exact', head: true }),
        supabase.from('profesores').select('id', { count: 'exact', head: true }),
        supabase.from('cursos').select('id', { count: 'exact', head: true }),
        supabase.from('pagos').select('id, estudiante_id, monto, estado, fecha_vencimiento').order('fecha_pago', { ascending: false }).limit(10),
        supabase.from('pagos').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
        supabase.from('pagos')
          .select('monto')
          .eq('estado', 'pagado')
          .gte('fecha_pago', (() => {
            const d = new Date();
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
          })())
          .lt('fecha_pago', (() => {
            const d = new Date();
            return `${d.getFullYear()}-${String(d.getMonth() + 2).padStart(2, '0')}-01`;
          })())
      ])

      const monthlyRevenue = monthlyRevenueResult.data?.reduce((sum, payment) => sum + payment.monto, 0) || 0

      setStats({
        totalStudents: studentsResult.count || 0,
        totalTeachers: teachersResult.count || 0,
        totalCourses: coursesResult.count || 0,
        pendingPayments: pendingPaymentsResult.count || 0,
        monthlyRevenue,
        recentPayments: paymentsResult.data || []
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Datos para gráficos
  const monthlyData = [
    { name: 'Ene', ingresos: 45000, gastos: 30000 },
    { name: 'Feb', ingresos: 52000, gastos: 32000 },
    { name: 'Mar', ingresos: 48000, gastos: 31000 },
    { name: 'Abr', ingresos: 61000, gastos: 35000 },
    { name: 'May', ingresos: 55000, gastos: 33000 },
    { name: 'Jun', ingresos: 67000, gastos: 38000 }
  ]

  const paymentStatusData = [
    { name: 'Pagados', value: 85, color: '#10b981' },
    { name: 'Pendientes', value: 12, color: '#f59e0b' },
    { name: 'Vencidos', value: 3, color: '#ef4444' }
  ]

  // Removido el componente StatCard local, ahora usamos el moderno

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="spinner w-8 h-8"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <ModernCard variant="gradient" className="bg-gradient-to-r from-primary-500/30 to-secondary-500/30 border-primary-300/40">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
          ¡Bienvenido al Sistema de Gestión Escolar!
        </h1>
        <p className="text-gray-700 text-lg">
          Panel de control - Rol: <span className="font-semibold capitalize text-primary-600">{userRole}</span>
        </p>
      </ModernCard>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(userRole === 'admin' || userRole === 'secretaria') && (
          <>
            <StatsCard
              title="Total Estudiantes"
              value={stats.totalStudents.toLocaleString()}
              icon={<Users className="h-6 w-6" />}
              trend="up"
              trendValue="+5.2%"
              color="primary"
            />
            <StatsCard
              title="Pagos Pendientes"
              value={stats.pendingPayments}
              icon={<AlertCircle className="h-6 w-6" />}
              trend="down"
              trendValue="-2.1%"
              color="warning"
            />
          </>
        )}
        
        {userRole === 'admin' && (
          <>
            <StatsCard
              title="Total Profesores"
              value={stats.totalTeachers}
              icon={<GraduationCap className="h-6 w-6" />}
              trend="up"
              trendValue="+1.8%"
              color="success"
            />
            <StatsCard
              title="Ingresos del Mes"
              value={`$${stats.monthlyRevenue.toLocaleString()}`}
              icon={<DollarSign className="h-6 w-6" />}
              trend="up"
              trendValue="+8.3%"
              color="secondary"
            />
          </>
        )}
        
        {userRole === 'profesor' && (
          <>
            <StatsCard
              title="Mis Cursos"
              value="6"
              icon={<BookOpen className="h-6 w-6" />}
              color="primary"
            />
            <StatsCard
              title="Estudiantes Asignados"
              value="142"
              icon={<Users className="h-6 w-6" />}
              color="success"
            />
          </>
        )}
      </div>

      {/* Charts Section */}
      {(userRole === 'admin' || userRole === 'secretaria') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Revenue Chart */}
          <ModernCard>
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Ingresos vs Gastos Mensuales</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.3)" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, '']}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="ingresos" fill="url(#primaryGradient)" name="Ingresos" radius={[4, 4, 0, 0]} />
                <Bar dataKey="gastos" fill="url(#dangerGradient)" name="Gastos" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                  <linearGradient id="dangerGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#dc2626" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </ModernCard>

          {/* Payment Status Chart */}
          <ModernCard>
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Estado de Pagos</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                  labelStyle={{ fill: '#374151', fontWeight: '500' }}
                >
                  {paymentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ModernCard>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        {(userRole === 'admin' || userRole === 'secretaria') && (
          <ModernCard>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Pagos Recientes</h3>
            </div>
            <div className="space-y-4">
              {stats.recentPayments.slice(0, 5).map((payment, index) => (
                <div key={index} className="flex items-center justify-between p-4 backdrop-blur-sm bg-white/30 rounded-xl border border-white/20 hover:bg-white/40 transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="flex items-center">
                    <div className={`p-3 rounded-xl shadow-lg ${
                      payment.estado === 'pagado' ? 'bg-success-100 text-success-600' : 
                      payment.estado === 'pendiente' ? 'bg-warning-100 text-warning-600' : 'bg-danger-100 text-danger-600'
                    }`}>
                      {payment.estado === 'pagado' ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <AlertCircle className="h-5 w-5" />
                      )}
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-semibold text-gray-800">
                        Estudiante #{payment.estudiante_id}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(payment.fecha_vencimiento).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800">
                      ${payment.monto?.toLocaleString()}
                    </p>
                    <p className={`text-xs capitalize font-medium ${
                      payment.estado === 'pagado' ? 'text-success-600' : 
                      payment.estado === 'pendiente' ? 'text-warning-600' : 'text-danger-600'
                    }`}>
                      {payment.estado}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ModernCard>
        )}

        {/* Quick Actions */}
        <ModernCard>
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800">Acciones Rápidas</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {(userRole === 'admin' || userRole === 'secretaria') && (
              <>
                <ModernButton 
                  variant="primary" 
                  className="justify-start w-full"
                  icon={<Users className="h-5 w-5" />}
                >
                  Registrar Nuevo Estudiante
                </ModernButton>
                <ModernButton 
                  variant="outline" 
                  className="justify-start w-full"
                  icon={<CreditCard className="h-5 w-5" />}
                >
                  Registrar Pago
                </ModernButton>
              </>
            )}
            
            {userRole === 'admin' && (
              <ModernButton 
                variant="success" 
                className="justify-start w-full"
                icon={<GraduationCap className="h-5 w-5" />}
              >
                Agregar Profesor
              </ModernButton>
            )}
            
            <ModernButton 
              variant="glass" 
              className="justify-start w-full"
              icon={<Calendar className="h-5 w-5" />}
            >
              Ver Calendario Escolar
            </ModernButton>
            
            <ModernButton 
              variant="secondary" 
              className="justify-start w-full"
              icon={<BookOpen className="h-5 w-5" />}
            >
              Generar Reporte
            </ModernButton>
          </div>
        </ModernCard>
      </div>
    </div>
  )
}

export default Dashboard