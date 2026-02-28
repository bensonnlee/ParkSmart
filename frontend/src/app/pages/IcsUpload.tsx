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
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage({ type: 'error', text: 'Session expired. Redirecting...' });
      setTimeout(() => navigate('/welcome'), 2000);
      return;
    }
  
    setIsLoading(true);
    setMessage(null);
  
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const form = new FormData();
      form.append("file", selectedFile!); 
  
      const res = await fetch(`${baseUrl}/api/schedules/upload`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: form,
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        // Auto-clear logic for invalid tokens
        if (res.status === 401 || data.detail === "Invalid authentication token") {
          localStorage.clear(); 

          setMessage({ 
            type: 'error', 
            text: 'Invalid session. Clearing cache and redirecting to login...' 
          });
          
          setTimeout(() => {
            navigate('/welcome');
            window.location.reload(); // Refreshes the page to clear any remaining app state
          }, 2000);
          return;
        }

        throw new Error(data.detail || 'Upload failed');
      }
  
      setMessage({ type: 'success', text: "Schedule updated! Redirecting..." });
      setTimeout(() => navigate('/dashboard'), 1500);
  
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Network error.' });
    } finally {
      setIsLoading(false);
    }
  };

  // handleDrop remains the same - it just prepares the file for handleUpload
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
            Import your class schedule for current quarter to receive parking recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
                    .ics calendar file from R'Web or Google Calendar
                  </p>
                </div>
              </div>
            </label>
          </div>

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
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="border-ucr-blue text-ucr-blue hover:bg-ucr-blue/10 font-semibold"
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}