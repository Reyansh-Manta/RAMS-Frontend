import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import Navbar from './components/Navbar';
import Ribbon from './components/Ribbon';
import RightDrawer from './components/RightDrawer';
import Sidebar from './components/Sidebar';
import ChatPage from './pages/ChatPage';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminStats from './pages/AdminStats';
import { ThemeProvider } from './context/ThemeContext';
import useHeartbeat from './hooks/useHeartbeat';
import DottedBackground from './components/DottedBackground';
import FAQ from './pages/FAQ';
import './App.css';

function HeartbeatProvider({ children }) {
  useHeartbeat();
  return children;
}

function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const location = useLocation();

  const isChatRoute = location.pathname === '/';

  return (
    <div className={`app-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${isChatRoute ? 'chat-route' : ''}`}>
      {/* Far-Left vertical ribbon */}
      <Ribbon onToggleRightDrawer={() => setRightDrawerOpen(!rightDrawerOpen)} />

      {/* Collapsible recent chats drawer (Only visible on chat route) */}
      {isChatRoute && (
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}

      {/* Slide-out options tray */}
      <RightDrawer isOpen={rightDrawerOpen} onClose={() => setRightDrawerOpen(false)} />

      {/* Main page frame next to sidebars */}
      <div className="app-main-content">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onToggleRightDrawer={() => setRightDrawerOpen(!rightDrawerOpen)}
        />
        <main className="app-page-wrapper">
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <DottedBackground />
      <BrowserRouter>
        <AuthProvider>
          <ChatProvider>
            <HeartbeatProvider>
              <MainLayout>
                <Routes>
                  <Route path="/" element={<ChatPage />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/admin" element={<Navigate to="/login" replace />} />
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/stats" element={<AdminStats />} />
                </Routes>
              </MainLayout>
            </HeartbeatProvider>
          </ChatProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
