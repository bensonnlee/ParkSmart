import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { MapPin, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function Welcome() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else {
      toast.error('Please enter your email and password');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 lg:p-16 bg-white">
        <div className="max-w-md mx-auto w-full">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="bg-green-500 rounded-lg p-2">
              <MapPin className="size-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Campus Parking Optimizer</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Park Smarter,<br />Not Harder.
            </h1>
            <p className="text-gray-600">
              Welcome back! Get parking recommendations for your classes instantly.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 h-12"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <button
                  type="button"
                  className="text-sm text-ucr-blue hover:underline"
                  onClick={() => toast.info('Password reset link sent to your email')}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 h-12 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-green-500 hover:bg-green-600 text-white text-base font-medium"
              size="lg"
            >
              Log In
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-base"
              onClick={() => navigate('/onboarding/upload')}
            >
              Create Account
            </Button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-6">
            By logging in, you agree to our{' '}
            <button className="text-ucr-blue hover:underline">Terms of Service</button>
            {' '}and{' '}
            <button className="text-ucr-blue hover:underline">Privacy Policy</button>
          </p>
        </div>
      </div>

      {/* Right Side - Campus Image with Preview */}
      <div className="hidden lg:block lg:w-1/2 relative bg-gradient-to-br from-green-100 to-green-50">
        <div className="absolute inset-0 flex items-center justify-center p-16">
          <div className="text-center">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md">
              <div className="mb-4">
                <div className="w-full h-64 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center text-white">
                  <div className="text-center">
                    <MapPin className="size-20 mx-auto mb-4" />
                    <p className="text-sm opacity-90">UCR Campus Map</p>
                  </div>
                </div>
              </div>
              
              {/* Preview Card */}
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-green-500 rounded-full size-10 flex items-center justify-center">
                      <MapPin className="size-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">RECOMMENDED SPOT</p>
                      <p className="text-xs text-gray-600">North Garage - Lev...</p>
                    </div>
                  </div>
                  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    92% Match
                  </span>
                </div>
                <div className="bg-white rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-gray-100 rounded-full size-8 flex items-center justify-center">
                      <span className="text-xs font-semibold">⏰</span>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-gray-500">Next Class:</p>
                      <p className="text-sm font-semibold text-gray-900">Physics 101 @ 2:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}