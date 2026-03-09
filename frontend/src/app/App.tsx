import { RouterProvider } from 'react-router';
import { router } from '@/app/routes';
import { Toaster } from '@/app/components/ui/sonner';
import { Analytics } from '@vercel/analytics/react';

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
      <Analytics />
    </>
  );
}
