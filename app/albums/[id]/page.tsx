import { Sidebar } from '../../../components/sidebar'
import AlbumDetail from '../../../components/albumDetail'

type Props = {
  params: { id: string }
}

export default function AlbumIdPage({ params }: Props) {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto bg-white rounded-lg shadow p-6">
          <AlbumDetail id={params.id} />
        </div>
      </main>
    </div>
  )
}
