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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md border-2 border-ucr-blue/20 shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="size-16 bg-ucr-blue rounded-full flex items-center justify-center">
              <LogIn className="size-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-center text-ucr-blue">
            Sign In
          </CardTitle>
          <CardDescription className="text-center text-gray-600 px-2">
            Sign in to access your personalized parking recommendations and saved schedules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-ucr-blue font-medium">
                Email or Username
              </Label>
              <Input
                id="email"
                type="text"
                placeholder="student@ucr.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-ucr-blue/30 focus:border-ucr-blue w-full"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-ucr-blue font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-ucr-blue/30 focus:border-ucr-blue w-full"
                disabled={isLoading}
                required
                minLength={6}
              />
            </div>

            {message && (
              <Alert className={message.type === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                {message.type === 'success' ? (
                  <CheckCircle2 className="size-4 text-green-600" />
                ) : (
                  <AlertCircle className="size-4 text-red-600" />
                )}
                <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-ucr-blue hover:bg-ucr-blue-dark text-white font-semibold py-2.5"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin mr-2">⏳</span>
                  Signing in...
                </span>
              ) : (
                <>
                  <LogIn className="size-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>

            {/* Additional Info */}
            <div className="bg-blue-50 border border-ucr-blue/20 rounded-lg p-3 mt-4">
              <p className="text-xs sm:text-sm text-gray-700">
                <strong className="text-ucr-blue">Why sign in?</strong> Your account allows us to save your uploaded schedules, 
                remember your preferences, and provide personalized parking predictions based on your class times.
              </p>
            </div>

            <div className="text-center text-sm text-gray-600 mt-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-ucr-blue hover:underline font-medium"
              >
                Back to Parking Finder
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}