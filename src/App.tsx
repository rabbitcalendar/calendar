import type { ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ClientInput } from './pages/ClientInput';
import { AgencyPlanner } from './pages/AgencyPlanner';
import Login from './pages/Login';
import { CalendarProvider, useCalendar } from './context/CalendarContext';

// Protected Route Component
const PrivateRoute = ({ children }: { children: ReactElement }) => {
  const { user, isLoading } = useCalendar();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  return (
    <CalendarProvider>
      <BrowserRouter basename="/calendar">
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <PrivateRoute>
              <Layout>
                <Navigate to="/client" replace />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/client" element={
            <PrivateRoute>
              <Layout>
                <ClientInput />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/planner" element={
            <PrivateRoute>
              <Layout>
                <AgencyPlanner />
              </Layout>
            </PrivateRoute>
          } />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </CalendarProvider>
  );
}

export default App;
