import { ROLES } from '@/constants/roles';

const has = (user, role) => Boolean(user?.roles?.includes(role));
const hasAny = (user, roles) => Boolean(user?.roles?.some((r) => roles.includes(r)));

export const can = {
  viewAnalytics: (user) => Boolean(user),
  viewOperations: (user) => hasAny(user, [ROLES.APPROVER, ROLES.ADMIN]),

  createSupplier: (user) => hasAny(user, [ROLES.BUYER, ROLES.ADMIN]),
  editSupplier: (user) => hasAny(user, [ROLES.BUYER, ROLES.ADMIN]),
  transitionSupplier: (user) => has(user, ROLES.ADMIN),
  viewPendingSuppliers: (user) => has(user, ROLES.ADMIN),

  createPO: (user) => has(user, ROLES.BUYER),
  editPO: (user) => has(user, ROLES.BUYER),
  approvePO: (user) => has(user, ROLES.APPROVER),
  viewApprovalQueue: (user) => hasAny(user, [ROLES.APPROVER, ROLES.ADMIN]),

  manageUsers: (user) => has(user, ROLES.ADMIN),
};
