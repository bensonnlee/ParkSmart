import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { API_BASE } from '@/api/config';
import { setTokens, getAccessToken } from '@/api/tokenStorage';
import { authenticatedFetch } from '@/api/authenticatedFetch';
import { invalidateCache } from '@/api/apiCache';
import { addScheduleEvent } from '@/api/schedule';
import type { ManualEventData } from '@/api/schedule';
import { DEFAULT_PREFS } from '@/lib/prefs';
import type { PermitSlug } from '@/lib/prefs';
import StepIndicator from './onboarding/StepIndicator';
import StepAccountCreate from './onboarding/StepAccountCreate';
import StepPreferences from './onboarding/StepPreferences';
import StepScheduleUpload from './onboarding/StepScheduleUpload';
import StepSetupLoading from './onboarding/StepSetupLoading';

export default function SignUp() {
  const navigate = useNavigate();

  // Step state
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const hasAnimated = useRef(false);

  // Step 1 fields
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2 fields
  const [parkingPass, setParkingPass] = useState<PermitSlug>(DEFAULT_PREFS.parkingPass);
  const [arrivalBuffer, setArrivalBuffer] = useState(DEFAULT_PREFS.arrivalBuffer);
  const [walkingSpeed, setWalkingSpeed] = useState(DEFAULT_PREFS.walkingSpeed);

  // Step 3 fields
  const [file, setFile] = useState<File | null>(null);
  const [pendingEvents, setPendingEvents] = useState<ManualEventData[]>([]);

  // Global
  const [error, setError] = useState('');

  // Redirect already-logged-in users straight to dashboard
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const stepRef = useRef(step);
  stepRef.current = step;

  const goToStep = useCallback((next: number) => {
    setError('');
    hasAnimated.current = true;
    setDirection(next > stepRef.current ? 1 : -1);
    setStep(next);
  }, []);

  // Step 1 → 2: Validate fields only (account created at end)
  const handleAccountInfoSubmit = () => {
    setError('');
    if (!displayName || !email || !password || !confirmPassword) {
      setError('Please fill out all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    goToStep(2);
  };

  // Step 2 → 3: Just advance (preferences saved at end with account)
  const handlePreferencesSubmit = () => {
    goToStep(3);
  };

  const handleAddManualClass = useCallback((data: ManualEventData) => {
    setPendingEvents(prev => [...prev, data]);
  }, []);

  const handleRemoveManualClass = useCallback((index: number) => {
    setPendingEvents(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Finish onboarding: show loading screen → signup → save preferences → upload schedule → navigate
  const finishOnboarding = async (skipUpload: boolean) => {
    if (stepRef.current === 4) return;
    goToStep(4);
    const minDisplayTime = new Promise(resolve => setTimeout(resolve, 1500));

    try {
      // 1. Create account
      const signupRes = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, display_name: displayName }),
      });
      const signupData = await signupRes.json().catch(() => ({}));
      if (!signupRes.ok) {
        goToStep(1);
        setError(signupData.detail || 'Signup failed. Please try again.');
        return;
      }

      // 2. Store tokens
      const tokens = signupData.tokens ?? signupData;
      const access = tokens.access_token ?? signupData.access_token ?? signupData.token;
      const refresh = tokens.refresh_token ?? signupData.refresh_token ?? '';
      if (access) setTokens(access, refresh);

      const user = signupData.user ?? signupData;
      const uid = user.id || user.user_id || user.supabase_id;

      // 3. Save preferences + upload schedule in parallel (both only need auth token)
      const prefsPromise = authenticatedFetch(`${API_BASE}/api/auth/me/preferences`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parking_pass: parkingPass,
          arrival_buffer: arrivalBuffer,
          walking_speed: walkingSpeed,
        }),
      });

      const uploadPromise = (!skipUpload && file)
        ? (async () => {
            const formData = new FormData();
            formData.append('file', file);
            return authenticatedFetch(`${API_BASE}/api/schedules/upload`, {
              method: 'POST',
              body: formData,
            });
          })()
        : null;

      const eventsPromise = pendingEvents.length > 0
        ? Promise.allSettled(pendingEvents.map(evt => addScheduleEvent(evt)))
        : null;

      const [prefsRes, uploadRes, eventsResults] = await Promise.all([prefsPromise, uploadPromise, eventsPromise]);

      // Handle preferences result
      if (prefsRes.ok) {
        const prefsData = await prefsRes.json();
        const updated = {
          ...user,
          arrival_buffer: prefsData.arrival_buffer,
          walking_speed: prefsData.walking_speed,
          preferred_permit_id: prefsData.preferred_permit_id,
          parking_pass_slug: parkingPass,
        };
        localStorage.setItem('user', JSON.stringify(updated));

        const prefsKey = uid ? `prefs:${uid}` : 'prefs:guest';
        localStorage.setItem(prefsKey, JSON.stringify({
          parkingPass,
          arrivalBuffer,
          walkingSpeed,
          preferredPermitId: prefsData.preferred_permit_id ?? null,
        }));
      } else {
        localStorage.setItem('user', JSON.stringify(user));
        toast.warning('Could not save preferences — you can update them in Settings.');
      }

      // Handle upload result
      if (uploadRes) {
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          localStorage.setItem(`schedule:${uid || 'guest'}`, JSON.stringify(uploadData));
          invalidateCache('/api/schedules');
        } else {
          toast.warning('Schedule upload failed, but you can upload later.');
        }
      }

      // Handle manual class events result
      if (eventsResults) {
        const failed = eventsResults.filter(r => r.status === 'rejected').length;
        if (failed > 0) {
          toast.warning(`${failed} class(es) couldn't be saved — you can add them later.`);
        } else {
          invalidateCache('/api/schedules');
        }
      }

      // 4. Wait for minimum display time, then navigate
      await minDisplayTime;
      window.dispatchEvent(new Event('authChange'));
      navigate('/dashboard', { replace: true });
    } catch {
      goToStep(1);
      setError('Connection error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-white">
      <div className="w-full max-w-md">
        {step < 4 && <StepIndicator currentStep={step} totalSteps={3} />}

        <div className={`overflow-hidden ${step < 4 ? 'border rounded-2xl p-4 sm:p-6 shadow-sm' : 'p-4 sm:p-6'}`}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={`step-${step}`}
              custom={direction}
              initial={hasAnimated.current ? { x: direction * 200, opacity: 0 } : false}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction * -200, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {step === 1 && (
                <StepAccountCreate
                  displayName={displayName}
                  setDisplayName={setDisplayName}
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                  confirmPassword={confirmPassword}
                  setConfirmPassword={setConfirmPassword}
                  onSubmit={handleAccountInfoSubmit}
                  error={error}
                />
              )}
              {step === 2 && (
                <StepPreferences
                  parkingPass={parkingPass}
                  setParkingPass={setParkingPass}
                  arrivalBuffer={arrivalBuffer}
                  setArrivalBuffer={setArrivalBuffer}
                  walkingSpeed={walkingSpeed}
                  setWalkingSpeed={setWalkingSpeed}
                  onSubmit={handlePreferencesSubmit}
                  onBack={() => goToStep(1)}
                />
              )}
              {step === 3 && (
                <StepScheduleUpload
                  file={file}
                  setFile={setFile}
                  onFinish={() => finishOnboarding(false)}
                  onSkip={() => finishOnboarding(true)}
                  onBack={() => goToStep(2)}
                  onAddManualClass={handleAddManualClass}
                  onRemoveManualClass={handleRemoveManualClass}
                  pendingEvents={pendingEvents}
                />
              )}
              {step === 4 && (
                <StepSetupLoading displayName={displayName} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
