import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { Upload, ChevronLeft, FileText, PenLine, X } from 'lucide-react';
import { toast } from 'sonner';
import ClassEventDialog, { formatTimeLabel } from '@/app/components/ClassEventDialog';
import type { ManualEventData } from '@/api/schedule';

interface StepScheduleUploadProps {
  file: File | null;
  setFile: (f: File | null) => void;
  onFinish: () => void;
  onSkip: () => void;
  onBack: () => void;
  onAddManualClass: (data: ManualEventData) => void;
  onRemoveManualClass: (index: number) => void;
  pendingEvents: ManualEventData[];
}

const DAY_ABBREVS = ['M', 'T', 'W', 'Th', 'F', 'Sa', 'Su'];

export default function StepScheduleUpload({
  file,
  setFile,
  onFinish,
  onSkip,
  onBack,
  onAddManualClass,
  onRemoveManualClass,
  pendingEvents,
}: StepScheduleUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [manualDialogOpen, setManualDialogOpen] = useState(false);

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

  const hasContent = file || pendingEvents.length > 0;

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
        className={`border-2 border-dashed rounded-xl p-6 sm:p-10 text-center transition-colors cursor-pointer ${
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

      <button
        type="button"
        onClick={() => setManualDialogOpen(true)}
        className="flex items-center justify-center gap-1.5 text-sm font-medium text-ucr-blue hover:text-ucr-blue-dark transition-colors mx-auto"
      >
        <PenLine className="size-3.5" />
        Or add classes manually
      </button>

      <ClassEventDialog
        open={manualDialogOpen}
        onOpenChange={setManualDialogOpen}
        mode="add"
        onSubmitOverride={onAddManualClass}
      />

      {/* Pending manual classes */}
      <AnimatePresence>
        {pendingEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Classes to add ({pendingEvents.length})
            </p>
            <div className="space-y-2">
              <AnimatePresence>
                {pendingEvents.map((evt, i) => (
                  <motion.div
                    key={`${evt.event_name}-${evt.start_time}-${evt.days_of_week.join(',')}`}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.2 }}
                    className="group flex items-center gap-3 p-3 border border-gray-100 rounded-2xl
                               bg-white hover:border-ucr-blue/20 hover:shadow-sm transition-all"
                  >
                    {/* Day badges */}
                    <div className="shrink-0 flex gap-0.5">
                      {evt.days_of_week.map(d => (
                        <span
                          key={d}
                          className="inline-flex items-center justify-center size-6 rounded-full
                                     bg-ucr-blue/10 text-ucr-blue text-[10px] font-bold"
                        >
                          {DAY_ABBREVS[d]}
                        </span>
                      ))}
                    </div>

                    {/* Class info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {evt.event_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatTimeLabel(evt.start_time.slice(0, 5))} – {formatTimeLabel(evt.end_time.slice(0, 5))}
                      </p>
                    </div>

                    {/* Remove button — appears on hover */}
                    <button
                      onClick={() => onRemoveManualClass(i)}
                      className="shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity
                                 p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                    >
                      <X className="size-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onBack} className="text-sm text-muted-foreground">
          <ChevronLeft className="size-4 mr-1" /> Back
        </Button>
        <div className="flex-1 flex gap-2 sm:gap-3">
          {!hasContent && (
            <Button
              type="button"
              variant="outline"
              className="flex-1 text-sm"
              onClick={onSkip}
            >
              Skip for now
            </Button>
          )}
          <Button
            type="button"
            className="flex-1 text-sm bg-primary hover:bg-ucr-blue-dark"
            onClick={hasContent ? onFinish : onSkip}
          >
            {file ? 'Upload & Finish' : 'Finish Setup'}
          </Button>
        </div>
      </div>
    </div>
  );
}
