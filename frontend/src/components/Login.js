import React, { useState } from 'react';
import { authAPI, apiUtils } from '../services/api';

const Login = ({ onLogin, addNotification }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      
      if (response.data.success) {
        onLogin(response.data.token, response.data.user);
        addNotification(`Welcome back, ${response.data.user.name}!`, 'success');
      }
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role) => {
    setLoading(true);
    
    const demoCredentials = {
      email: role === 'admin' ? 'admin@nexusrealtync.co' : 'agent@nexusrealtync.co',
      password: 'password123'
    };

    try {
      const response = await authAPI.login(demoCredentials);
      
      if (response.data.success) {
        onLogin(response.data.token, response.data.user);
        addNotification(`Logged in as demo ${role}`, 'success');
      }
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Nexus Realty NC
            </h1>
            <p className="text-sm text-gray-600">
              Nexus Realty Loop Management Software
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or try demo</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('admin')}
                  className="btn btn-outline w-full"
                  disabled={loading}
                >
                  Demo Admin Login
                </button>
                
                <button
                  type="button"
                  onClick={() => handleDemoLogin('agent')}
                  className="btn btn-outline w-full"
                  disabled={loading}
                >
                  Demo Agent Login
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowDemo(!showDemo)}
                className="mt-4 text-sm text-blue-600 hover:text-blue-500 w-full text-center"
              >
                {showDemo ? 'Hide' : 'Show'} Demo Credentials
              </button>

              {showDemo && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm">
                  <h4 className="font-semibold mb-2">Demo Credentials:</h4>
                  <div className="space-y-2">
                    <div>
                      <strong>Admin:</strong><br />
                      Email: admin@nexusrealtync.co<br />
                      Password: password123
                    </div>
                    <div>
                      <strong>Agent:</strong><br />
                      Email: agent@nexusrealtync.co<br />
                      Password: password123
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            <i>"Build loops, built relationships"</i>
          </p>
          <p className="text-xs text-gray-400 mt-2">
            © 2025 Nexus Realty NC. All rights reserved.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            <a
              href="https://www.nexusrealtync.com/privacy/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 underline transition-colors duration-200"
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
