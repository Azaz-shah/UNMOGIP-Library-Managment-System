import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineUser, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff, HiOutlineArrowRight } from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../api';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', {
        email: form.email.trim(),
        password: form.password.trim(),
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      toast.success(`Welcome back, ${data.name}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f0f2f5',
      padding: '1rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '2.5rem 2.5rem 2rem', textAlign: 'center' }}>
          {/* UNMOGIP Seal */}
          <div style={{ marginBottom: '1rem' }}>
            <img
              src="/unmogip-seal.svg"
              alt="UNMOGIP Seal"
              style={{ width: '80px', height: '80px' }}
            />
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: '1.4rem',
            fontWeight: 700,
            color: '#1a8fbf',
            margin: '0 0 0.15rem',
            letterSpacing: '1px',
          }}>UNMOGIP</h1>
          <p style={{
            fontSize: '0.95rem',
            color: '#555',
            margin: '0 0 2rem',
            fontWeight: 400,
          }}>Library Management System</p>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
            {/* Email Field */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#333',
                marginBottom: '0.4rem',
                letterSpacing: '0.5px',
              }}>EMAIL OR USERNAME</label>
              <div style={{ position: 'relative' }}>
                <HiOutlineUser style={{
                  position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)',
                  color: '#999', fontSize: '1rem',
                }} />
                <input
                  type="text"
                  required
                  placeholder="Enter credential"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.85rem 0.7rem 2.5rem',
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    outline: 'none',
                    color: '#333',
                    background: '#fff',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#1a8fbf'}
                  onBlur={(e) => e.target.style.borderColor = '#d9d9d9'}
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#333',
                marginBottom: '0.4rem',
                letterSpacing: '0.5px',
              }}>PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <HiOutlineLockClosed style={{
                  position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)',
                  color: '#999', fontSize: '1rem',
                }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.7rem 2.5rem 0.7rem 2.5rem',
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    outline: 'none',
                    color: '#333',
                    background: '#fff',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                    letterSpacing: showPassword ? 'normal' : '2px',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#1a8fbf'}
                  onBlur={(e) => e.target.style.borderColor = '#d9d9d9'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#999',
                    padding: '0.25rem', display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPassword ? <HiOutlineEyeOff size={18} /> : <HiOutlineEye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me + Forgot Password */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
            }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                fontSize: '0.82rem', color: '#666', cursor: 'pointer',
              }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: '#1a8fbf', width: '14px', height: '14px' }}
                />
                Remember Me
              </label>
              <a href="#" style={{
                fontSize: '0.82rem',
                color: '#1a8fbf',
                textDecoration: 'none',
                fontWeight: 500,
              }}>
                Forgot Password?
              </a>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.7rem',
                background: loading ? '#9dd5e6' : '#1a8fbf',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'background 0.2s',
                letterSpacing: '0.3px',
              }}
            >
              {loading ? 'Signing in...' : <>Login <HiOutlineArrowRight size={16} /></>}
            </button>
          </form>

          {/* Register Link */}
          <p style={{
            textAlign: 'center',
            marginTop: '1.25rem',
            fontSize: '0.82rem',
            color: '#666',
          }}>
            First time?{' '}
            <a href="/register" style={{ color: '#1a8fbf', fontWeight: 600, textDecoration: 'none' }}>
              Register Admin
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
