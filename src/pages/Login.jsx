/* User Login page */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Mail, Lock, User } from 'lucide-react';
import SEOHead from '../components/SEOHead';
import './AdminPages.css';

export default function Login() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <SEOHead title={isRegister ? 'Sign Up' : 'Login'} description="Sign in to Wish Studio." />
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-icon" style={{ width: 48, height: 48, fontSize: 'var(--text-xl)' }}>W</div>
          <h1 className="auth-title">{isRegister ? 'Create Account' : 'Welcome Back'}</h1>
          <p className="auth-subtitle">{isRegister ? 'Sign up to save your creations' : 'Sign in to access your saved wishes'}</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label className="input-label">Email</label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
          </div>
          <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? <span className="spinner spinner-sm" /> : (isRegister ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
          <button
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 'var(--space-3)' }}>
          <Link to="/admin/login" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Admin Login →</Link>
        </div>
      </div>
    </div>
  );
}
