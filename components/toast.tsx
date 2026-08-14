import React from 'react'

export default function Toast({
  message,
  actionLabel,
  onAction,
  onClose,
}: {
  message: string
  actionLabel?: string
  onAction?: () => void
  onClose?: () => void
}) {
  return (
    <div className="fixed left-6 bottom-6 z-50">
      <div className="bg-gray-800 text-white px-4 py-2 rounded shadow flex items-center gap-4">
        <div className="text-sm">{message}</div>
        {actionLabel && (
          <button
            onClick={() => {
              onAction?.()
              onClose?.()
            }}
            className="text-blue-200 hover:text-white text-sm"
          >
            {actionLabel}
          </button>
        )}
        <button onClick={() => onClose?.()} className="text-gray-400 hover:text-white ml-2 text-sm">✕</button>
      </div>
    </div>
  )
}
