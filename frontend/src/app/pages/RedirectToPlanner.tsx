import { Navigate } from 'react-router';

export default function RedirectToPlanner() {
  return <Navigate to="/dashboard/planner" replace />;
}
