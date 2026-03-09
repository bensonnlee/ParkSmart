import { createBrowserRouter, redirect } from 'react-router';
import Layout from '@/app/pages/Layout';
import Welcome from '@/app/pages/Welcome';
import Home from '@/app/pages/Home';
import ParkingRecommendations from '@/app/pages/ParkingRecommendations';
import Settings from '@/app/pages/Settings';
import IcsUpload from '@/app/pages/IcsUpload';
import SchedulePlanner from '@/app/pages/SchedulePlanner';
import NotFound from '@/app/pages/NotFound';
import RedirectToSchedule from '@/app/pages/RedirectToSchedule';
import SignUp from '@/app/pages/SignUp';
import ChangePassword from '@/app/pages/ChangePassword';
import FindByBuilding from '@/app/pages/FindByBuilding';
import Feedback from '@/app/pages/Feedback';


export const router = createBrowserRouter([
  {
    path: '/',
    Component: Welcome,
  },
  {
    path: '/welcome',
    Component: Welcome,
  },
  {
    path: '/signup',
    Component: SignUp,
  },
  {
    path: '/schedule',
    Component: RedirectToSchedule,
  },
  {
    path: '/onboarding/upload',
    loader: () => redirect('/signup'),
  },
  {
    path: '/onboarding/parking-pass',
    loader: () => redirect('/signup'),
  },
  {
    path: '/dashboard',
    Component: Layout,
    children: [
      {
        index: true,
        Component: Home,
      },
      {
        path: 'parking/:classId',
        Component: ParkingRecommendations,
      },
      {
        path: 'settings',
        Component: Settings,
      },
      {
        path: 'change-password',
        Component: ChangePassword,
      },
      {
        path: 'schedule',
        Component: SchedulePlanner,
      },
      {
        path: 'find-by-building',
        Component: FindByBuilding,
      },
      {
        path: 'feedback',
        Component: Feedback,
      },
      {
        path: 'upload',
        Component: IcsUpload,
      },
      {
        path: '*',
        Component: NotFound,
      },
    ],
  },
  {
    path: '*',
    Component: NotFound,
  },
]);