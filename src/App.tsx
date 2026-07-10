import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import AdminLayout from './layouts/AdminLayout'
import SellerLayout from './layouts/SellerLayout'
import UsersPage from './pages/admin/UsersPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import ShopsPage from './pages/admin/ShopsPage'
import RegionsPage from './pages/admin/RegionsPage'
import LocationsPage from './pages/admin/LocationsPage'
import ProductsPage from './pages/admin/ProductsPage'
import ProductFormPage from './pages/admin/ProductFormPage'
import CategoriesPage from './pages/admin/CategoriesPage'
import InventoryPage from './pages/admin/InventoryPage'
import TransfersPage from './pages/admin/TransfersPage'
import TransferFormPage from './pages/admin/TransferFormPage'
import BrandsPage from './pages/admin/BrandsPage'
import BrandDetailPage from './pages/admin/BrandDetailPage'
import ManufacturerBrandsPage from './pages/admin/ManufacturerBrandsPage'
import OrdersPage from './pages/admin/OrdersPage'
import OrderFormPage from './pages/admin/OrderFormPage'
import WithdrawalsPage from './pages/admin/WithdrawalsPage'
import WithdrawalsDetailPage from './pages/admin/WithdrawalsDetailPage'
import BonusesPage from './pages/admin/BonusesPage'
import RequestsPage from './pages/admin/RequestsPage'
import BonusHistoryPage from './pages/admin/BonusHistoryPage'
import DashboardPage from './pages/admin/DashboardPage'
import NotificationsPage from './pages/admin/NotificationsPage'
import NotificationFormPage from './pages/admin/NotificationFormPage'
import InventoryQrPrintPage from './pages/admin/InventoryQrPrintPage'
import BannersPage from './pages/admin/BannersPage'
import BannerFormPage from './pages/admin/BannerFormPage'
import DesignShopsPage from './pages/design/ShopsPage'
import DesignRegionsPage from './pages/design/RegionsPage'
import DesignLocationsPage from './pages/design/LocationsPage'
import DesignProductsPage from './pages/design/ProductsPage'
import DesignProductFormPage from './pages/design/ProductFormPage'
import DesignCategoriesPage from './pages/design/CategoriesPage'
import DesignBrandsPage from './pages/design/BrandsPage'
import DesignManufacturerBrandsPage from './pages/design/ManufacturerBrandsPage'
import DesignOrdersPage from './pages/design/OrdersPage'
import { isAuthenticated } from './api/gateway'

function ProtectedAdmin({ mode = 'front' }: { mode?: 'front' | 'design' }) {
  return isAuthenticated() ? <AdminLayout mode={mode} /> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* Super Admin panel */}
        <Route path="/admin" element={<ProtectedAdmin />}>
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="admin-users" element={<AdminUsersPage />} />
          <Route path="shops" element={<ShopsPage />} />
          <Route path="requests" element={<RequestsPage />} />
          <Route path="regions" element={<RegionsPage />} />
          <Route path="locations" element={<LocationsPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/new" element={<ProductFormPage />} />
          <Route path="products/:id/edit" element={<ProductFormPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="inventory/:id/print-qr" element={<InventoryQrPrintPage />} />
          <Route path="transfer" element={<TransfersPage />} />
          <Route path="transfer/new" element={<TransferFormPage />} />
          <Route path="transfer/:id/edit" element={<TransferFormPage />} />
          <Route path="brands" element={<BrandsPage />} />
          <Route path="brands/:id" element={<BrandDetailPage />} />
          <Route path="manufacturer-brands" element={<ManufacturerBrandsPage />} />
          <Route path="banners" element={<BannersPage />} />
          <Route path="banners/new" element={<BannerFormPage />} />
          <Route path="banners/:id/edit" element={<BannerFormPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/new" element={<OrderFormPage />} />
          <Route path="orders/:id/edit" element={<OrderFormPage />} />
          <Route path="withdrawals" element={<WithdrawalsPage />} />
          <Route path="withdrawals/:id" element={<WithdrawalsDetailPage />} />
          <Route path="bonuses" element={<BonusesPage />} />
          <Route path="bonus-history" element={<BonusHistoryPage />} />
          <Route path="roles" element={<div className="p-6 text-foreground font-semibold">Roles & Permissions — coming soon</div>} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="notifications/new" element={<NotificationFormPage />} />
          <Route path="notifications/:id/edit" element={<NotificationFormPage />} />
        </Route>

        {/* Static design comparison panel */}
        <Route path="/admin-design" element={<ProtectedAdmin mode="design" />}>
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="admin-users" element={<AdminUsersPage />} />
          <Route path="shops" element={<DesignShopsPage />} />
          <Route path="requests" element={<RequestsPage />} />
          <Route path="regions" element={<DesignRegionsPage />} />
          <Route path="locations" element={<DesignLocationsPage />} />
          <Route path="products" element={<DesignProductsPage />} />
          <Route path="products/new" element={<DesignProductFormPage />} />
          <Route path="products/:id/edit" element={<DesignProductFormPage />} />
          <Route path="categories" element={<DesignCategoriesPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="inventory/:id/print-qr" element={<InventoryQrPrintPage />} />
          <Route path="transfer" element={<TransfersPage />} />
          <Route path="transfer/new" element={<TransferFormPage />} />
          <Route path="transfer/:id/edit" element={<TransferFormPage />} />
          <Route path="brands" element={<DesignBrandsPage />} />
          <Route path="brands/:id" element={<BrandDetailPage />} />
          <Route path="manufacturer-brands" element={<DesignManufacturerBrandsPage />} />
          <Route path="banners" element={<BannersPage />} />
          <Route path="banners/new" element={<BannerFormPage />} />
          <Route path="banners/:id/edit" element={<BannerFormPage />} />
          <Route path="orders" element={<DesignOrdersPage />} />
          <Route path="orders/new" element={<OrderFormPage />} />
          <Route path="orders/:id/edit" element={<OrderFormPage />} />
          <Route path="withdrawals" element={<WithdrawalsPage />} />
          <Route path="withdrawals/:id" element={<WithdrawalsDetailPage />} />
          <Route path="bonuses" element={<BonusesPage />} />
          <Route path="bonus-history" element={<BonusHistoryPage />} />
          <Route path="roles" element={<div className="p-6 text-foreground font-semibold">Roles & Permissions — coming soon</div>} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="notifications/new" element={<NotificationFormPage />} />
          <Route path="notifications/:id/edit" element={<NotificationFormPage />} />
        </Route>

        {/* Seller Admin panel */}
        <Route path="/seller" element={<SellerLayout />} />
      </Routes>
    </BrowserRouter>
  )
}
