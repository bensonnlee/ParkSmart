import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Upload, HelpCircle, Loader2 } from 'lucide-react'; // Added Loader2
import { toast } from 'sonner';

export default function OnboardingUpload() {
  const navigate = useNavigate();
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false); // New State

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsUploading(true);

    // Prepare the form data
    const formData = new FormData();
    formData.append('file', file);

    try {
      // 1. Get the current user info for the Token and LocalStorage key
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const token = localStorage.getItem("token");

      // 2. Upload to your backend
      const response = await fetch('https://parksmart-api.onrender.com/api/schedules/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`, // Ensure user is authenticated
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();

      // 3. CRITICAL: Save to localStorage so Home.tsx can see it
      const uid = user?.id || user?.user_id || "guest";
      localStorage.setItem(`schedule:${uid}`, JSON.stringify(data));

      toast.success(`Schedule synced: ${file.name}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to process schedule. Please try again.');
      setFileName('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleNext = () => {
    if (fileName && !isUploading) {
      navigate('/onboarding/parking-pass');
    } else if (isUploading) {
      toast.info('Please wait for the upload to finish');
    } else {
      toast.error('Please upload your schedule first');
    }
  };

  const handleSkip = () => {
    navigate('/onboarding/parking-pass');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar and Header remain same... */}

        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Let's find your perfect spot
            </h1>
            <p className="text-gray-600 mb-8">
              Upload your class schedule (.ics file) to see recommendations near your buildings.
            </p>

            {/* Upload Area */}
            <div className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer 
              ${isUploading ? 'bg-gray-50 border-gray-200' : 'hover:border-green-500 hover:bg-green-50/50 border-gray-300'}`}>
              <label htmlFor="file-input" className={isUploading ? "cursor-not-allowed" : "cursor-pointer"}>
                <div className="flex justify-center mb-4">
                  <div className="bg-green-100 rounded-full p-4">
                    {isUploading ? (
                      <Loader2 className="size-8 text-green-600 animate-spin" />
                    ) : (
                      <Upload className="size-8 text-green-600" />
                    )}
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {isUploading ? 'Processing File...' : (fileName || 'Upload your .ics file')}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  .ics files only (from R'Web or Google Calendar)
                </p>
                <input
                  id="file-input"
                  type="file"
                  accept=".ics"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-8">
              <button onClick={handleSkip} className="text-sm text-gray-600 hover:text-gray-900">
                Skip for now
              </button>
              <Button
                onClick={handleNext}
                disabled={isUploading}
                className="bg-green-500 hover:bg-green-600 px-8"
                size="lg"
              >
                {isUploading ? 'Uploading...' : 'Next'}
                <span className="ml-2">→</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}