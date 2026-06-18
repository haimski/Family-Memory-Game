import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getImages } from './api.js';

const ImagesContext = createContext(null);

export function ImagesProvider({ children }) {
  const [images, setImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const map = await getImages();
      setImages(map);
    } catch (err) {
      setError(err.userMessage || 'שגיאה בחיבור לשרת');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <ImagesContext.Provider value={{ images, setImages, loading, error, refetch }}>
      {children}
    </ImagesContext.Provider>
  );
}

export function useImages() {
  const ctx = useContext(ImagesContext);
  if (!ctx) throw new Error('useImages must be used within an ImagesProvider');
  return ctx;
}
