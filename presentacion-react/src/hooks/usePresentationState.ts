import { useState, useCallback, useEffect } from 'react';
import { PresentationState } from '../types/presentation';

export function usePresentationState(totalSlides: number = 18) {
  const [state, setState] = useState<PresentationState>({
    currentSlide: 1,
    isNotesOpen: false,
    isGridOpen: false,
    isFullscreen: false,
    lightboxImage: null,
  });

  const goToSlide = useCallback((target: number) => {
    setState((prev) => ({
      ...prev,
      currentSlide: Math.max(1, Math.min(totalSlides, target)),
      isGridOpen: false, // close thumbnail grid when jumping to slide
    }));
  }, [totalSlides]);

  const nextSlide = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentSlide: Math.min(totalSlides, prev.currentSlide + 1),
    }));
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentSlide: Math.max(1, prev.currentSlide - 1),
    }));
  }, []);

  const toggleNotes = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isNotesOpen: !prev.isNotesOpen,
    }));
  }, []);

  const toggleGrid = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isGridOpen: !prev.isGridOpen,
    }));
  }, []);

  const openLightbox = useCallback((src: string, title: string) => {
    setState((prev) => ({
      ...prev,
      lightboxImage: { src, title },
    }));
  }, []);

  const closeLightbox = useCallback(() => {
    setState((prev) => ({
      ...prev,
      lightboxImage: null,
    }));
  }, []);

  const closeAllModals = useCallback(() => {
    setState((prev) => ({
      ...prev,
      lightboxImage: null,
      isGridOpen: false,
      isNotesOpen: false,
    }));
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        // Fullscreen API may be blocked or unsupported in some contexts
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, []);

  // Sync fullscreen change with state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setState((prev) => ({
        ...prev,
        isFullscreen: !!document.fullscreenElement,
      }));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return {
    state,
    goToSlide,
    nextSlide,
    prevSlide,
    toggleNotes,
    toggleGrid,
    openLightbox,
    closeLightbox,
    closeAllModals,
    toggleFullscreen,
  };
}
