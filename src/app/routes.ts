import { createBrowserRouter } from 'react-router';
import Layout from '@/app/pages/Layout';
import Welcome from '@/app/pages/Welcome';
import OnboardingUpload from '@/app/pages/OnboardingUpload';
import OnboardingParkingPass from '@/app/pages/OnboardingParkingPass';
import Home from '@/app/pages/Home';
import ParkingRecommendations from '@/app/pages/ParkingRecommendations';
import MapView from '@/app/pages/MapView';
import Settings from '@/app/pages/Settings';
import SignIn from '@/app/pages/SignIn';
import IcsUpload from '@/app/pages/IcsUpload';
import SchedulePlanner from '@/app/pages/SchedulePlanner';
import NotFound from '@/app/pages/NotFound';
import RedirectToPlanner from '@/app/pages/RedirectToPlanner';

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
    path: '/planner',
    Component: RedirectToPlanner,
  },
  {
    path: '/onboarding/upload',
    Component: OnboardingUpload,
  },
  {
    path: '/onboarding/parking-pass',
    Component: OnboardingParkingPass,
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
        path: 'map',
        Component: MapView,
      },
      {
        path: 'settings',
        Component: Settings,
      },
      {
        path: 'planner',
        Component: SchedulePlanner,
      },
      {
        path: 'sign-in',
        Component: SignIn,
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