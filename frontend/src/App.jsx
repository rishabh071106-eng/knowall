import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Category from './pages/Category.jsx';
import Course from './pages/Course.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import MyCourses from './pages/MyCourses.jsx';
import Admin from './pages/Admin.jsx';
import Terms from './pages/legal/Terms.jsx';
import Privacy from './pages/legal/Privacy.jsx';
import Refund from './pages/legal/Refund.jsx';
import Contact from './pages/legal/Contact.jsx';

function RequireAuth({ children, staff }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (staff && !['admin', 'instructor'].includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 py-6 w-full flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/category/:slug" element={<Category />} />
            <Route path="/courses/:slug" element={<Course />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/my" element={<RequireAuth><MyCourses /></RequireAuth>} />
            <Route path="/admin/*" element={<RequireAuth staff><Admin /></RequireAuth>} />
            <Route path="/terms"   element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/refund"  element={<Refund />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={
              <div className="text-center py-20">
                <h1 className="text-2xl font-semibold">Page not found</h1>
                <Link className="text-brand underline mt-4 inline-block" to="/">Go home</Link>
              </div>
            } />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}
