import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar className="fixed h-full" />
      <div className="flex-1 flex flex-col ml-64">
        <Header className="fixed top-0 right-0 left-64 z-10" />
        <main className="flex-1 p-6 bg-gray-50 mt-16 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;