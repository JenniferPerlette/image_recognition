"use client"
import { useRouter } from 'next/navigation';
import { ImageUploader } from '../../components/uploadImage';
import { Sidebar } from '../../components/sidebar';
import { useState } from 'react';
import { ImageFile } from '../../app/types/media';

export default function AddPictures() {
  const router = useRouter();
  const [uploadedFiles, setUploadedFiles] = useState<ImageFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const handleFilesSelected = (files: ImageFile[]) => {
    setUploadedFiles(files);
  };

  const handleSubmit = async () => {
    try {
      setIsUploading(true);
      // Ici, vous pouvez ajouter la logique pour envoyer les fichiers au serveur
      console.log('Téléversement des fichiers:', uploadedFiles);
      
      // Simuler un délai de téléversement
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Rediriger vers la page d'accueil après un téléversement réussi
      router.push('/');
    } catch (error) {
      console.error('Erreur lors du téléversement:', error);
      alert('Une erreur est survenue lors du téléversement');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Ajouter des photos</h1>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <ImageUploader 
              onFilesChange={handleFilesSelected}
              onUpload={handleSubmit} 
              maxSizeMB={10}
            />
          </div>
        </div>
      </main>
    </div>
  );
}