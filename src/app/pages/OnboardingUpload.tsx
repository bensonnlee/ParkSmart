import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Upload, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function OnboardingUpload() {
  const navigate = useNavigate();
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      toast.success(`Schedule uploaded: ${file.name}`);
    }
  };

  const handleNext = () => {
    if (fileName) {
      navigate('/onboarding/parking-pass');
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
        {/* Header */}
        <div className="text-right mb-4">
          <button
            onClick={() => navigate('/welcome')}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            <HelpCircle className="size-4 inline mr-1" />
            Help
          </button>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">STEP 1 OF 2</span>
            <span className="text-sm text-gray-500">Next: Preferences</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: '50%' }} />
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Let's find your perfect spot
            </h1>
            <p className="text-gray-600 mb-8">
              We'll match your classes to the nearest parking lots. Upload your class schedule (.ics file) to see recommendations near your buildings.
            </p>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-green-500 hover:bg-green-50/50 transition-colors cursor-pointer">
              <label htmlFor="file-input" className="cursor-pointer">
                <div className="flex justify-center mb-4">
                  <div className="bg-green-100 rounded-full p-4">
                    <Upload className="size-8 text-green-600" />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {fileName || 'Upload your .ics file'}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Drag & drop your file here, or click to browse<br />
                  Max size 5MB
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="pointer-events-none"
                >
                  Select File
                </Button>
                <input
                  id="file-input"
                  type="file"
                  accept=".ics,.pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-8">
              <button
                onClick={handleSkip}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Skip for now
              </button>
              <Button
                onClick={handleNext}
                className="bg-green-500 hover:bg-green-600 px-8"
                size="lg"
              >
                Next
                <span className="ml-2">→</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
