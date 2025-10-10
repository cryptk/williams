import { useState, useEffect } from "preact/hooks";
import { Router } from "preact-router";
import { Header } from "./components/Header";
import { Auth } from "./components/Auth";
import { Dashboard } from "./pages/Dashboard";
import { Bills } from "./pages/Bills";
import { BillDetails } from "./pages/BillDetails";
import { Categories } from "./pages/Categories";
import { NotFound } from "./pages/NotFound";
import { initCardShadows } from "./utils/cardEffects";
import { ToastContainer } from "./components/Toast";

export function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user data", e);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Initialize card shadow effects when user is logged in
    if (user) {
      const cleanup = initCardShadows();
      return cleanup;
    }
  }, [user]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  if (loading) {
    return <div class="flex min-h-screen items-center justify-center text-xl text-secondary">Loading...</div>;
  }

  if (!user) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div class="flex min-h-screen flex-col">
      <Header user={user} onLogout={handleLogout} />
      <main class="mx-auto w-full max-w-7xl flex-1 px-8 py-8">
        <Router>
          <Dashboard path="/" />
          <Bills path="/bills" />
          <BillDetails path="/bills/:id" />
          <Categories path="/categories" />
          <NotFound default />
        </Router>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </main>
    </div>
  );
}
