'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import Toast, { ToastType } from '@/components/ui/Toast'

interface ToastMessage {
    id: string
    message: string
    type: ToastType
}

interface ToastContextType {
    showToast: (message: string, type: ToastType) => void
    success: (message: string) => void
    error: (message: string) => void
    info: (message: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastMessage[]>([])

    const showToast = (message: string, type: ToastType) => {
        const id = Math.random().toString(36).substring(2, 9)
        setToasts((prev) => [...prev, { id, message, type }])
    }

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }

    const success = (message: string) => showToast(message, 'success')
    const error = (message: string) => showToast(message, 'error')
    const info = (message: string) => showToast(message, 'info')

    return (
        <ToastContext.Provider value={{ showToast, success, error, info }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider')
    }
    return context
}
