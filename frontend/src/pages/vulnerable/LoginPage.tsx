import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import { vulnerableApi } from '../../services/api';
import toast from 'react-hot-toast';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      // Parse password if it looks like JSON
      let passwordValue: any = password;
      if (password.trim().startsWith('{') && password.trim().endsWith('}')) {
        try {
          passwordValue = JSON.parse(password);
          // JSON payload detected
        } catch {
          // Keep as string if not valid JSON
        }
      }

      const response = await vulnerableApi.login({
        username,
        password: passwordValue
      });

      setResult(response);

      if (response.success) {
        toast.success(response.message);
        // Success login
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error('Login failed: ' + (error.response?.data?.message || error.message));
      setResult({ success: false, error: error.response?.data || error.message });
    } finally {
      setLoading(false);
    }
  };

  // Login helper functions removed

  return (
    <div className="max-w-md mx-auto">
      <div className="vulnerable-card rounded-xl p-8">
        <div className="text-center mb-8">
          <Lock className="h-12 w-12 text-thunderlarra mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Login to VulnShop</h1>
          <p className="text-gray-600 mt-2">Access your account</p>
        </div>

        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-thunderlarra-light to-aged-jade-light rounded-lg p-4 mb-6">
          <div className="text-center">
            <h3 className="text-sm font-semibold text-gray-800">Secure Login</h3>
            <p className="text-sm text-gray-700 mt-1">
              Access your account with enterprise-grade security.
            </p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-16 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-thunderlarra focus:border-transparent"
                placeholder="Enter username"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-16 pr-16 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-thunderlarra focus:border-transparent"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-thunderlarra text-white py-3 rounded-lg hover:bg-thunderlarra-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>

        {/* Quick Login Options */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">✨ Quick Login</h3>
          <div className="space-y-2">
            <button
              onClick={() => { setUsername('admin'); setPassword('password123'); }}
              className="w-full bg-thunderlarra-light text-thunderlarra-dark py-2 px-4 rounded-md hover:bg-thunderlarra transition-colors text-sm"
            >
              👑 Admin Login
            </button>
            <button
              onClick={() => { setUsername('user1'); setPassword('pass123'); }}
              className="w-full bg-aged-jade-light text-aged-jade-dark py-2 px-4 rounded-md hover:bg-aged-jade transition-colors text-sm"
            >
              👤 User Login
            </button>
          </div>
        </div>

        {/* Result Display */}
        {result && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Login Result:</h3>
            <div className={`p-4 rounded-lg ${
              result.success 
                ? result.message?.includes('bypassed') 
                  ? 'bg-red-50 border border-red-200' 
                  : 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Valid Credentials Info */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Valid Credentials:</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>admin</strong> / password123</p>
            <p><strong>user1</strong> / pass123</p>
            <p><strong>john_doe</strong> / secret</p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/dashboard"
            className="text-thunderlarra hover:text-thunderlarra-dark font-medium"
          >
            View Analytics Dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
