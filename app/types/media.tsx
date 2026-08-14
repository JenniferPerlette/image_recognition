// types/media.ts
export type ImageFile = {
  id: string
  file: File
  preview: string
  name: string
  size: number
  type: string
}

export type Notification = {
  id: string
  title: string
  message: string
  read: boolean
  timestamp: Date
  type: 'info' | 'success' | 'warning' | 'error'
}