import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const user = response.data.user;
      const token = response.data.token;
      setAuth(user, token);
      toast.success('Login successful!');
      
      // Role-based redirect
      if (user.role === 'admin' || user.role === 'viewer') {
        navigate('/dashboard');   
      } else if (user.role === 'user') {
        navigate('/user/home'); 
      } else {
        navigate('/login'); 
      }
    } catch (error: any) {
      let message = 'Login failed';
      if (error.response?.status === 401) {
        message = 'Please check again your email and password!';
      }
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: message,
        showConfirmButton: true,
      });
      console.error('Login error:', error);
    }finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-light to-accent/20 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md border border-accent/30">
        <div className="text-center mb-8">

          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-900 rounded-3xl mb-4 shadow-lg shadow-primary-500/30 border border-primary-500/20">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className="w-14 h-14 text-background"
            >
              <path
                d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v1.2h19.2v-1.2c0-3.2-6.4-4.8-9.6-4.8z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-primary-900 tracking-tight">LOGIN</h1>
          <p className="text-primary-900/70 mt-2">RecruitMate AI</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm text-primary-900 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-accent/60 rounded-2xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all bg-background/30 hover:bg-white text-primary-900 shadow-sm"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-primary-900 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-accent/60 rounded-2xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all bg-background/30 hover:bg-white text-primary-900 shadow-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-primary-900 text-background rounded-2xl hover:from-primary-600 hover:to-primary-800 focus:ring-3 focus:ring-primary-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-600/40 hover:scale-[1.02] font-medium"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>

  );
};

export default Login;
