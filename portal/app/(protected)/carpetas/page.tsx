'use client';

import * as React from 'react';
import { CarpetaList } from '@/components/carpetas/CarpetaList';
import { CrearCarpetaModal } from '@/components/carpetas/CrearCarpetaModal';
import type { CarpetaRecord } from '@/lib/mockData';
import { useAuth } from '@/components/auth/RoleGuard';
import { FolderKanban, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CarpetasPage() {
  const { user } = useAuth();
  const [isCrearOpen, setIsCrearOpen] = React.useState(false);
  const [createdCarpetas, setCreatedCarpetas] = React.useState<CarpetaRecord[]>([]);

  const handleCreated = React.useCallback((nueva: CarpetaRecord) => {
    setCreatedCarpetas((prev) => [nueva, ...prev]);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('almar:carpeta-created', { detail: nueva }));
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FolderKanban className="h-6 w-6 text-[#0072BC]" />
            <span>Carpetas de Embarque &amp; Tráfico</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestión integral de expedientes de importación, exportación y transporte terrestre multimodal con escucha activa Gmail 24/7.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setIsCrearOpen(true)}
          data-testid="nueva-carpeta-btn"
          className="gap-2 bg-sky-600 hover:bg-sky-500 text-white text-xs cursor-pointer shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Nueva Carpeta</span>
        </Button>
      </div>

      {/* Carpetas Table & Filters */}
      <CarpetaList newlyCreated={createdCarpetas} />

      {/* Modal de Apertura Manual de Carpeta + Vinculación Automática Gmail */}
      <CrearCarpetaModal
        isOpen={isCrearOpen}
        onClose={() => setIsCrearOpen(false)}
        onCreated={handleCreated}
        defaultOperatorName={user?.nombre || 'Natali Hermoso'}
      />
    </div>
  );
}
