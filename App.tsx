import React, { createContext, useContext, useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { SubmitInstructions } from './pages/SubmitInstructions';
import { ReviewInstructions } from './pages/ReviewInstructions';
import { Settings } from './pages/Settings';
import { ActivityLogs } from './pages/ActivityLogs';
import { Layout } from './components/Layout';
import { User, Role } from './types';
import { mockStore } from './services/mockService';

// --- Auth Context ---
interface AuthContextType {
  user: User | null;
  login: (u: string, p: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>(null!);

export const useAuth = () => useContext(AuthContext);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (u: string, p: string) => {
    // Pass both username and password to the store
    const loggedUser = await mockStore.login(u, p);
    if (loggedUser) {
      setUser(loggedUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    if (user) {
        mockStore.logout(user);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Protected Route ---
const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: Role[] }> = ({ children, roles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <Layout>{children}</Layout>;
};

// --- Main App ---
const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/submit" element={
            <ProtectedRoute roles={[Role.Admin, Role.Sales]}>
              <SubmitInstructions />
            </ProtectedRoute>
          } />
          
          <Route path="/instructions" element={
            <ProtectedRoute>
              <ReviewInstructions />
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          
          <Route path="/logs" element={
            <ProtectedRoute roles={[Role.Admin]}>
              <ActivityLogs />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;