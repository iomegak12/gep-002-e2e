import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, Ban, Pause, Play } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { ReasonDialog } from '@/components/feedback/ReasonDialog';
import { supplierApi } from '@/api/supplierApi';
import { qk } from '@/api/queryKeys';
import { SUPPLIER_TRANSITIONS } from '@/constants/supplierStatus';
import { REASONS } from '@/constants/reasons';
import { ERR, isErrorCode, getErrorMessage } from '@/lib/apiError';

/**
 * Map common transition errors to user-friendly messages.
 * Contract: gep-back-end/tests/src/tests/supplier/transitions.spec.js
 */
function transitionMessage(err, fallback) {
  if (isErrorCode(err, ERR.INVALID_STATUS_TRANSITION)) {
    return 'That status change is not allowed from the supplier’s current state.';
  }
  if (isErrorCode(err, ERR.INSUFFICIENT_ROLE)) {
    return 'You do not have permission to change this supplier’s status.';
  }
  return getErrorMessage(err, fallback);
}

/**
 * Renders the set of action buttons available for a supplier's current status,
 * and wires each to its modal (ReasonDialog for destructive actions, ConfirmDialog
 * for benign approve/reactivate).
 */
export function SupplierStatusActions({ supplier, onChange, compact = false }) {
  const allowed = SUPPLIER_TRANSITIONS[supplier?.status] || [];
  const [open, setOpen] = useState(null); // 'approve' | 'deactivate' | 'reactivate' | 'blacklist'
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: qk.suppliers.detail(supplier.id) });
    qc.invalidateQueries({ queryKey: ['suppliers', 'list'] });
    qc.invalidateQueries({ queryKey: ['suppliers', 'agg'] });
  };

  const approve = useMutation({
    mutationFn: () => supplierApi.approve(supplier.id),
    onSuccess: () => {
      toast.success(`${supplier.display_name || supplier.legal_name} approved`);
      invalidate();
      onChange?.('ACTIVE');
      setOpen(null);
    },
    onError: (err) => toast.error(transitionMessage(err, 'Could not approve supplier.')),
  });

  const reactivate = useMutation({
    mutationFn: () => supplierApi.reactivate(supplier.id),
    onSuccess: () => {
      toast.success('Supplier reactivated');
      invalidate();
      onChange?.('ACTIVE');
      setOpen(null);
    },
    onError: (err) => toast.error(transitionMessage(err, 'Could not reactivate supplier.')),
  });

  const deactivate = useMutation({
    mutationFn: (reason) => supplierApi.deactivate(supplier.id, { reason }),
    onSuccess: () => {
      toast.success('Supplier deactivated');
      invalidate();
      onChange?.('INACTIVE');
      setOpen(null);
    },
    onError: (err) => toast.error(transitionMessage(err, 'Could not deactivate supplier.')),
  });

  const blacklist = useMutation({
    mutationFn: (reason) => supplierApi.blacklist(supplier.id, { reason }),
    onSuccess: () => {
      toast.success('Supplier blacklisted');
      invalidate();
      onChange?.('BLACKLISTED');
      setOpen(null);
    },
    onError: (err) => toast.error(transitionMessage(err, 'Could not blacklist supplier.')),
  });

  if (!allowed.length) return null;

  const btnSize = compact ? 'sm' : 'md';

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {allowed.includes('approve') ? (
          <Button
            variant="primary"
            size={btnSize}
            leftIcon={<Check className="h-4 w-4" />}
            onClick={() => setOpen('approve')}
          >
            Approve
          </Button>
        ) : null}
        {allowed.includes('reactivate') ? (
          <Button
            variant="secondary"
            size={btnSize}
            leftIcon={<Play className="h-4 w-4" />}
            onClick={() => setOpen('reactivate')}
          >
            Reactivate
          </Button>
        ) : null}
        {allowed.includes('deactivate') ? (
          <Button
            variant="secondary"
            size={btnSize}
            leftIcon={<Pause className="h-4 w-4" />}
            onClick={() => setOpen('deactivate')}
          >
            Deactivate
          </Button>
        ) : null}
        {allowed.includes('blacklist') ? (
          <Button
            variant="danger"
            size={btnSize}
            leftIcon={<Ban className="h-4 w-4" />}
            onClick={() => setOpen('blacklist')}
          >
            Blacklist
          </Button>
        ) : null}
      </div>

      <ConfirmDialog
        open={open === 'approve'}
        onClose={() => setOpen(null)}
        onConfirm={() => approve.mutate()}
        title="Approve supplier"
        description={`Mark ${supplier.display_name || supplier.legal_name} as Active. They will become eligible for new POs immediately.`}
        confirmLabel="Approve"
        variant="primary"
        loading={approve.isPending}
      />
      <ConfirmDialog
        open={open === 'reactivate'}
        onClose={() => setOpen(null)}
        onConfirm={() => reactivate.mutate()}
        title="Reactivate supplier"
        description={`Move ${supplier.display_name || supplier.legal_name} back to Active. Historical POs remain unchanged.`}
        confirmLabel="Reactivate"
        variant="primary"
        loading={reactivate.isPending}
      />
      <ReasonDialog
        open={open === 'deactivate'}
        onClose={() => setOpen(null)}
        onConfirm={(reason) => deactivate.mutate(reason)}
        title="Deactivate supplier"
        description={`${supplier.display_name || supplier.legal_name} will not be selectable on new POs. Existing POs are unaffected.`}
        chips={REASONS.SUPPLIER_DEACTIVATE}
        confirmLabel="Deactivate"
        variant="danger"
        loading={deactivate.isPending}
      />
      <ReasonDialog
        open={open === 'blacklist'}
        onClose={() => setOpen(null)}
        onConfirm={(reason) => blacklist.mutate(reason)}
        title="Blacklist supplier"
        description={`${supplier.display_name || supplier.legal_name} will be permanently disqualified. This action cannot be undone — historical records remain.`}
        chips={REASONS.SUPPLIER_BLACKLIST}
        confirmLabel="Blacklist"
        variant="danger"
        loading={blacklist.isPending}
      />
    </>
  );
}
