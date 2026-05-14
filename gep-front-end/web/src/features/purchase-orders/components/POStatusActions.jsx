import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, X, Send, Truck, CheckCircle2, Ban, RotateCcw, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { Field } from '@/components/primitives/Field';
import { Modal } from '@/components/primitives/Modal';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { ReasonDialog } from '@/components/feedback/ReasonDialog';
import { poApi } from '@/api/poApi';
import { qk } from '@/api/queryKeys';
import { PO_TRANSITIONS, PO_STATUS } from '@/constants/poStatus';
import { REASONS } from '@/constants/reasons';
import { ROLES } from '@/constants/roles';
import { useAuthStore } from '@/stores/authStore';
import { ERR, isErrorCode, getErrorMessage } from '@/lib/apiError';

/**
 * Map common PO transition errors to user-friendly messages.
 * Contract: tests/api/src/tests/po/state-machine.spec.js
 *           tests/api/src/tests/po/approval-limits.spec.js
 *           tests/api/src/tests/po/rbac.spec.js
 */
function poTransitionMessage(err, fallback) {
  if (isErrorCode(err, ERR.APPROVAL_LIMIT_EXCEEDED)) {
    return 'This PO exceeds your approval limit.';
  }
  if (isErrorCode(err, ERR.INVALID_STATUS_TRANSITION)) {
    return 'That action is not allowed from the PO’s current status.';
  }
  if (isErrorCode(err, ERR.INVALID_STATE_FOR_EDIT)) {
    return 'This PO is no longer editable.';
  }
  if (isErrorCode(err, ERR.INSUFFICIENT_ROLE)) {
    return 'You do not have permission to perform this action.';
  }
  return getErrorMessage(err, fallback);
}

/**
 * Role-switched PO action bar.
 *
 * Visibility rules (combining transition allowance and persona):
 *  - BUYER who owns the PO:    submit, cancel, revise, fulfill, close, edit
 *  - APPROVER:                  approve, reject  (only when SUBMITTED)
 *  - ADMIN:                     all of the above
 */
export function POStatusActions({ po, compact = false }) {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(null);
  const [fulfillDate, setFulfillDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const qc = useQueryClient();

  const allowed = PO_TRANSITIONS[po?.status] || [];
  const isBuyer = user?.roles?.includes(ROLES.BUYER);
  const isApprover = user?.roles?.includes(ROLES.APPROVER);
  const isAdmin = user?.roles?.includes(ROLES.ADMIN);
  const ownsPO = po?.buyer_id === user?.id;

  const showBuyerAction = (action) => {
    if (!allowed.includes(action)) return false;
    if (isAdmin) return true;
    if (!isBuyer) return false;
    // Only the owning buyer can act on their own PO
    return ownsPO || action === 'close';
  };
  const showApproverAction = (action) => {
    if (!allowed.includes(action)) return false;
    return isApprover || isAdmin;
  };

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: qk.pos.detail(po.id) });
    qc.invalidateQueries({ queryKey: ['pos', 'list'] });
    qc.invalidateQueries({ queryKey: ['pos', 'agg'] });
  };

  const submit = useMutation({
    mutationFn: () => poApi.submit(po.id),
    onSuccess: (result) => {
      // Submit may auto-approve when total_amount <= server threshold.
      // Contract: tests/api/src/tests/po/state-machine.spec.js
      if (result?.status === PO_STATUS.APPROVED && result?.auto_approved) {
        toast.success('PO auto-approved (total within threshold)');
      } else {
        toast.success('PO submitted for approval');
      }
      invalidate();
      setOpen(null);
    },
    onError: (err) => toast.error(poTransitionMessage(err, 'Could not submit PO.')),
  });
  const approve = useMutation({
    mutationFn: () => poApi.approve(po.id),
    onSuccess: () => {
      toast.success('PO approved');
      invalidate();
      setOpen(null);
    },
    onError: (err) => toast.error(poTransitionMessage(err, 'Could not approve PO.')),
  });
  const reject = useMutation({
    mutationFn: (reason) => poApi.reject(po.id, { reason }),
    onSuccess: () => {
      toast.success('PO rejected');
      invalidate();
      setOpen(null);
    },
    onError: (err) => toast.error(poTransitionMessage(err, 'Could not reject PO.')),
  });
  const revise = useMutation({
    mutationFn: () => poApi.revise(po.id),
    onSuccess: () => {
      toast.success('PO reverted to Draft');
      invalidate();
      setOpen(null);
    },
    onError: (err) => toast.error(poTransitionMessage(err, 'Could not revise PO.')),
  });
  const fulfill = useMutation({
    mutationFn: () => poApi.fulfill(po.id, { actual_delivery_date: fulfillDate }),
    onSuccess: () => {
      toast.success('PO marked as fulfilled');
      invalidate();
      setOpen(null);
    },
    onError: (err) => toast.error(poTransitionMessage(err, 'Could not fulfill PO.')),
  });
  const close = useMutation({
    mutationFn: () => poApi.close(po.id),
    onSuccess: () => {
      toast.success('PO closed');
      invalidate();
      setOpen(null);
    },
    onError: (err) => toast.error(poTransitionMessage(err, 'Could not close PO.')),
  });
  const cancel = useMutation({
    mutationFn: (reason) => poApi.cancel(po.id, reason ? { reason } : {}),
    onSuccess: () => {
      toast.success('PO cancelled');
      invalidate();
      setOpen(null);
    },
    onError: (err) => toast.error(poTransitionMessage(err, 'Could not cancel PO.')),
  });

  if (!po) return null;

  const btnSize = compact ? 'sm' : 'md';

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* Buyer-side actions */}
        {showBuyerAction('edit') ? (
          <Link to={`/purchase-orders/${po.id}/edit`}>
            <Button variant="secondary" size={btnSize} leftIcon={<Pencil className="h-4 w-4" />}>
              Edit
            </Button>
          </Link>
        ) : null}
        {showBuyerAction('submit') ? (
          <Button
            variant="primary"
            size={btnSize}
            leftIcon={<Send className="h-4 w-4" />}
            onClick={() => setOpen('submit')}
          >
            Submit
          </Button>
        ) : null}
        {showBuyerAction('revise') ? (
          <Button
            variant="secondary"
            size={btnSize}
            leftIcon={<RotateCcw className="h-4 w-4" />}
            onClick={() => setOpen('revise')}
          >
            Revise
          </Button>
        ) : null}
        {showBuyerAction('fulfill') ? (
          <Button
            variant="primary"
            size={btnSize}
            leftIcon={<Truck className="h-4 w-4" />}
            onClick={() => setOpen('fulfill')}
          >
            Mark fulfilled
          </Button>
        ) : null}
        {showBuyerAction('close') ? (
          <Button
            variant="secondary"
            size={btnSize}
            leftIcon={<CheckCircle2 className="h-4 w-4" />}
            onClick={() => setOpen('close')}
          >
            Close
          </Button>
        ) : null}
        {showBuyerAction('cancel') ? (
          <Button
            variant="ghost"
            size={btnSize}
            leftIcon={<Ban className="h-4 w-4" />}
            onClick={() => setOpen('cancel')}
          >
            Cancel
          </Button>
        ) : null}

        {/* Approver-side actions */}
        {showApproverAction('approve') ? (
          <Button
            variant="primary"
            size={btnSize}
            leftIcon={<Check className="h-4 w-4" />}
            onClick={() => setOpen('approve')}
          >
            Approve
          </Button>
        ) : null}
        {showApproverAction('reject') ? (
          <Button
            variant="danger"
            size={btnSize}
            leftIcon={<X className="h-4 w-4" />}
            onClick={() => setOpen('reject')}
          >
            Reject
          </Button>
        ) : null}
      </div>

      {/* Modals */}
      <ConfirmDialog
        open={open === 'submit'}
        onClose={() => setOpen(null)}
        onConfirm={() => submit.mutate()}
        title="Submit for approval"
        description={`Send ${po.po_number || 'this PO'} to an approver. You will not be able to edit until it is approved or rejected.`}
        confirmLabel="Submit"
        loading={submit.isPending}
      />
      <ConfirmDialog
        open={open === 'approve'}
        onClose={() => setOpen(null)}
        onConfirm={() => approve.mutate()}
        title="Approve purchase order"
        description={`Approve ${po.po_number || 'this PO'}? The buyer will be able to mark it fulfilled.`}
        confirmLabel="Approve"
        loading={approve.isPending}
      />
      <ReasonDialog
        open={open === 'reject'}
        onClose={() => setOpen(null)}
        onConfirm={(reason) => reject.mutate(reason)}
        title="Reject purchase order"
        description="Provide a reason so the buyer can revise the PO."
        chips={REASONS.PO_REJECT}
        confirmLabel="Reject"
        variant="danger"
        loading={reject.isPending}
      />
      <ConfirmDialog
        open={open === 'revise'}
        onClose={() => setOpen(null)}
        onConfirm={() => revise.mutate()}
        title="Revise rejected PO"
        description="Move this PO back to Draft so you can edit it and submit again."
        confirmLabel="Revise"
        loading={revise.isPending}
      />
      <ConfirmDialog
        open={open === 'close'}
        onClose={() => setOpen(null)}
        onConfirm={() => close.mutate()}
        title="Close PO"
        description={`Close ${po.po_number || 'this PO'}. No further changes will be possible.`}
        confirmLabel="Close"
        loading={close.isPending}
      />
      <ReasonDialog
        open={open === 'cancel'}
        onClose={() => setOpen(null)}
        onConfirm={(reason) => cancel.mutate(reason)}
        title="Cancel purchase order"
        description={`Cancel ${po.po_number || 'this PO'}. Pick the closest reason or write your own.`}
        chips={REASONS.PO_CANCEL}
        required={false}
        confirmLabel="Cancel PO"
        variant="danger"
        loading={cancel.isPending}
      />

      {/* Fulfill needs a date input — custom modal */}
      <Modal
        open={open === 'fulfill'}
        onClose={() => setOpen(null)}
        title="Mark PO fulfilled"
        description="Record the date goods or services were received."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(null)} disabled={fulfill.isPending}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => fulfill.mutate()}
              disabled={fulfill.isPending || !fulfillDate}
            >
              {fulfill.isPending ? 'Saving…' : 'Mark fulfilled'}
            </Button>
          </>
        }
      >
        <Field label="Actual delivery date" required help="Cannot be in the future.">
          {({ id, invalid }) => (
            <Input
              id={id}
              type="date"
              invalid={invalid}
              max={new Date().toISOString().slice(0, 10)}
              value={fulfillDate}
              onChange={(e) => setFulfillDate(e.target.value)}
            />
          )}
        </Field>
      </Modal>
    </>
  );
}

POStatusActions.STATUSES = PO_STATUS;
