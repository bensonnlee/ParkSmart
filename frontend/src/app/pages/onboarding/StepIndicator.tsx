import { motion } from 'motion/react';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export default function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isCompleted = step < currentStep;
        const isCurrent = step === currentStep;

        return (
          <div key={step} className="flex items-center">
            {/* Step circle */}
            <motion.div
              className={`relative flex items-center justify-center size-9 rounded-full border-2 text-sm font-bold transition-colors ${
                isCompleted
                  ? 'border-primary bg-primary text-white'
                  : isCurrent
                    ? 'border-primary bg-blue-50 text-primary'
                    : 'border-gray-300 bg-white text-gray-400'
              }`}
              initial={false}
              animate={{ scale: isCurrent ? 1.1 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {isCompleted ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  <Check className="size-4" />
                </motion.div>
              ) : (
                step
              )}
            </motion.div>

            {/* Connector line */}
            {step < totalSteps && (
              <div className="w-12 h-0.5 mx-1">
                <div
                  className={`h-full transition-colors duration-300 ${
                    isCompleted ? 'bg-primary' : 'bg-gray-200'
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
