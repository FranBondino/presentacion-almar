import { usePresentationState } from './hooks/usePresentationState';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { SPEAKER_NOTES } from './data/speakerNotes';
import { PresentationShell } from './components/layout/PresentationShell';
import { SpeakerNotesDrawer } from './components/layout/SpeakerNotesDrawer';
import { ThumbnailGridModal } from './components/layout/ThumbnailGridModal';
import { LightboxModal } from './components/layout/LightboxModal';

// Slide Components
import { Slide01Cover } from './components/slides/Slide01Cover';
import { Slide02Diagnosis } from './components/slides/Slide02Diagnosis';
import { Slide03SolutionOverview } from './components/slides/Slide03SolutionOverview';
import { Slide04Pipeline } from './components/slides/Slide04Pipeline';
import { Slide05CarrierValidity } from './components/slides/Slide05CarrierValidity';
import { Slide06MarginCalculator } from './components/slides/Slide06MarginCalculator';
import { Slide07SmartFollowUp } from './components/slides/Slide07SmartFollowUp';
import { Slide08KanbanDual } from './components/slides/Slide08KanbanDual';
import { Slide09CaseBUFF } from './components/slides/Slide09CaseBUFF';
import { Slide10CaseMulticurrency } from './components/slides/Slide10CaseMulticurrency';
import { Slide11CaseSancor } from './components/slides/Slide11CaseSancor';
import { Slide12CaseMarginAlert } from './components/slides/Slide12CaseMarginAlert';
import { Slide13CaseNetTrade } from './components/slides/Slide13CaseNetTrade';
import { Slide14LiveDemo } from './components/slides/Slide14LiveDemo';
import { Slide15TriageCopilot } from './components/slides/Slide15TriageCopilot';
import { Slide16ResolutionMatrix } from './components/slides/Slide16ResolutionMatrix';
import { Slide17ArchitectureZDR } from './components/slides/Slide17ArchitectureZDR';
import { Slide18RoadmapNextSteps } from './components/slides/Slide18RoadmapNextSteps';

export function App() {
  const {
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
  } = usePresentationState(18);

  // Bind global keyboard listeners
  useKeyboardNavigation({
    onNext: nextSlide,
    onPrev: prevSlide,
    onFirst: () => goToSlide(1),
    onLast: () => goToSlide(18),
    onToggleGrid: toggleGrid,
    onToggleNotes: toggleNotes,
    onToggleFullscreen: toggleFullscreen,
    onEscape: () => {
      if (state.lightboxImage) {
        closeLightbox();
      } else if (state.isGridOpen || state.isNotesOpen) {
        closeAllModals();
      }
    },
  });

  const renderSlide = () => {
    const props = {
      slideIndex: state.currentSlide,
      isActive: true,
      onOpenLightbox: openLightbox,
    };

    switch (state.currentSlide) {
      case 1:
        return <Slide01Cover {...props} />;
      case 2:
        return <Slide02Diagnosis {...props} />;
      case 3:
        return <Slide03SolutionOverview {...props} />;
      case 4:
        return <Slide04Pipeline {...props} />;
      case 5:
        return <Slide05CarrierValidity {...props} />;
      case 6:
        return <Slide06MarginCalculator {...props} />;
      case 7:
        return <Slide07SmartFollowUp {...props} />;
      case 8:
        return <Slide08KanbanDual {...props} />;
      case 9:
        return <Slide09CaseBUFF {...props} />;
      case 10:
        return <Slide10CaseMulticurrency {...props} />;
      case 11:
        return <Slide11CaseSancor {...props} />;
      case 12:
        return <Slide12CaseMarginAlert {...props} />;
      case 13:
        return <Slide13CaseNetTrade {...props} />;
      case 14:
        return <Slide14LiveDemo {...props} />;
      case 15:
        return <Slide15TriageCopilot {...props} />;
      case 16:
        return <Slide16ResolutionMatrix {...props} />;
      case 17:
        return <Slide17ArchitectureZDR {...props} />;
      case 18:
        return <Slide18RoadmapNextSteps {...props} />;
      default:
        return <Slide01Cover {...props} />;
    }
  };

  return (
    <>
      <PresentationShell
        currentSlide={state.currentSlide}
        totalSlides={18}
        isNotesOpen={state.isNotesOpen}
        isFullscreen={state.isFullscreen}
        onPrev={prevSlide}
        onNext={nextSlide}
        onToggleGrid={toggleGrid}
        onToggleNotes={toggleNotes}
        onToggleFullscreen={toggleFullscreen}
      >
        {renderSlide()}
      </PresentationShell>

      {/* Speaker Notes Drawer (Toggled by N) */}
      <SpeakerNotesDrawer
        isOpen={state.isNotesOpen}
        onClose={toggleNotes}
        notes={SPEAKER_NOTES[state.currentSlide]}
        slideNumber={state.currentSlide}
      />

      {/* Slide Thumbnail Grid Modal (Toggled by O / M) */}
      <ThumbnailGridModal
        isOpen={state.isGridOpen}
        currentSlide={state.currentSlide}
        onClose={toggleGrid}
        onSelectSlide={goToSlide}
      />

      {/* Lightbox HD Viewer */}
      <LightboxModal
        image={state.lightboxImage}
        onClose={closeLightbox}
      />
    </>
  );
}

export default App;
