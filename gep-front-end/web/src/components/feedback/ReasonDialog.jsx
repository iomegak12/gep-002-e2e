import { useEffect, useState } from 'react';
import { Modal } from '@/components/primitives/Modal';
import { Button } from '@/components/primitives/Button';
import { ReasonPicker } from '@/components/forms/ReasonPicker';

/**
 * Confirmation dialog that requires the user to pick a predefined reason chip
 * (or type a custom one via "Other") before submitting.
 */
export function ReasonDialog({
  open,
  onClose,
  onConfirm,
  title = 'Provide a reason',
  description,
  chips = [],
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  required = true,
  loading = false,
}) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) setReason('');
  }, [open]);

  const canSubmit = required ? reason.trim().length > 0 : true;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            onClick={() => onConfirm?.(reason.trim())}
            disabled={!canSubmit || loading}
          >
            {loading ? 'Working…' : confirmLabel}
          </Button>
        </>
      }
    >
      <ReasonPicker chips={chips} value={reason} onChange={setReason} />
    </Modal>
  );
}
