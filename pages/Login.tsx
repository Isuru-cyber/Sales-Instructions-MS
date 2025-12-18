import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Input, Button, Card } from '../components/Common';
import { Lock, User } from 'lucide-react';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const success = await login(username, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Invalid username or password. Please try again.');
      }
    } catch (e) {
      setError('Login failed. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md p-8 border-t-4 border-t-primary">
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 text-primary mb-4">
                <Lock size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Instructions MS</h1>
            <p className="text-gray-500 mt-2">Sign in to manage instructions</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="Username" 
            value={username} 
            onChange={e => setUsername(e.target.value)}
            placeholder="e.g. admin"
            icon={<User size={18} />}
          />
          <Input 
            label="Password" 
            type="password"
            value={password} 
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          
          {error && <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm text-center font-medium">{error}</div>}

          <Button type="submit" disabled={loading} className="w-full py-3 text-lg shadow-md hover:shadow-lg transition-all">
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>

          <div className="text-center text-xs text-gray-400 mt-4">
              Authorized personnel only. Logs are recorded.
          </div>
        </form>
      </Card>
    </div>
  );
};