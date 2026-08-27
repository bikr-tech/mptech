import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PublicPage from './pages/PublicPage'
import AdminPage from './pages/AdminPage'
import DesignReference from './pages/DesignReference'
import BookingPage from './pages/customer/BookingPage'
import CustomerDashboard from './pages/customer/CustomerDashboard'
import BookingDetailsPage from './pages/customer/BookingDetailsPage'
import PlumberPage from './pages/plumber/PlumberPage'
import LoginPage from './pages/LoginPage'
import ProtectedRoute from './components/ProtectedRoute'
import { ToastHost } from './components/ui/Toast'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastHost />
        <Routes>
          <Route path="/" element={<PublicPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/design" element={<DesignReference />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/book" element={<ProtectedRoute roles={['customer']}><BookingPage /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute roles={['customer']}><CustomerDashboard /></ProtectedRoute>} />
          <Route path="/account/bookings/:id" element={<ProtectedRoute roles={['customer']}><BookingDetailsPage /></ProtectedRoute>} />
          <Route path="/plumber" element={<ProtectedRoute roles={['plumber']}><PlumberPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
