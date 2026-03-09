import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { PageHeader } from '@/app/components/PageHeader';
import { Bug, Lightbulb, Target, MessageSquare, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { authenticatedFetch } from '@/api/authenticatedFetch';
import { API_BASE } from '@/api/config';

const CATEGORIES = [
  { value: 'bug', label: 'Bug Report', icon: Bug },
  { value: 'feature', label: 'Feature Request', icon: Lightbulb },
  { value: 'accuracy', label: 'Parking Accuracy Issue', icon: Target },
  { value: 'general', label: 'General Feedback', icon: MessageSquare },
] as const;

export default function Feedback() {
  const navigate = useNavigate();

  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Auto-redirect after success
  useEffect(() => {
    if (!isSuccess) return;
    const timer = setTimeout(() => navigate('/dashboard'), 3000);
    return () => clearTimeout(timer);
  }, [isSuccess, navigate]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!category) newErrors.category = 'Please select a category';
    if (message.length < 10) newErrors.message = 'Message must be at least 10 characters';
    if (message.length > 2000) newErrors.message = 'Message must be under 2000 characters';
    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await authenticatedFetch(`${API_BASE}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          message,
          contact_email: contactEmail || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || 'Failed to submit feedback');
      }

      setIsSuccess(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="text-center px-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
          >
            <CheckCircle2 className="size-20 text-green-500 mx-auto mb-6" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank you!</h2>
          <p className="text-gray-500 mb-8 max-w-xs mx-auto">
            Your feedback helps us make ParkSmart better for everyone at UCR.
          </p>
          <Button
            onClick={() => navigate('/dashboard')}
            className="bg-ucr-blue hover:bg-ucr-blue-dark px-8"
          >
            Back to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Send Feedback"
        subtitle="Help us improve ParkSmart during beta"
      />

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <p className="text-sm text-gray-600">
                We're in beta
                and your feedback is invaluable. Let us know about bugs, features you'd love, or anything else on your mind.
              </p>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Category</Label>
              <Select value={category} onValueChange={(val) => { setCategory(val); setErrors(prev => ({ ...prev, category: '' })); }}>
                <SelectTrigger className={errors.category ? 'border-red-400' : ''}>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <SelectItem key={cat.value} value={cat.value}>
                        <span className="flex items-center gap-2">
                          <Icon className="size-4" />
                          {cat.label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Message</Label>
              <Textarea
                placeholder="Describe your feedback in detail..."
                className={`min-h-[120px] ${errors.message ? 'border-red-400' : ''}`}
                value={message}
                onChange={(e) => { setMessage(e.target.value); setErrors(prev => ({ ...prev, message: '' })); }}
                maxLength={2000}
              />
              <div className="flex justify-between items-center">
                {errors.message ? (
                  <p className="text-xs text-red-500">{errors.message}</p>
                ) : (
                  <span />
                )}
                <p className={`text-xs ${message.length > 1900 ? 'text-amber-500' : 'text-gray-400'}`}>
                  {message.length}/2000
                </p>
              </div>
            </div>

            {/* Contact Email */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                Contact Email <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={contactEmail}
                onChange={(e) => { setContactEmail(e.target.value); setErrors(prev => ({ ...prev, contactEmail: '' })); }}
                className={errors.contactEmail ? 'border-red-400' : ''}
              />
              {errors.contactEmail && <p className="text-xs text-red-500">{errors.contactEmail}</p>}
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-ucr-blue hover:bg-ucr-blue-dark py-6 text-md font-bold rounded-xl"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
