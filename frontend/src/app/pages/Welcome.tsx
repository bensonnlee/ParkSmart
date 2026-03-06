import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { MapPin, Eye, EyeOff, Loader2 } from 'lucide-react';
import campusBg from '@/assets/ucr_background_login.webp';
import { toast } from 'sonner';
import { setTokens } from '@/api/tokenStorage';
import { API_BASE } from '@/api/config';

export default function Welcome() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter your email and password');
      return;
    }

    setIsLoading(true);
    const apiUrl = `${API_BASE}/api/auth/login`;

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();
      console.log("SERVER RESPONSE DATA:", data);

      if (response.ok) { //new addition to handle multiple token structures
        const authToken = data.access_token ?? data.token ?? data.tokens?.access_token;
        const refreshToken = data.refresh_token ?? data.tokens?.refresh_token;

        if (authToken) {
          setTokens(authToken, refreshToken ?? "");

          if (data.user) {
            localStorage.setItem("user", JSON.stringify(data.user));
          }

          toast.success('Welcome back!');
          navigate('/dashboard');
        } else {
          console.error("Structure changed! Found keys:", Object.keys(data));
          toast.error("Login successful but token missing in response structure.");
        }
      } else {
        toast.error(data.detail || 'Invalid email or password');
      }
    } catch (err) {
      console.error("Fetch failed:", err);
      toast.error('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
  if (!email.trim()) {
    toast.error("Enter your email first.");
    return;
  }

  // If you don’t have an API endpoint yet, this at least makes the UI work:
  toast.success("If an account exists, a reset link was sent to your email.");
};

  return (
    <div className="min-h-screen flex">
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 lg:p-16 bg-white">
        <div className="max-w-md mx-auto w-full">
          <div className="flex items-center gap-2 mb-8">
            <div className="bg-blue-600 rounded-lg p-2">
              <MapPin className="size-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">ParkSmart</span>
          </div>

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Park Smarter,<br />Not Harder.
            </h1>
            <p className="text-blue-600 font-medium">
            </p>
          </div>

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
                className="mt-1 h-12 border-blue-100 focus:border-blue-500"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isLoading}
                  className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 h-12 pr-10 border-blue-100 focus:border-blue-500"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white text-base font-medium"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Log In'
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-base border-blue-200 text-blue-600 hover:bg-blue-50"
              onClick={() => navigate('/signup')}
              disabled={isLoading}
            >
              Create Account
            </Button>
          </form>
        </div>
      </div>

      <div
        className="hidden lg:block lg:w-1/2 relative bg-cover"
        style={{ backgroundImage: `url(${campusBg})`, backgroundPosition: '70% center' }}
      />
    </div>
  );
}