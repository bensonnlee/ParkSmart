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
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const BASE = import.meta.env.VITE_API_BASE_URL || "https://parksmart-api.onrender.com";

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !displayName) {
      toast.error("Please fill out all fields");
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
