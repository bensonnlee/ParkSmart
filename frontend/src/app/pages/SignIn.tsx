import { login } from '../../api/auth'
import { useState } from 'react';
import { useNavigate, Link } from 'react-router'; // Unified imports
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { LogIn, AlertCircle, CheckCircle2, Sparkles, MapPin } from 'lucide-react';

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
  
    try {
      const data = await login(email, password);
      if (data && data.tokens?.access_token) {
        localStorage.setItem('token', data.tokens.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('authChange')); 

        setMessage({ type: 'success', text: "We're in! Finding your spot... 🚗" });
        setTimeout(() => navigate('/'), 1500);
      } else {
        setMessage({ type: 'error', text: 'Oops! The server is acting shy. Try again?' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Identity theft is not a joke, Jim! (Or just a wrong password).' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-100 via-slate-50 to-yellow-100 flex items-center justify-center px-4 py-8">
      {/* Decorative background elements */}
      <div className="absolute top-10 left-10 text-ucr-blue/10 rotate-12 hidden md:block"><MapPin size={120} /></div>
      <div className="absolute bottom-10 right-10 text-yellow-500/10 -rotate-12 hidden md:block"><Sparkles size={120} /></div>

      <Card className="w-full max-w-md border-t-8 border-t-ucr-blue shadow-2xl backdrop-blur-sm bg-white/90 transform transition-all hover:scale-[1.01]">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-2">
            <div className="size-20 bg-gradient-to-tr from-ucr-blue to-blue-400 rounded-2xl rotate-3 flex items-center justify-center shadow-lg group hover:rotate-0 transition-transform">
              <LogIn className="size-10 text-white group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <CardTitle className="text-3xl font-black text-center bg-clip-text text-transparent bg-gradient-to-r from-ucr-blue to-blue-700">
            Welcome Back!
          </CardTitle>
          <CardDescription className="text-center font-medium text-slate-500">
            Ready to beat the Lot 30 rush? 🏁
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-bold uppercase tracking-wider text-slate-700">Student Identity</Label>
              <Input
                id="email"
                type="text"
                placeholder="R'lyeh@ucr.edu"
                className="h-12 border-2 focus:ring-ucr-blue transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Secret Code
            </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-12 border-2 focus:ring-ucr-blue transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            {message && (
              <Alert className={`animate-bounce ${message.type === 'success' ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'}`}>
                <AlertDescription className="font-bold text-center w-full">
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-ucr-blue hover:bg-blue-700 text-white text-lg font-bold shadow-[0_4px_0_rgb(30,58,138)] active:shadow-none active:translate-y-1 transition-all"
              disabled={isLoading}
            >
              {isLoading ? "Consulting the Map..." : "Let's Ride 🏎️"}
            </Button>
          </form>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200"></span></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold">New around here?</span></div>
          </div>

          <div className="space-y-3">
            <Link to="/register" className="block w-full text-center py-2 rounded-lg border-2 border-ucr-blue text-ucr-blue font-bold hover:bg-blue-50 transition-colors">
              Create an Account 🎟️
            </Link>
            
            <button
              onClick={() => navigate('/')}
              className="w-full text-center text-sm font-semibold text-slate-400 hover:text-ucr-blue transition-colors"
            >
              ← Just browsing for now
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}