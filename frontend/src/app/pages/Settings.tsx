import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useBlocker } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { Slider } from '@/app/components/ui/slider';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/app/components/ui/alert-dialog';
import { PageHeader } from '@/app/components/PageHeader';
import { User, CreditCard, SlidersHorizontal, LogOut, ExternalLink, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE } from '@/api/config';
import { authenticatedFetch } from '@/api/authenticatedFetch';
import { getAccessToken } from '@/api/tokenStorage';
import { logout, deleteAccount } from '@/api/auth';
import { loadPrefs } from '@/lib/prefs';
import type { Prefs } from '@/lib/prefs';

const WALKING_SPEEDS = [
  { value: 1, label: 'Slow'},
  { value: 2, label: 'Medium' },
  { value: 3, label: 'Fast' },
] as const;

export default function Settings() {
  const navigate = useNavigate();

  const user = useMemo(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  }, []);

  const displayName = user?.display_name || user?.name || user?.email?.split("@")?.[0] || "User";
  const email = user?.email || "—";

  const uid = user?.id || user?.user_id || user?.supabase_id;
  const prefsKey = uid ? `prefs:${uid}` : "prefs:guest";

  // Saved state — what's currently persisted in localStorage / DB
  const [savedPrefs, setSavedPrefs] = useState<Prefs>(() => loadPrefs(prefsKey, user));

  // Draft state — what the user is actively editing
  const [parkingPass, setParkingPass] = useState(savedPrefs.parkingPass);
  const [arrivalBuffer, setArrivalBuffer] = useState(savedPrefs.arrivalBuffer);
  const [walkingSpeed, setWalkingSpeed] = useState(savedPrefs.walkingSpeed);

  const isDirty =
    parkingPass !== savedPrefs.parkingPass ||
    arrivalBuffer !== savedPrefs.arrivalBuffer ||
    walkingSpeed !== savedPrefs.walkingSpeed;

  // Re-sync if prefsKey changes (e.g. user switch)
  useEffect(() => {
    const prefs = loadPrefs(prefsKey, user);
    setSavedPrefs(prefs);
    setParkingPass(prefs.parkingPass);
    setArrivalBuffer(prefs.arrivalBuffer);
    setWalkingSpeed(prefs.walkingSpeed);
  }, [prefsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Browser tab close / refresh guard
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // In-app navigation guard
  const blocker = useBlocker(isDirty);

  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      toast.success("Account deleted successfully");
      navigate("/welcome");
    } catch {
      toast.error("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleSaveChanges = async () => {
    const prefs: Prefs = { parkingPass, arrivalBuffer, walkingSpeed, preferredPermitId: savedPrefs.preferredPermitId };

    // Always save to localStorage for immediate local access
    localStorage.setItem(prefsKey, JSON.stringify(prefs));
    setSavedPrefs(prefs);

    // Persist to DB if user is authenticated
    const token = getAccessToken();
    if (token) {
      setIsSaving(true);
      try {
        const res = await authenticatedFetch(`${API_BASE}/api/auth/me/preferences`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parking_pass: parkingPass,
            arrival_buffer: arrivalBuffer,
            walking_speed: walkingSpeed,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to save preferences");
        }

        const data = await res.json();
        // Update localStorage user object with DB-backed values
        if (user) {
          const updated = { ...user, arrival_buffer: data.arrival_buffer, walking_speed: data.walking_speed, preferred_permit_id: data.preferred_permit_id, parking_pass_slug: parkingPass };
          localStorage.setItem("user", JSON.stringify(updated));
        }

        toast.success("Settings saved successfully!");
      } catch {
        toast.error("Settings saved locally, but failed to sync to server.");
      } finally {
        setIsSaving(false);
      }
    } else {
      toast.success("Settings saved successfully!");
    }
  };

  const handleDiscardChanges = () => {
    setParkingPass(savedPrefs.parkingPass);
    setArrivalBuffer(savedPrefs.arrivalBuffer);
    setWalkingSpeed(savedPrefs.walkingSpeed);
    toast("Changes discarded");
  };

  const handleLogout = async () => {
    try { await logout(); } catch { /* server-side failure is non-blocking */ }
    toast.success("Logged out successfully");
    navigate("/welcome");
  };

  return (
    <div className="pb-4">
      <PageHeader
        title="Account Settings"
        subtitle="Manage your account data and parking preferences"
      >
        {/* Unsaved changes banner */}
        {isDirty && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg mt-4 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-amber-800">You have unsaved changes</p>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleDiscardChanges} className="text-amber-800 hover:bg-amber-100">
                  Discard
                </Button>
                <Button size="sm" onClick={handleSaveChanges} disabled={isSaving} className="bg-primary hover:bg-ucr-blue-dark text-white">
                  {isSaving ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </PageHeader>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Account Data */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-blue-50 rounded-full p-3">
                <User className="size-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg leading-tight">Account Data</h2>
                <p className="text-muted-foreground text-sm">{email}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Full Name</Label>
                <Input value={displayName} className="mt-1" readOnly />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Email Address</Label>
                <Input value={email} className="mt-1" readOnly />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parking Permit */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-blue-50 rounded-full p-3">
                <CreditCard className="size-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg leading-tight">Parking Permit</h2>
                <p className="text-muted-foreground text-sm">Select the permit type linked to your vehicle</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <button
                onClick={() => setParkingPass('gold-plus')}
                className={`rounded-lg border-2 py-6 text-center transition-all cursor-pointer ${
                  parkingPass === 'gold-plus'
                    ? 'border-amber-400 bg-linear-to-br from-yellow-500 to-amber-600 text-white shadow-md'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="text-lg font-bold block">Gold Plus</span>
              </button>
              <button
                onClick={() => setParkingPass('gold')}
                className={`rounded-lg border-2 py-6 text-center transition-all cursor-pointer ${
                  parkingPass === 'gold'
                    ? 'border-yellow-400 bg-linear-to-br from-yellow-400 to-yellow-600 text-white shadow-md'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="text-lg font-bold block">Gold</span>
              </button>
              <button
                onClick={() => setParkingPass('blue')}
                className={`rounded-lg border-2 py-6 text-center transition-all cursor-pointer ${
                  parkingPass === 'blue'
                    ? 'border-blue-400 bg-linear-to-br from-blue-500 to-blue-700 text-white shadow-md'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="text-lg font-bold block">Blue</span>
              </button>
            </div>

            <Button
              variant="link"
              size="sm"
              className="text-primary px-0 h-auto"
              onClick={() => window.open('https://transportation.ucr.edu/undergrad/undergrad-commuter', '_blank')}
            >
              View UCR permit details <ExternalLink className="size-3 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Optimization Preferences */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-blue-50 rounded-full p-3">
                <SlidersHorizontal className="size-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg leading-tight">Optimization Preferences</h2>
                <p className="text-muted-foreground text-sm">Fine-tune how we recommend parking spots</p>
              </div>
            </div>

            {/* Arrival Buffer */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm text-gray-700 font-semibold">Arrival Buffer</Label>
                <span className="text-sm font-bold text-primary tabular-nums">{arrivalBuffer} min</span>
              </div>
              <Slider value={[arrivalBuffer]} onValueChange={([v]) => setArrivalBuffer(v)} max={30} step={5} />
              <div className="flex justify-between mt-2 px-1 text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                <span>0 min</span>
                <span>30 min</span>
              </div>
            </div>

            {/* Walking Speed */}
            <div>
              <Label className="text-sm text-gray-700 font-semibold mb-3 block">Walking Speed</Label>
              <div className="grid grid-cols-3 gap-3">
                {WALKING_SPEEDS.map((speed) => (
                  <button
                    key={speed.value}
                    onClick={() => setWalkingSpeed(speed.value)}
                    className={`rounded-lg border-2 py-4 px-3 text-center transition-all cursor-pointer ${
                      walkingSpeed === speed.value
                        ? 'border-primary bg-blue-50 text-primary shadow-sm'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="block text-base font-bold">{speed.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logout and Save */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-4 pt-2">
          <Button variant="ghost" onClick={handleLogout} className="text-red-600 hover:bg-red-50 w-full sm:w-auto">
            <LogOut className="size-4 mr-2" /> Logout
          </Button>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isDirty && (
              <Button variant="outline" onClick={handleDiscardChanges} className="flex-1 sm:flex-initial">
                Discard
              </Button>
            )}
            <Button
              onClick={handleSaveChanges}
              disabled={!isDirty || isSaving}
              className="bg-primary hover:bg-ucr-blue-dark sm:px-8 flex-1 sm:flex-initial disabled:opacity-50"
            >
              {isSaving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-red-50 rounded-full p-3">
                <Trash2 className="size-5 text-red-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg leading-tight">Danger Zone</h2>
                <p className="text-muted-foreground text-sm">Permanently delete your account and all data</p>
              </div>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              className="w-full sm:w-auto"
            >
              <Trash2 className="size-4 mr-2" /> Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Navigation guard dialog */}
      <AlertDialog open={blocker.state === 'blocked'}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes that will be lost if you leave this page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => blocker.reset?.()}>
              Stay
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => blocker.proceed?.()}
              className="bg-red-500 hover:bg-red-600"
            >
              Discard & Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete account confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              This action is permanent and cannot be undone. Your account, schedule, and all
              associated data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Deleting…" : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
