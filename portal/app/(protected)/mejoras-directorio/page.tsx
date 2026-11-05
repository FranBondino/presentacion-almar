import { Metadata } from 'next';
import { DirectorioMejorasApprovalPanel } from '@/components/feedback/DirectorioMejorasApprovalPanel';

export const metadata: Metadata = {
  title: 'Panel de Mejoras & Aprobación Diaria (Directorio) | ALMAR Rosario',
  description:
    'Panel consolidado del Directorio (Juan Andrés Arloro, Alejandro Noacco y Vanesa Meggiolaro) para revisar, modificar y aprobar diariamente las mejoras propuestas por el equipo.',
};

export default function MejorasDirectorioPage() {
  return (
    <div className="space-y-5">
      <DirectorioMejorasApprovalPanel />
    </div>
  );
}
