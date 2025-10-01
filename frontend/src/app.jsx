import { useState, useEffect } from 'preact/hooks';
import { Router } from 'preact-router';
import { Header } from './components/Header';
import { Auth } from './components/Auth';
import { Dashboard } from './pages/Dashboard';
import { Bills } from './pages/Bills';
import { Categories } from './pages/Categories';
import { NotFound } from './pages/NotFound';

export function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user data');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return <div class="loading">Loading...</div>;
  }

  if (!user) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div class="app">
      <Header user={user} onLogout={handleLogout} />
      <main class="main-content">
        <Router>
          <Dashboard path="/" />
          <Bills path="/bills" />
          <Categories path="/categories" />
          <NotFound default />
        </Router>
      </main>
    </div>
  );
}
