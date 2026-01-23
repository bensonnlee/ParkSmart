import { createBrowserRouter } from 'react-router';
import Layout from '@/app/pages/Layout';
import Home from '@/app/pages/Home';
import SignIn from '@/app/pages/SignIn';
import IcsUpload from '@/app/pages/IcsUpload';
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
