import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import LocationPicker from '../customer/LocationPicker.jsx';

export default function CustomerLayout() {
  const { pathname } = useLocation();

  // Every route change should start at the top — otherwise deep-linking into a
  // product from halfway down a listing lands you halfway down the product.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <LocationPicker />
    </div>
  );
}
