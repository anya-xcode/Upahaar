import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import CustomerLayout from './components/layout/CustomerLayout.jsx';
import Toaster from './components/common/Toaster.jsx';
import { RequireRole, RedirectIfAuthed, Booting } from './components/common/RouteGuards.jsx';

import { useAuth } from './store/authStore.js';
import { useShop } from './store/shopStore.js';
import { useLocation as useLocationStore } from './store/locationStore.js';

/* --- Storefront (eager: this is the first paint for most visitors) --- */
import Home from './pages/customer/Home.jsx';
import Gifts from './pages/customer/Gifts.jsx';
import ProductDetail from './pages/customer/ProductDetail.jsx';
import Cart from './pages/customer/Cart.jsx';

/* --- Everything else splits out of the initial bundle --- */
const Occasions = lazy(() => import('./pages/customer/Occasions.jsx'));
const Sellers = lazy(() => import('./pages/customer/Sellers.jsx'));
const SellerStore = lazy(() => import('./pages/customer/SellerStore.jsx'));
const Checkout = lazy(() => import('./pages/customer/Checkout.jsx'));
const OrderConfirmation = lazy(() => import('./pages/customer/OrderConfirmation.jsx'));
const GiftGuides = lazy(() => import('./pages/customer/GiftGuides.jsx'));
const GiftGuidePost = lazy(() => import('./pages/customer/GiftGuidePost.jsx'));
const Faq = lazy(() => import('./pages/customer/Faq.jsx'));
const HowItWorks = lazy(() => import('./pages/customer/HowItWorks.jsx'));
const DeliveryAreas = lazy(() => import('./pages/customer/DeliveryAreas.jsx'));
const SellWithUs = lazy(() => import('./pages/customer/SellWithUs.jsx'));
const NotFound = lazy(() => import('./pages/customer/NotFound.jsx'));

const AccountLayout = lazy(() => import('./pages/customer/account/AccountLayout.jsx'));
const AccountHome = lazy(() => import('./pages/customer/account/AccountHome.jsx'));
const AccountOrders = lazy(() => import('./pages/customer/account/Orders.jsx'));
const AccountOrderDetail = lazy(() => import('./pages/customer/account/OrderDetail.jsx'));
const Addresses = lazy(() => import('./pages/customer/account/Addresses.jsx'));
const Wishlist = lazy(() => import('./pages/customer/account/Wishlist.jsx'));
const Reminders = lazy(() => import('./pages/customer/account/Reminders.jsx'));
const AccountCoupons = lazy(() => import('./pages/customer/account/Coupons.jsx'));
const Payments = lazy(() => import('./pages/customer/account/Payments.jsx'));
const AccountReviews = lazy(() => import('./pages/customer/account/Reviews.jsx'));
const Notifications = lazy(() => import('./pages/customer/account/Notifications.jsx'));
const Profile = lazy(() => import('./pages/customer/account/Profile.jsx'));

const Login = lazy(() => import('./pages/auth/Login.jsx'));
const Signup = lazy(() => import('./pages/auth/Signup.jsx'));
const SellerLogin = lazy(() => import('./pages/auth/SellerLogin.jsx'));
const SellerSignup = lazy(() => import('./pages/auth/SellerSignup.jsx'));
const AdminLogin = lazy(() => import('./pages/auth/AdminLogin.jsx'));

const SellerLayout = lazy(() => import('./pages/seller/SellerLayout.jsx'));
const SellerDashboard = lazy(() => import('./pages/seller/Dashboard.jsx'));
const SellerProducts = lazy(() => import('./pages/seller/Products.jsx'));
const SellerProductForm = lazy(() => import('./pages/seller/ProductForm.jsx'));
const SellerOrders = lazy(() => import('./pages/seller/Orders.jsx'));
const SellerOrderDetail = lazy(() => import('./pages/seller/OrderDetail.jsx'));
const SellerInventory = lazy(() => import('./pages/seller/Inventory.jsx'));
const SellerReviews = lazy(() => import('./pages/seller/Reviews.jsx'));
const SellerPayouts = lazy(() => import('./pages/seller/Payouts.jsx'));
const SellerProfile = lazy(() => import('./pages/seller/Profile.jsx'));

const AdminLayout = lazy(() => import('./pages/admin/AdminLayout.jsx'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard.jsx'));
const AdminAnalytics = lazy(() => import('./pages/admin/Analytics.jsx'));
const AdminSellers = lazy(() => import('./pages/admin/Sellers.jsx'));
const AdminSellerDetail = lazy(() => import('./pages/admin/SellerDetail.jsx'));
const AdminUsers = lazy(() => import('./pages/admin/Users.jsx'));
const AdminOrders = lazy(() => import('./pages/admin/Orders.jsx'));
const AdminOrderDetail = lazy(() => import('./pages/admin/OrderDetail.jsx'));
const AdminProducts = lazy(() => import('./pages/admin/Products.jsx'));
const AdminReviews = lazy(() => import('./pages/admin/Reviews.jsx'));
const AdminPincodes = lazy(() => import('./pages/admin/Pincodes.jsx'));
const AdminCoupons = lazy(() => import('./pages/admin/Coupons.jsx'));
const AdminCms = lazy(() => import('./pages/admin/Cms.jsx'));
const AdminPayouts = lazy(() => import('./pages/admin/Payouts.jsx'));

export default function App() {
  const bootstrap = useAuth((s) => s.bootstrap);
  const user = useAuth((s) => s.user);
  const authLoading = useAuth((s) => s.loading);
  const { loadCart, loadWishlist } = useShop();
  const refreshLocation = useLocationStore((s) => s.refresh);

  useEffect(() => {
    bootstrap();
    refreshLocation();
  }, [bootstrap, refreshLocation]);

  // Cart and wishlist follow the session — load once auth settles, clear on logout.
  useEffect(() => {
    if (authLoading) return;
    loadCart();
    loadWishlist();
  }, [user?.id, authLoading, loadCart, loadWishlist]);

  return (
    <>
      <Suspense fallback={<Booting />}>
        <Routes>
          {/* ---------------------------- Storefront ---------------------------- */}
          <Route element={<CustomerLayout />}>
            <Route index element={<Home />} />
            <Route path="gifts" element={<Gifts />} />
            <Route path="gift/:slug" element={<ProductDetail />} />
            <Route path="occasions" element={<Occasions />} />
            <Route path="sellers" element={<Sellers />} />
            <Route path="store/:slug" element={<SellerStore />} />
            <Route path="cart" element={<Cart />} />
            <Route path="gift-guides" element={<GiftGuides />} />
            <Route path="gift-guides/:slug" element={<GiftGuidePost />} />
            <Route path="faq" element={<Faq />} />
            <Route path="how-it-works" element={<HowItWorks />} />
            <Route path="delivery-areas" element={<DeliveryAreas />} />
            <Route path="sell-with-us" element={<SellWithUs />} />

            <Route
              path="checkout"
              element={
                <RequireRole role="CUSTOMER" redirectTo="/login">
                  <Checkout />
                </RequireRole>
              }
            />
            <Route
              path="order/:orderId/confirmation"
              element={
                <RequireRole role="CUSTOMER" redirectTo="/login">
                  <OrderConfirmation />
                </RequireRole>
              }
            />

            <Route
              path="account"
              element={
                <RequireRole role="CUSTOMER" redirectTo="/login">
                  <AccountLayout />
                </RequireRole>
              }
            >
              <Route index element={<AccountHome />} />
              <Route path="orders" element={<AccountOrders />} />
              <Route path="orders/:orderId" element={<AccountOrderDetail />} />
              <Route path="addresses" element={<Addresses />} />
              <Route path="wishlist" element={<Wishlist />} />
              <Route path="reminders" element={<Reminders />} />
              <Route path="coupons" element={<AccountCoupons />} />
              <Route path="payments" element={<Payments />} />
              <Route path="reviews" element={<AccountReviews />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>

          {/* ------------------------------- Auth ------------------------------- */}
          <Route path="/login" element={<RedirectIfAuthed><Login /></RedirectIfAuthed>} />
          <Route path="/signup" element={<RedirectIfAuthed><Signup /></RedirectIfAuthed>} />
          <Route path="/seller/login" element={<RedirectIfAuthed><SellerLogin /></RedirectIfAuthed>} />
          <Route path="/seller/signup" element={<RedirectIfAuthed><SellerSignup /></RedirectIfAuthed>} />
          <Route path="/admin/login" element={<RedirectIfAuthed><AdminLogin /></RedirectIfAuthed>} />

          {/* ---------------------------- Seller panel --------------------------- */}
          <Route
            path="/seller"
            element={
              <RequireRole role="SELLER" redirectTo="/seller/login">
                <SellerLayout />
              </RequireRole>
            }
          >
            <Route index element={<SellerDashboard />} />
            <Route path="products" element={<SellerProducts />} />
            <Route path="products/new" element={<SellerProductForm />} />
            <Route path="products/:id/edit" element={<SellerProductForm />} />
            <Route path="orders" element={<SellerOrders />} />
            <Route path="orders/:orderId" element={<SellerOrderDetail />} />
            <Route path="inventory" element={<SellerInventory />} />
            <Route path="reviews" element={<SellerReviews />} />
            <Route path="payouts" element={<SellerPayouts />} />
            <Route path="profile" element={<SellerProfile />} />
            <Route path="*" element={<Navigate to="/seller" replace />} />
          </Route>

          {/* ---------------------------- Admin panel ---------------------------- */}
          <Route
            path="/admin"
            element={
              <RequireRole role="ADMIN" redirectTo="/admin/login">
                <AdminLayout />
              </RequireRole>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="sellers" element={<AdminSellers />} />
            <Route path="sellers/:id" element={<AdminSellerDetail />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:orderId" element={<AdminOrderDetail />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="pincodes" element={<AdminPincodes />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="cms" element={<AdminCms />} />
            <Route path="payouts" element={<AdminPayouts />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Routes>
      </Suspense>

      <Toaster />
    </>
  );
}
