import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { LogIn, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    // Simulate authentication
    setTimeout(() => {
      if (email && password) {
        // Mock successful login
        setMessage({ type: 'success', text: 'Sign in successful! Redirecting...' });
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        setMessage({ type: 'error', text: 'Please enter both email and password.' });
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-ucr-blue to-blue-900 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md border-2 border-white/20 shadow-2xl bg-white/95 backdrop-blur">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="size-20 bg-gradient-to-br from-ucr-blue to-blue-700 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
              <LogIn className="size-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl sm:text-4xl font-bold text-center text-ucr-blue">
            Sign In
          </CardTitle>
          <CardDescription className="text-center text-gray-600 px-2 text-base">
            Access your personalized parking recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-ucr-blue font-semibold text-base">
                Email or Username
              </Label>
              <Input
                id="email"
                type="text"
                placeholder="student@ucr.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-2 border-ucr-blue/30 focus:border-ucr-blue focus:ring-2 focus:ring-ucr-blue/20 w-full h-12 text-base"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-ucr-blue font-semibold text-base">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-2 border-ucr-blue/30 focus:border-ucr-blue focus:ring-2 focus:ring-ucr-blue/20 w-full h-12 text-base"
                disabled={isLoading}
                required
                minLength={6}
              />
            </div>

            {message && (
              <Alert className={message.type === 'success' ? 'border-2 border-blue-500 bg-blue-50' : 'border-2 border-red-500 bg-red-50'}>
                {message.type === 'success' ? (
                  <CheckCircle2 className="size-5 text-blue-600" />
                ) : (
                  <AlertCircle className="size-5 text-red-600" />
                )}
                <AlertDescription className={message.type === 'success' ? 'text-blue-800 font-medium' : 'text-red-800 font-medium'}>
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-ucr-blue to-blue-700 hover:from-blue-700 hover:to-ucr-blue text-white font-bold py-3.5 text-base shadow-lg hover:shadow-xl transition-all h-14"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin mr-2">⏳</span>
                  Signing in...
                </span>
              ) : (
                <>
                  <LogIn className="size-5 mr-2" />
                  Sign In
                </>
              )}
            </Button>

            {/* Additional Info */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-ucr-blue/30 rounded-xl p-4 mt-5">
              <p className="text-sm sm:text-base text-gray-700">
                <strong className="text-ucr-blue font-bold">Why sign in?</strong> Save your uploaded schedules, 
                remember your preferences, and get personalized parking predictions based on your class times.
              </p>
            </div>

            <div className="text-center text-sm text-gray-600 mt-5">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-ucr-blue hover:text-blue-700 font-semibold hover:underline transition-colors"
              >
                ← Back to Parking Finder
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}