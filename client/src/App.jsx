import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import OrgStructure from './pages/OrgStructure.jsx';
import Positions from './pages/Positions.jsx';
import Employees from './pages/Employees.jsx';
import RiskAssessments from './pages/RiskAssessments.jsx';
import SuccessionPlans from './pages/SuccessionPlans.jsx';
import TalentPools from './pages/TalentPools.jsx';
import Workflows from './pages/Workflows.jsx';
import Reports from './pages/Reports.jsx';
import UserManagement from './pages/UserManagement.jsx';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="org-structure" element={<OrgStructure />} />
          <Route path="positions" element={<Positions />} />
          <Route path="employees" element={<Employees />} />
          <Route path="risk-assessments" element={<RiskAssessments />} />
          <Route path="succession-plans" element={<SuccessionPlans />} />
          <Route path="talent-pools" element={<TalentPools />} />
          <Route path="workflows" element={<Workflows />} />
          <Route path="reports" element={<Reports />} />
          <Route
            path="users"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
