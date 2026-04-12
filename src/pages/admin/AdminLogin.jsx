/* Admin Login page */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import SEOHead from '../../components/SEOHead';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const token = await cred.user.getIdTokenResult();
      if (token.claims.admin) {
        navigate('/admin');
      } else {
        setError('Access denied. Admin privileges required.');
        await auth.signOut();
      }
    } catch (err) {
      setError(err.code === 'auth/invalid-credential' ? 'Invalid email or password.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <SEOHead title="Admin Login" description="Admin login for Wish Studio dashboard." />
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-icon" style={{ width: 48, height: 48, fontSize: 'var(--text-xl)' }}>W</div>
          <h1 className="auth-title">Admin Login</h1>
          <p className="auth-subtitle">Sign in to manage Wish Studio content</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label className="input-label">Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input type="email" className="input" style={{ paddingLeft: 40 }} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@wishstudio.com" required />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input type={showPw ? 'text' : 'password'} className="input" style={{ paddingLeft: 40 }} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              <button type="button" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }} onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? <span className="spinner spinner-sm" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
