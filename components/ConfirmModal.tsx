'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  type = 'info',
}: ConfirmModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && mounted) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, mounted]);

  if (!mounted || !isOpen) return null;

  const bgColorClass =
    type === 'danger'
      ? 'bg-red-600 hover:bg-red-700'
      : type === 'warning'
      ? 'bg-yellow-600 hover:bg-yellow-700'
      : 'bg-blue-600 hover:bg-blue-700';

  const defaultConfirmText = mounted ? t('admin.common.confirm') : 'Evet';
  const defaultCancelText = mounted ? t('admin.common.cancelConfirm') : 'İptal';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all">
        <div className="p-6">
          {/* Icon */}
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100">
            {type === 'danger' && (
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            )}
            {type === 'warning' && (
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            )}
            {type === 'info' && (
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            {title}
          </h3>

          {/* Message */}
          <p className="text-sm text-gray-600 text-center mb-6">{message}</p>

          {/* Buttons */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {cancelText || defaultCancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${bgColorClass}`}
            >
              {confirmText || defaultConfirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Global confirm function için helper
let confirmResolver: ((value: boolean) => void) | null = null;
let confirmListeners: ((isOpen: boolean) => void)[] = [];
let currentConfirm: {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
} | null = null;

export function showConfirm(
  title: string,
  message: string,
  options?: {
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
  }
): Promise<boolean> {
  return new Promise((resolve) => {
    confirmResolver = resolve;
    currentConfirm = {
      title,
      message,
      confirmText: options?.confirmText,
      cancelText: options?.cancelText,
      type: options?.type || 'info',
    };
    confirmListeners.forEach((listener) => listener(true));
  });
}

export function ConfirmModalProvider() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const listener = (open: boolean) => {
      setIsOpen(open);
    };
    confirmListeners.push(listener);
    return () => {
      confirmListeners = confirmListeners.filter((l) => l !== listener);
    };
  }, []);

  const handleConfirm = () => {
    if (confirmResolver) {
      confirmResolver(true);
      confirmResolver = null;
      currentConfirm = null;
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    if (confirmResolver) {
      confirmResolver(false);
      confirmResolver = null;
      currentConfirm = null;
    }
    setIsOpen(false);
  };

  if (!currentConfirm) return null;

  return (
    <ConfirmModal
      isOpen={isOpen}
      title={currentConfirm.title}
      message={currentConfirm.message}
      confirmText={currentConfirm.confirmText}
      cancelText={currentConfirm.cancelText}
      type={currentConfirm.type}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );
}
