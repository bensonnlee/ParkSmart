import { useState, useRef } from 'react';
import { Button } from '@/app/components/ui/button';
import { Upload, ChevronLeft, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface StepScheduleUploadProps {
  file: File | null;
  setFile: (f: File | null) => void;
  onFinish: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export default function StepScheduleUpload({
  file,
  setFile,
  onFinish,
  onSkip,
  onBack,
}: StepScheduleUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.ics')) {
      toast.error('Only .ics files are supported');
      return;
    }
    setFile(f);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Upload Your Schedule</h1>
        <p className="text-muted-foreground mt-1">
          Import your class schedule so we can recommend parking near your buildings
        </p>
      </div>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
          isDragOver
            ? 'border-primary bg-blue-50'
            : file
              ? 'border-green-400 bg-green-50'
              : 'border-gray-300 hover:border-primary hover:bg-blue-50/50'
        }`}
      >
        <div className="flex justify-center mb-4">
          <div className={`rounded-full p-4 ${file ? 'bg-green-100' : 'bg-blue-100'}`}>
            {file ? (
              <FileText className="size-8 text-green-600" />
            ) : (
              <Upload className="size-8 text-primary" />
            )}
          </div>
        </div>
        <h3 className="font-semibold text-gray-900 mb-1">
          {file?.name || 'Drop your .ics file here'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {file ? 'Click to choose a different file' : 'or click to browse'}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".ics"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Export your schedule as .ics from R'Web or Google Calendar
      </p>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onBack} className="text-muted-foreground">
          <ChevronLeft className="size-4 mr-1" /> Back
        </Button>
        <div className="flex-1 flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onSkip}
          >
            Skip for now
          </Button>
          <Button
            type="button"
            className="flex-1 bg-primary hover:bg-ucr-blue-dark"
            onClick={file ? onFinish : onSkip}
          >
            {file ? 'Upload & Finish' : 'Finish Setup'}
          </Button>
        </div>
      </div>
    </div>
  );
}
