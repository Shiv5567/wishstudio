/* App.jsx — Route definitions */
import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';

/* Eagerly loaded */
import Home from './pages/Home';

/* Lazy loaded pages */
const Explore = lazy(() => import('./pages/Explore'));
const TemplateDetail = lazy(() => import('./pages/TemplateDetail'));
const Editor = lazy(() => import('./pages/Editor'));
const Favorites = lazy(() => import('./pages/Favorites'));
const MyDownloads = lazy(() => import('./pages/MyDownloads'));
const UploadPage = lazy(() => import('./pages/Upload'));
const Login = lazy(() => import('./pages/Login'));

/* Static pages */
const StaticPages = lazy(() => import('./pages/StaticPages'));

/* Admin pages */
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminTemplates = lazy(() => import('./pages/admin/AdminTemplates'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminUploads = lazy(() => import('./pages/admin/AdminUploads'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));

/* Loading fallback */
function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="spinner spinner-lg" />
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/template/:slug" element={<TemplateDetail />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/my-downloads" element={<MyDownloads />} />
          <Route path="/recent" element={<Favorites />} />
          <Route path="/login" element={<Login />} />

          {/* Static Pages */}
          <Route path="/about" element={<Suspense fallback={<PageLoader />}><StaticAbout /></Suspense>} />
          <Route path="/contact" element={<Suspense fallback={<PageLoader />}><StaticContact /></Suspense>} />
          <Route path="/privacy" element={<Suspense fallback={<PageLoader />}><StaticPrivacy /></Suspense>} />
          <Route path="/terms" element={<Suspense fallback={<PageLoader />}><StaticTerms /></Suspense>} />
          <Route path="/faq" element={<Suspense fallback={<PageLoader />}><StaticFAQ /></Suspense>} />

          {/* Admin Pages */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />}>
            <Route index element={<AdminOverviewLazy />} />
            <Route path="templates" element={<AdminTemplates />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="uploads" element={<AdminUploads />} />
            <Route path="analytics" element={<AdminAnalytics />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

/* Static page wrappers (lazy loaded named exports) */
function StaticAbout() {
  const [mod, setMod] = React.useState(null);
  React.useEffect(() => { import('./pages/StaticPages').then(m => setMod(m)); }, []);
  if (!mod) return <PageLoader />;
  const C = mod.About;
  return <C />;
}
function StaticContact() {
  const [mod, setMod] = React.useState(null);
  React.useEffect(() => { import('./pages/StaticPages').then(m => setMod(m)); }, []);
  if (!mod) return <PageLoader />;
  const C = mod.Contact;
  return <C />;
}
function StaticPrivacy() {
  const [mod, setMod] = React.useState(null);
  React.useEffect(() => { import('./pages/StaticPages').then(m => setMod(m)); }, []);
  if (!mod) return <PageLoader />;
  const C = mod.Privacy;
  return <C />;
}
function StaticTerms() {
  const [mod, setMod] = React.useState(null);
  React.useEffect(() => { import('./pages/StaticPages').then(m => setMod(m)); }, []);
  if (!mod) return <PageLoader />;
  const C = mod.Terms;
  return <C />;
}
function StaticFAQ() {
  const [mod, setMod] = React.useState(null);
  React.useEffect(() => { import('./pages/StaticPages').then(m => setMod(m)); }, []);
  if (!mod) return <PageLoader />;
  const C = mod.FAQ;
  return <C />;
}

function AdminOverviewLazy() {
  const [mod, setMod] = React.useState(null);
  React.useEffect(() => { import('./pages/admin/AdminDashboard').then(m => setMod(m)); }, []);
  if (!mod) return <PageLoader />;
  const C = mod.AdminOverview;
  return <C />;
}

function NotFound() {
  return (
    <div className="container" style={{ paddingTop: 'var(--space-12)' }}>
      <div className="empty-state">
        <div className="empty-state-icon" style={{ fontSize: '3rem', background: 'var(--color-gray-100)' }}>🔍</div>
        <h1 className="empty-state-title">Page Not Found</h1>
        <p className="empty-state-text">The page you're looking for doesn't exist or has been moved.</p>
        <a href="/" className="btn btn-primary">Go Home</a>
      </div>
    </div>
  );
}
