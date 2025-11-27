'use client'

import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
    message: string
    type: ToastType
    onClose: () => void
}

export default function Toast({ message, type, onClose }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose()
        }, 5000)

        return () => clearTimeout(timer)
    }, [onClose])

    const icons = {
        success: <CheckCircle className="w-5 h-5 text-green-400" />,
        error: <AlertCircle className="w-5 h-5 text-red-400" />,
        info: <Info className="w-5 h-5 text-blue-400" />
    }

    const styles = {
        success: 'bg-gray-900 border-green-500/20 text-white',
        error: 'bg-gray-900 border-red-500/20 text-white',
        info: 'bg-gray-900 border-blue-500/20 text-white'
    }

    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl animate-in slide-in-from-bottom-5 fade-in duration-300 ${styles[type]}`}>
            {icons[type]}
            <p className="text-sm font-medium">{message}</p>
            <button onClick={onClose} className="ml-2 text-gray-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
            </button>
        </div>
    )
}
