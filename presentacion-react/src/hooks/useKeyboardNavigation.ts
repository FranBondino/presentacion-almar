import { useEffect } from 'react';

interface KeyboardNavigationProps {
  onNext: () => void;
  onPrev: () => void;
  onFirst: () => void;
  onLast: () => void;
  onToggleGrid: () => void;
  onToggleNotes: () => void;
  onToggleFullscreen: () => void;
  onEscape: () => void;
}

export function useKeyboardNavigation({
  onNext,
  onPrev,
  onFirst,
  onLast,
  onToggleGrid,
  onToggleNotes,
  onToggleFullscreen,
  onEscape,
}: KeyboardNavigationProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore key events if focus is on an input or textarea
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      switch (event.key) {
        case 'ArrowRight':
        case ' ':
        case 'PageDown':
          event.preventDefault();
          onNext();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          event.preventDefault();
          onPrev();
          break;
        case 'Home':
          event.preventDefault();
          onFirst();
          break;
        case 'End':
          event.preventDefault();
          onLast();
          break;
        case 'o':
        case 'O':
        case 'm':
        case 'M':
          event.preventDefault();
          onToggleGrid();
          break;
        case 'n':
        case 'N':
          event.preventDefault();
          onToggleNotes();
          break;
        case 'f':
        case 'F':
          event.preventDefault();
          onToggleFullscreen();
          break;
        case 'Escape':
          event.preventDefault();
          onEscape();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    onNext,
    onPrev,
    onFirst,
    onLast,
    onToggleGrid,
    onToggleNotes,
    onToggleFullscreen,
    onEscape,
  ]);
}
