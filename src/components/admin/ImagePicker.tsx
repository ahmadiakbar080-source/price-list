import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ImageIcon, TrashIcon } from '@/components/icons';
import { useToast } from '@/hooks/useToast';
import { GENERIC_ERROR, IMAGE_ACCEPT } from '@/lib/constants';
import { cn } from '@/utils/cn';

interface Props {
  label: string;
  accept?: string;
  helpText?: string;
  currentUrl: string | null;
  disabled?: boolean;
  /** Receives the newly picked file, or null when the user clears the choice. */
  onFileChange: (file: File | null) => void;
}

/** Drag & drop / click picker with instant preview (§15). */
export function ImagePicker({
  label,
  accept = IMAGE_ACCEPT,
  helpText,
  currentUrl,
  disabled,
  onFileChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [failed, setFailed] = useState(false);

  const objectUrl = useRef<string | null>(null);
  useEffect(() => {
    if (file) {
      objectUrl.current = URL.createObjectURL(file);
    }
    return () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = null;
    };
  }, [file]);

  const previewSrc = file ? objectUrl.current : currentUrl;

  const pick = (picked: File | null) => {
    setFailed(false);
    if (!picked) {
      setFile(null);
      onFileChange(null);
      return;
    }
    // Structural validation happens again (authoritatively) in the service
    // layer before upload; here we give instant feedback.
    const ok = /\.(jpe?g|png|webp)$/i.test(picked.name);
    if (!ok) {
      toast.error('فرمت تصویر مجاز نیست. فرمت‌های مجاز: JPG، PNG، WEBP');
      return;
    }
    if (picked.size > 5 * 1024 * 1024) {
      toast.error('حجم تصویر باید کمتر از ۵ مگابایت باشد.');
      return;
    }
    setFile(picked);
    onFileChange(picked);
  };

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <div
        role="button"
        tabIndex={0}
        aria-label={label}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!disabled && e.dataTransfer.files[0]) pick(e.dataTransfer.files[0]);
        }}
        className={cn(
          'flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed p-4 transition',
          dragOver ? 'border-indigo-400 bg-indigo-50/60' : 'border-slate-300 bg-slate-50/60 hover:border-indigo-300',
          disabled && 'pointer-events-none opacity-60',
        )}
      >
        {previewSrc && !failed ? (
          <img
            src={previewSrc}
            alt="پیش‌نمایش"
            onError={() => setFailed(true)}
            className="size-16 shrink-0 rounded-lg border border-slate-200 bg-white object-contain p-1"
          />
        ) : (
          <span className="flex size-16 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-300">
            <ImageIcon className="text-2xl" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-700">
            {file ? file.name : previewSrc ? 'تصویر فعلی' : 'انتخاب تصویر'}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-400">
            {helpText ?? 'کلیک کنید یا فایل را بکشید — JPG، PNG، WEBP تا ۵ مگابایت'}
          </p>
        </div>
        {(file || currentUrl) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            aria-label="برداشتن تصویر"
            onClick={(e) => {
              e.stopPropagation();
              if (inputRef.current) inputRef.current.value = '';
              pick(null);
            }}
          >
            <TrashIcon />
          </Button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => pick(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}