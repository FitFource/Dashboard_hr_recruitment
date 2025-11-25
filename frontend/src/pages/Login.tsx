import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
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
      setAuth(response.data.user, response.data.token);
      toast.success('Login successful!');
      navigate('/');
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
    <div className="min-h-screen bg-gradient-to-br from-mint-200 via-mint-100 to-peach-100 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md border border-mint-300/30">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-mint-400 to-mint-500 rounded-3xl mb-4 shadow-lg shadow-mint-400/30 border border-mint-500/20">
            <LogIn className="text-dark-300" size={36} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold text-dark-300 tracking-tight">Welcome Back</h1>
          <p className="text-dark-300/70 mt-2">HR Recruitment Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm text-dark-300 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-mint-300/60 rounded-2xl focus:ring-2 focus:ring-peach-300/50 focus:border-peach-400 transition-all bg-mint-50/30 hover:bg-white text-dark-300 shadow-sm"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-dark-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-mint-300/60 rounded-2xl focus:ring-2 focus:ring-peach-300/50 focus:border-peach-400 transition-all bg-mint-50/30 hover:bg-white text-dark-300 shadow-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-mint-500 to-mint-400 text-dark-300 rounded-2xl hover:from-mint-600 hover:to-mint-500 focus:ring-3 focus:ring-peach-300/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-mint-400/30 hover:shadow-xl hover:shadow-peach-300/40 hover:scale-[1.02]"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
