import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { toast } from "sonner";

export default function SignUp() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const BASE = import.meta.env.VITE_API_BASE_URL || "https://parksmart-api.onrender.com";

  const passwordValid =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password);


  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !displayName) {
      toast.error("Please fill out all fields");
      return;
    }

    if (!passwordValid) {
      toast.error("Password must be 8+ chars and include uppercase, lowercase, and a number.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${BASE}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          display_name: displayName,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.detail || "Signup failed");
        return;
      }

      toast.success("Account created! Please log in.");
      navigate("/"); // back to Welcome
    } catch (err) {
      toast.error("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-white">
      <form onSubmit={handleSignup} className="w-full max-w-md space-y-5 border rounded-xl p-6">
        <h1 className="text-2xl font-bold">Create Account</h1>

        <div>
          <Label>Email</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </div>

        <div>
          <Label>Display Name</Label>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        </div>

        <div>
          <Label>Password</Label>
          <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </div>

        <div>
          <Label>Confirm Password</Label>
          <Input
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            type="password"
            required
          />
          {confirmPassword && password !== confirmPassword && (
            <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-900 mb-2">Password Requirements:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className={passwordValid ? 'text-green-600' : 'text-gray-400'}>
                      {passwordValid ? '✓' : '○'}
                    </span>
                    At least 8 characters long
                  </li>
                  <li className="flex items-start gap-2">
                    <span className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-400'}>
                      {/[A-Z]/.test(password) ? '✓' : '○'}
                    </span>
                    Contains at least one uppercase letter
                  </li>
                  <li className="flex items-start gap-2">
                    <span className={/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-400'}>
                      {/[a-z]/.test(password) ? '✓' : '○'}
                    </span>
                    Contains at least one lowercase letter
                  </li>
                  <li className="flex items-start gap-2">
                    <span className={/[0-9]/.test(password) ? 'text-green-600' : 'text-gray-400'}>
                      {/[0-9]/.test(password) ? '✓' : '○'}
                    </span>
                    Contains at least one number
                  </li>
                </ul>
              </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Account"}
        </Button>

        <Button type="button" variant="outline" className="w-full" onClick={() => navigate("/")}>
          Back to Login
        </Button>
      </form>
    </div>
  );
}
