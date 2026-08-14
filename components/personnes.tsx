"use client"

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { createApi } from 'unsplash-js'

interface Person {
  id: string
  image: string
}

export function Personnes() {
  const [people, setPeople] = useState<Person[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPeople = async () => {
      try {
                const response = await fetch(process.env.NEXT_PUBLIC_RANDOMUSER_URL || 'https://randomuser.me/api/?results=5')

        const data = await response.json()
        
        const formattedPeople = data.map((photo: any) => ({
          id: photo.id,
          image: photo.urls.thumb
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
        <button className="text-blue-500 text-sm font-medium">Tout voir</button>
      </div>
      
      <div className="flex space-x-2 overflow-x-auto  hide-scrollbar">
        {people.map((person) => (
          <div key={person.id} className="flex flex-col items-center space-y-4 flex-shrink-0">
            <div className=" m-1 w-12 h-12 rounded-full overflow-hidden ring-2 ring-offset-2 ring-blue-500">
              <Image
                src={person.image}
                alt={'person'}
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}