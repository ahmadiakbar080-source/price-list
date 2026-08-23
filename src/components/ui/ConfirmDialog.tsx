import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { WarningIcon } from '@/components/icons';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'تأیید',
  cancelLabel = 'انصراف',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal open={open} title={title} onClose={loading ? () => undefined : onCancel} maxWidth="sm:max-w-md">
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full ${
            danger ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
          }`}
        >
          <WarningIcon className="text-xl" />
        </span>
        <p className="pt-1.5 text-sm leading-6 text-slate-700">{message}</p>
      </div>
      <div className="mt-5 flex justify-start gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}