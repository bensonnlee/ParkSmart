import { Navigate } from 'react-router';

export default function RedirectToSchedule() {
  return <Navigate to="/dashboard/schedule" replace />;
}
