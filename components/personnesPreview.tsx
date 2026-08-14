"use client"

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface Person {
  id: string
  name: string
  image: string
}

export default function PersonnesPreview() {
  const [people, setPeople] = useState<Person[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPeople = async () => {
      try {
        const response = await fetch(
        `https://api.unsplash.com/photos/random?count=8&query=portrait&client_id=${process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY}`
        )
        const data = await response.json()

        const formattedPeople = (Array.isArray(data) ? data : []).map((photo: any) => ({
          id: String(photo.id),
          name: photo.user?.name || 'Person',
          image: photo.urls?.thumb,
        }))

        setPeople(formattedPeople)
      } catch (error) {
        console.error('Error fetching people:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPeople()
  }, [])

  if (isLoading) {
    return <div className="animate-pulse p-4">Chargement des personnes...</div>
  }

  return (
    <div className="">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-md text-gray-400 font-bold">Personnes</h2>
        <Link href="/personnes" className="text-blue-500 text-sm font-medium">
          Tout voir
        </Link>
      </div>

      <div className="flex space-x-2 overflow-x-auto hide-scrollbar">
        {people.map((person) => (
          <Link
            key={person.id}
            href={`/personnes/${encodeURIComponent(person.id)}?name=${encodeURIComponent(person.name)}`}
            className="flex flex-col items-center space-y-4 flex-shrink-0"
          >
            <div className="m-1 w-14 h-14 rounded-full overflow-hidden ring-2 ring-offset-2 ring-blue-500">
              <Image
                src={person.image}
                alt={person.name}
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
