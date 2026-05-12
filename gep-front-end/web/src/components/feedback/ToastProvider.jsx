import { Toaster } from 'sonner';
import { useThemeStore } from '@/stores/themeStore';

export function ToastProvider() {
  const effective = useThemeStore((s) => s.effective);
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      theme={effective === 'dark' ? 'dark' : 'light'}
      toastOptions={{
        style: { fontSize: '13px' },
      }}
    />
  );
}
