"use client"

import { Sidebar } from '../../components/sidebar'
import Collections from '../../components/collections'

export default function AlbumsPage() {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto bg-white rounded-lg shadow p-6">
          <Collections initialCount={8}/>
        </div>
      </main>
    </div>
  )
}
