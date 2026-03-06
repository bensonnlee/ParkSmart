import { motion } from 'motion/react';
import { Car } from 'lucide-react';

interface StepSetupLoadingProps {
  displayName: string;
}

const fadeSlide = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: 'easeOut' as const },
});

export default function StepSetupLoading({ displayName }: StepSetupLoadingProps) {
  return (
    <div className="min-h-[360px] flex flex-col items-center justify-center gap-4 py-8">
      <motion.div
        className="bg-primary rounded-2xl p-4 text-white"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <Car className="w-8 h-8" />
      </motion.div>

      <motion.p
        className="text-sm font-semibold text-primary uppercase tracking-wide"
        {...fadeSlide(0.2)}
      >
        ParkSmart
      </motion.p>

      <motion.h2
        className="text-2xl font-bold text-gray-900"
        {...fadeSlide(0.3)}
      >
        Welcome, {displayName}!
      </motion.h2>

      <motion.p
        className="text-muted-foreground"
        {...fadeSlide(0.4)}
      >
        We're getting everything ready for you...
      </motion.p>

      <motion.div
        className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden mt-2"
        {...fadeSlide(0.5)}
      >
        <motion.div
          className="w-1/3 h-full bg-primary rounded-full"
          animate={{ x: [0, 128, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </div>
  );
}
