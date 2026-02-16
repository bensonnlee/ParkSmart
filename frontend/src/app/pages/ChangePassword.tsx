import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { ArrowLeft, Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function ChangePassword() {
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password validation
  const passwordsMatch = newPassword === confirmPassword && confirmPassword !== '';
  const passwordsDoNotMatch = confirmPassword !== '' && newPassword !== confirmPassword;
  const passwordTooShort = newPassword !== '' && newPassword.length < 8;
  const oldPasswordEntered = oldPassword !== '';
  const newPasswordEntered = newPassword !== '';
  const confirmPasswordEntered = confirmPassword !== '';

  const canSubmit = 
    oldPasswordEntered && 
    newPasswordEntered && 
    confirmPasswordEntered && 
    passwordsMatch && 
    !passwordTooShort;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) {
      return;
    }

  const token = localStorage.getItem("token");
  if (!token) {
    toast.error("You are not logged in. Please log in again.");
    navigate("/welcome");
    return;
  }

  setIsSubmitting(true);

  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      toast.error(data.detail || "Password change failed.");
      return;
    }

    toast.success("Password changed successfully!", {
      description: "Please use your new password the next time you sign in.",
    });

    navigate("/dashboard/settings");
  } catch (err) {
    toast.error("Network error. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/settings')}
            className="mb-3 -ml-2"
          >
            <ArrowLeft className="size-4 mr-1" />
            Back to Settings
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Change Password</h1>
          <p className="text-sm text-gray-500">Update your account password</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Password Change Form */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#003DA5] rounded-full p-3">
                <Lock className="size-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Reset Your Password</h2>
                <p className="text-sm text-gray-500">Enter your current password and choose a new one</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Old Password */}
              <div>
                <Label htmlFor="old-password" className="text-sm text-gray-700 mb-2 block">
                  Current Password
                </Label>
                <div className="relative">
                  <Input
                    id="old-password"
                    type={showOldPassword ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showOldPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="border-t pt-6">
                {/* New Password */}
                <div className="mb-4">
                  <Label htmlFor="new-password" className="text-sm text-gray-700 mb-2 block">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter your new password"
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showNewPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  {passwordTooShort && (
                    <div className="flex items-center gap-2 mt-2 text-red-600">
                      <AlertCircle className="size-4" />
                      <p className="text-xs">Password must be at least 8 characters</p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <Label htmlFor="confirm-password" className="text-sm text-gray-700 mb-2 block">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  {passwordsDoNotMatch && (
                    <div className="flex items-center gap-2 mt-2 text-red-600">
                      <AlertCircle className="size-4" />
                      <p className="text-xs">Passwords do not match</p>
                    </div>
                  )}
                  {passwordsMatch && (
                    <div className="flex items-center gap-2 mt-2 text-green-600">
                      <CheckCircle2 className="size-4" />
                      <p className="text-xs">Passwords match</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Password Requirements */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-900 mb-2">Password Requirements:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className={newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}>
                      {newPassword.length >= 8 ? '✓' : '○'}
                    </span>
                    At least 8 characters long
                  </li>
                  <li className="flex items-start gap-2">
                    <span className={/[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}>
                      {/[A-Z]/.test(newPassword) ? '✓' : '○'}
                    </span>
                    Contains at least one uppercase letter
                  </li>
                  <li className="flex items-start gap-2">
                    <span className={/[a-z]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}>
                      {/[a-z]/.test(newPassword) ? '✓' : '○'}
                    </span>
                    Contains at least one lowercase letter
                  </li>
                  <li className="flex items-start gap-2">
                    <span className={/[0-9]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}>
                      {/[0-9]/.test(newPassword) ? '✓' : '○'}
                    </span>
                    Contains at least one number
                  </li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard/settings')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="flex-1 bg-[#003DA5] hover:bg-[#002870] text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Changing Password...' : 'Change Password'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="size-5 text-[#F1AB00] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">Security Reminder</p>
              <p className="text-xs text-gray-600">
                After changing your password, you'll be logged out on all other devices. 
                Make sure to remember your new password or store it in a password manager.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
