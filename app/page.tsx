"use client"
import Image from "next/image";
import {Sidebar} from "../components/sidebar";
import PersonnesPreview from "../components/personnesPreview";
import { SearchBar } from '../components/searchBar'
import { NotificationBell } from '../components/notifications';
import { ImageUploader } from '../components/uploadImage';
import { useState } from 'react';
import { UserProfile } from "@/components/profile";
import type { Notification } from './types/media';
import PhotoGallery from "../components/gallery" ;
import AlbumList from "../components/album" ;
export default function Home() {
  const [showUploader, setShowUploader] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const currentUser = {
    firstName: 'Jennifer ',
    lastName: 'Perlette',
    email: 'jenniferperlette@gmail.com',
  };
  const handleUpload = (files: any) => {
    console.log('Fichiers téléchargés:', files);
    setShowUploader(false);
    // Ici, vous pourriez ajouter la logique pour envoyer les fichiers au serveur
  };

  const handleNotificationClick = (id: string | number) => {
  setNotifications(notifications.map(n => 
    n.id === id ? { ...n, read: true } : n
  ));
};
  return (
   <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto bg-white rounded-lg shadow">
          {/* Barre d'outils en haut */}
          <div className="flex items-center justify-between p-4">
            <div className="flex-1 max-w-md">
              <SearchBar/>
            </div>
            
            <div className="flex items-center space-x-4">
              <a 
                href="/addPictures"
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                title="Ajouter des photos"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </a>
              <NotificationBell 
                notifications={notifications}
                onNotificationClick={handleNotificationClick}
              />
              
              <div className="ml-4">
                <UserProfile user={currentUser} />
              </div>
            </div>
          </div>

          {/* Zone de dépôt des fichiers (affichée conditionnellement) */}
          {showUploader && (
            <div className="mb-6 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Ajouter des photos</h2>
                <button 
                  onClick={() => setShowUploader(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <a href="/addPictures" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Ajouter des photos</a>
            </div>
          )}

          {/* Section Personnes */}
          <div className="bg-white shadow p-4">
            <PersonnesPreview />
          </div>
          <div className="bg-white p-4">
            <PhotoGallery />
          </div>
        </div>
      </main>
    </div>
  );
}
