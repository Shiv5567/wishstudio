/* Layout wrapper */
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MobileNav from './MobileNav';
import useUIStore from '../../stores/uiStore';

export default function Layout({ children }) {
  const location = useLocation();
  const initTheme = useUIStore((s) => s.initTheme);

  useEffect(() => {
    initTheme();
  }, []);

  /* Scroll to top on route change */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <>
      {!isAdmin && <Header />}
      <main className="main-content" style={{ flex: 1 }}>
        {children}
      </main>
      {!isAdmin && <Footer />}
      {!isAdmin && <MobileNav />}
    </>
  );
}
