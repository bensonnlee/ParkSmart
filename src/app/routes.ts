import { createBrowserRouter } from 'react-router';
import Layout from '@/app/pages/Layout';
import Home from '@/app/pages/Home';
import ParkingRecommendations from '@/app/pages/ParkingRecommendations';
import Settings from '@/app/pages/Settings';
import SignIn from '@/app/pages/SignIn';
import IcsUpload from '@/app/pages/IcsUpload';
import SchedulePlanner from '@/app/pages/SchedulePlanner';
import NotFound from '@/app/pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
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
]);