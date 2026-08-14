import { Sidebar } from '@/components/sidebar'
import PersonnesGrid from '../../components/personnesGrid'

export default function PersonnesPage() {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-md font-semibold text-gray-900">Personnes</h1>
            </div>
            <PersonnesGrid />
          </div>
        </div>
      </main>
    </div>
  )
}
