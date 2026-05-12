import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { RequireAuth } from './RequireAuth';
import { RequireRole } from './RequireRole';
import { LandingRedirect } from './LandingRedirect';
import { ROLES } from '@/constants/roles';
import { LoginPage } from '@/features/auth/LoginPage';
import { ChangePasswordPage } from '@/features/auth/ChangePasswordPage';
import { BuyerDashboard } from '@/features/dashboards/BuyerDashboard';
import { ApproverDashboard } from '@/features/dashboards/ApproverDashboard';
import { AdminDashboard } from '@/features/dashboards/AdminDashboard';
import { SupplierDirectoryPage } from '@/features/suppliers/SupplierDirectoryPage';
import { SupplierDetailPage } from '@/features/suppliers/SupplierDetailPage';
import { CreateSupplierWizard } from '@/features/suppliers/CreateSupplierWizard';
import { EditSupplierPage } from '@/features/suppliers/EditSupplierPage';
import { PendingSupplierApprovalsPage } from '@/features/suppliers/PendingSupplierApprovalsPage';
import { SupplierAggregationsPage } from '@/features/suppliers/SupplierAggregationsPage';
import { PoListPage } from '@/features/purchase-orders/PoListPage';
import { PoDetailPage } from '@/features/purchase-orders/PoDetailPage';
import { CreatePoWizard } from '@/features/purchase-orders/CreatePoWizard';
import { EditPoPage } from '@/features/purchase-orders/EditPoPage';
import { ApprovalQueuePage } from '@/features/approvals/ApprovalQueuePage';
import { SpendAnalyticsPage } from '@/features/analytics/SpendAnalyticsPage';
import { OperationsPage } from '@/features/analytics/OperationsPage';
import { UserListPage } from '@/features/users/UserListPage';
import { CreateUserPage } from '@/features/users/CreateUserPage';
import { EditUserPage } from '@/features/users/EditUserPage';
import { NotFoundPage } from '@/features/errors/NotFoundPage';
import { ForbiddenPage } from '@/features/errors/ForbiddenPage';
import { ErrorPage } from '@/features/errors/ErrorPage';
import { Placeholder } from '@/features/placeholder/Placeholder';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="/500" element={<ErrorPage />} />

      {/* Authenticated */}
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<LandingRedirect />} />

          <Route path="dashboard/buyer" element={<BuyerDashboard />} />
          <Route
            path="dashboard/approver"
            element={
              <RequireRole roles={[ROLES.APPROVER, ROLES.ADMIN]}>
                <ApproverDashboard />
              </RequireRole>
            }
          />
          <Route
            path="dashboard/admin"
            element={
              <RequireRole roles={[ROLES.ADMIN]}>
                <AdminDashboard />
              </RequireRole>
            }
          />

          <Route path="analytics/spend" element={<SpendAnalyticsPage />} />
          <Route
            path="analytics/operations"
            element={
              <RequireRole roles={[ROLES.APPROVER, ROLES.ADMIN]}>
                <OperationsPage />
              </RequireRole>
            }
          />

          <Route path="suppliers" element={<SupplierDirectoryPage />} />
          <Route
            path="suppliers/new"
            element={
              <RequireRole roles={[ROLES.BUYER, ROLES.ADMIN]}>
                <CreateSupplierWizard />
              </RequireRole>
            }
          />
          <Route
            path="suppliers/pending-approval"
            element={
              <RequireRole roles={[ROLES.ADMIN]}>
                <PendingSupplierApprovalsPage />
              </RequireRole>
            }
          />
          <Route path="suppliers/aggregations" element={<SupplierAggregationsPage />} />
          <Route path="suppliers/:id" element={<SupplierDetailPage />} />
          <Route
            path="suppliers/:id/edit"
            element={
              <RequireRole roles={[ROLES.BUYER, ROLES.ADMIN]}>
                <EditSupplierPage />
              </RequireRole>
            }
          />

          <Route path="purchase-orders" element={<PoListPage />} />
          <Route
            path="purchase-orders/new"
            element={
              <RequireRole roles={[ROLES.BUYER, ROLES.ADMIN]}>
                <CreatePoWizard />
              </RequireRole>
            }
          />
          <Route path="purchase-orders/:id" element={<PoDetailPage />} />
          <Route
            path="purchase-orders/:id/edit"
            element={
              <RequireRole roles={[ROLES.BUYER, ROLES.ADMIN]}>
                <EditPoPage />
              </RequireRole>
            }
          />

          <Route
            path="approvals"
            element={
              <RequireRole roles={[ROLES.APPROVER, ROLES.ADMIN]}>
                <ApprovalQueuePage />
              </RequireRole>
            }
          />

          <Route
            path="users"
            element={
              <RequireRole roles={[ROLES.ADMIN]}>
                <UserListPage />
              </RequireRole>
            }
          />
          <Route
            path="users/new"
            element={
              <RequireRole roles={[ROLES.ADMIN]}>
                <CreateUserPage />
              </RequireRole>
            }
          />
          <Route
            path="users/:id/edit"
            element={
              <RequireRole roles={[ROLES.ADMIN]}>
                <EditUserPage />
              </RequireRole>
            }
          />

          <Route path="account/change-password" element={<ChangePasswordPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
