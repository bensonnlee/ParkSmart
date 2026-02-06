import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Upload, FileText, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';

export default function IcsUpload() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.ics')) {
        setSelectedFile(file);
        setMessage(null);
      } else {
        setSelectedFile(null);
        setMessage({ type: 'error', text: 'Please select a valid .ics file.' });
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select a file first.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    // Simulate file upload
    setTimeout(() => {
      setMessage({
        type: 'success',
        text: `File "${selectedFile.name}" uploaded successfully! Your schedule has been imported.`
      });
      setIsLoading(false);
      
      // Optionally redirect after successful upload
      setTimeout(() => {
        navigate('/');
      }, 2000);
    }, 1500);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.ics')) {
      setSelectedFile(file);
      setMessage(null);
    } else {
      setMessage({ type: 'error', text: 'Please drop a valid .ics file.' });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-2xl border-2 border-ucr-blue/20 shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="size-16 bg-ucr-gold rounded-full flex items-center justify-center">
              <Calendar className="size-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-center text-ucr-blue">
            Upload Calendar
          </CardTitle>
          <CardDescription className="text-center text-gray-600 px-2 sm:px-4">
            Import your class schedule to receive parking recommendations based on your class times
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-ucr-blue/30 rounded-lg p-6 sm:p-8 text-center hover:border-ucr-blue/60 transition-colors cursor-pointer bg-white"
          >
            <input
              type="file"
              accept=".ics"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              disabled={isLoading}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="flex flex-col items-center space-y-4">
                <div className="size-16 sm:size-20 bg-ucr-blue/10 rounded-full flex items-center justify-center">
                  <Upload className="size-8 sm:size-10 text-ucr-blue" />
                </div>
                <div className="px-4">
                  <p className="text-base sm:text-lg font-semibold text-ucr-blue mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    .ics calendar file (from Google Calendar, Outlook, Apple Calendar, etc.)
                  </p>
                </div>
              </div>
            </label>
          </div>

          {/* Selected File Info */}
          {selectedFile && (
            <Card className="border-ucr-gold/30 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <FileText className="size-8 text-ucr-gold-dark flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ucr-blue truncate">{selectedFile.name}</p>
                    <p className="text-sm text-gray-600">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Feedback Messages */}
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

          {/* Upload Button */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isLoading}
              className="flex-1 bg-ucr-blue hover:bg-ucr-blue-dark text-white font-semibold py-2.5"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin mr-2">⏳</span>
                  Uploading...
                </span>
              ) : (
                <>
                  <Upload className="size-4 mr-2" />
                  Upload Calendar
                </>
              )}
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="border-ucr-blue text-ucr-blue hover:bg-ucr-blue/10 font-semibold"
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>

          {/* Why upload section */}
          <div className="bg-blue-50 border border-ucr-blue/20 rounded-lg p-4">
            <h4 className="font-semibold text-ucr-blue mb-2 text-sm sm:text-base">Why upload your calendar?</h4>
            <p className="text-xs sm:text-sm text-gray-700 mb-3">
              Your uploaded schedule will be associated with your account, allowing us to automatically recommend 
              the best parking lots based on your class times and locations. Only you can access your schedule data.
            </p>
            <h4 className="font-semibold text-ucr-blue mb-2 text-sm sm:text-base">How to get your .ics file:</h4>
            <ul className="text-xs sm:text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li><strong>Google Calendar:</strong> Settings → Export calendar</li>
              <li><strong>Outlook:</strong> File → Save Calendar → iCalendar Format (.ics)</li>
              <li><strong>Apple Calendar:</strong> File → Export → Export</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}