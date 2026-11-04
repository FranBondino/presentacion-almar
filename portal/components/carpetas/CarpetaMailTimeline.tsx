'use client';

import * as React from 'react';
import type { CarpetaRecord } from '@/lib/mockData';
import { formatDateTime } from '@/lib/utils';
import {
  Mail,
  Users,
  FileText,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Sparkles,
  BadgePercent,
  ArrowDownUp,
} from 'lucide-react';
import { ALMAR_STAFF_DIRECTORY, extractActorsFromFolder } from '@/lib/actors';
import type { MailMessage, ActorProfile, MailAttachmentInfo, MailAiClassification } from '@/lib/mockData';
import { TablePagination } from '@/components/ui/TablePagination';

export { ALMAR_STAFF_DIRECTORY, extractActorsFromFolder };
export type { MailMessage, ActorProfile, MailAttachmentInfo, MailAiClassification };

// Preserved as empty records for type compatibility with external references
export const CARPETA_ACTORS_MAP: Record<string, ActorProfile[]> = {};
export const CARPETA_MAILS_MAP: Record<string, MailMessage[]> = {};

export interface CarpetaMailTimelineProps {
  carpeta: CarpetaRecord;
  onOpenPdfModal?: (url: string, filename: string) => void;
}

export function CarpetaMailTimeline({
  carpeta,
}: CarpetaMailTimelineProps) {
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');
  const [mailsPage, setMailsPage] = React.useState<number>(1);
  const [mailsPageSize, setMailsPageSize] = React.useState<number>(8);

  const dynamicMails = carpeta.evidencia_gmail;
  const mails: MailMessage[] = Array.isArray(dynamicMails) ? dynamicMails : [];

  // Dynamic extraction of actors from folder and email correspondence
  const actors: ActorProfile[] = React.useMemo(() => {
    return extractActorsFromFolder(carpeta, mails);
  }, [carpeta, mails]);

  const sortedMails = React.useMemo(() => {
    return [...mails].sort((a, b) => {
      const timeA = new Date(a.date).getTime() || 0;
      const timeB = new Date(b.date).getTime() || 0;
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });
  }, [mails, sortOrder]);

  React.useEffect(() => {
    setMailsPage(1);
  }, [carpeta.id, sortOrder]);

  const paginatedMails = React.useMemo(() => {
    const start = (mailsPage - 1) * mailsPageSize;
    return sortedMails.slice(start, start + mailsPageSize);
  }, [sortedMails, mailsPage, mailsPageSize]);

  return (
    <div className="space-y-6">
      {/* 1. Map of Active Actors Involved in this Folder */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#0072BC]" />
            <h3 className="text-sm font-bold text-slate-900">
              Actores &amp; Intervinientes en el Expediente ({actors.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Trazabilidad Comercial y Operativa
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {actors.map((actor, idx) => {
            const isOperator = actor.tipo === 'OPERADOR';
            const isCarrier = actor.tipo === 'PROVEEDOR';
            const isFinance = actor.tipo === 'FINANZAS';
            const isComercial = actor.tipo === 'COMERCIAL';
            const isAdmin = actor.tipo === 'ADMIN';

            return (
              <div
                key={`${actor.email}-${idx}`}
                className={`p-3.5 rounded-lg border transition-all ${
                  isAdmin
                    ? 'bg-purple-50/70 border-purple-200 shadow-2xs'
                    : isComercial
                    ? 'bg-amber-50/70 border-amber-200 shadow-2xs'
                    : isOperator
                    ? 'bg-sky-50/60 border-sky-200'
                    : isCarrier
                    ? 'bg-slate-50 border-slate-200'
                    : isFinance
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isAdmin
                          ? 'bg-purple-700 text-white'
                          : isComercial
                          ? 'bg-amber-600 text-white'
                          : isOperator
                          ? 'bg-[#0072BC] text-white'
                          : isCarrier
                          ? 'bg-slate-700 text-white'
                          : isFinance
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-600 text-white'
                      }`}
                    >
                      {actor.rol}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 mt-1">
                      {actor.nombre}
                    </h4>
                    <p className="text-[11px] text-slate-600 font-medium">
                      {actor.entidad}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono truncate" title={actor.email}>
                      {actor.email}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Timeline of Gmail Email Chains & AI Extracted Proofs */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-[#0072BC]" />
            <h3 className="text-sm font-bold text-slate-900">
              Historial de Correos Electrónicos &amp; Documentos Recibidos ({mails.length})
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-300 transition-colors cursor-pointer"
              title="Alternar orden temporal"
            >
              <ArrowDownUp className="h-3.5 w-3.5 text-slate-600" />
              <span>{sortOrder === 'desc' ? 'Más recientes primero' : 'Cronológico (Inicio a fin)'}</span>
            </button>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 font-medium">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span>Escucha 24/7 Google Workspace</span>
            </div>
          </div>
        </div>

        {sortedMails.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <Mail className="h-6 w-6 text-slate-400 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Sin historial de correos sincronizado</p>
            <p className="mt-1 text-slate-500">
              No se han recibido o asociado correos en las casillas corporativas con el asunto {carpeta.numero_carpeta} aún.
            </p>
          </div>
        ) : (
          <>
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {paginatedMails.map((mail) => (
            <div key={mail.id} className="relative group">
              {/* Timeline marker bullet */}
              <div
                className={`absolute -left-6 top-2 h-3.5 w-3.5 rounded-full border-2 border-white shadow-xs ${
                  mail.esEtapaComercial ? 'bg-amber-500 ring-2 ring-amber-200' : 'bg-[#0072BC]'
                }`}
              />

              <div
                className={`rounded-lg border p-4 transition-all space-y-3 ${
                  mail.esEtapaComercial
                    ? 'border-amber-200 bg-gradient-to-r from-amber-50/50 via-white to-amber-50/20 hover:border-amber-300'
                    : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-white'
                }`}
              >
                {/* Email Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-200">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-slate-900">
                        {(mail.fromName || '')
                          .replace(/^["']+|["']+$/g, '')
                          .replace(/['"]?\s+via\s+(?:Importaci[oó]n|Exportaci[oó]n|Pricing|Comercial|Terrestres)/i, ' (vía Grupo COMEX)')}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {`<${(mail.from || '').match(/<([^>]+)>/)?.[1] || mail.from}>`}
                      </span>
                      {mail.esEtapaComercial && (
                        <>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-100 text-amber-900 border border-amber-300">
                            <BadgePercent className="h-3 w-3 text-amber-700" />
                            <span>
                              Etapa Comercial{' '}
                              {mail.codigoCotizacion || (mail as { cotizacionCodigo?: string }).cotizacionCodigo
                                ? `[${mail.codigoCotizacion || (mail as { cotizacionCodigo?: string }).cotizacionCodigo}]`
                                : ''}
                            </span>
                          </span>
                          {(mail.codigoCotizacion || (mail as { cotizacionCodigo?: string }).cotizacionCodigo) && (
                            <a
                              href={`/cotizaciones?search=${encodeURIComponent(
                                mail.codigoCotizacion || (mail as { cotizacionCodigo?: string }).cotizacionCodigo || ''
                              )}`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-white text-[#0072BC] border border-sky-200 hover:bg-sky-50 transition-colors"
                            >
                              <span>Ver en Preventa</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      <span>Para: </span>
                      <span className="font-mono text-slate-700">
                        {mail.to.join(', ')}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 font-mono bg-white px-2 py-1 rounded border border-slate-200 shrink-0">
                    {formatDateTime(mail.date)}
                  </span>
                </div>

                {/* Email Subject & Excerpt */}
                <div>
                  <h4 className={`text-xs font-bold mb-1 ${mail.esEtapaComercial ? 'text-amber-900' : 'text-[#0072BC]'}`}>
                    {mail.subject}
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-md border border-slate-200">
                    {mail.bodyExcerpt}
                  </p>
                </div>

                {/* AI Detection Summary Pill */}
                {mail.aiClassification && (
                  <div className="p-2.5 rounded-md bg-sky-50/70 border border-sky-200 text-xs flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#0072BC] flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Extracción IA:</span>
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {mail.aiClassification.moneda} {mail.aiClassification.montoExtraido}
                      </span>
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-white text-[#0072BC] border border-sky-200 font-mono">
                        Gasto [{mail.aiClassification.tipoGasto}]
                      </span>
                    </div>

                    {mail.aiClassification.desvioDetectado ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-amber-600" />
                        <span>Desvío de Tarifa Flagged</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        <span>Dentro del Presupuesto</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Attached Real PDFs */}
                {mail.attachments && mail.attachments.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                      <Paperclip className="h-3.5 w-3.5 text-slate-500" />
                      <span>Comprobantes Adjuntos ({mail.attachments.length}):</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {mail.attachments.map((att, attIdx) => {
                        const attName = att.name || (att as { filename?: string }).filename || 'documento.pdf';
                        const attUrl = att.url || `/api/documentos/preview?file=${encodeURIComponent(attName)}`;
                        const attTipo = att.tipo || 'Documento Adjunto';
                        const attSize = typeof att.size === 'number' ? `${(att.size / 1024).toFixed(1)} KB` : att.size || 'PDF';
                        return (
                          <div
                            key={`${attName}-${attIdx}`}
                            className="flex items-center justify-between p-2 rounded-md bg-white border border-slate-200 hover:border-sky-300 transition-colors shadow-2xs"
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <FileText className="h-4 w-4 text-[#0072BC] shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-900 truncate font-mono" title={attName}>
                                  {attName}
                                </p>
                                <p className="text-[10px] text-slate-500">
                                  {attTipo} • {attSize}
                                </p>
                              </div>
                            </div>

                            <a
                              href={
                                attUrl.startsWith('/api/comprobantes/pdf?id=')
                                  ? attUrl.replace('/api/comprobantes/pdf?id=', '/api/comprobantes/') + '/pdf'
                                  : attUrl
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-[#0072BC] rounded text-[11px] font-semibold flex items-center gap-1 transition-colors shrink-0 cursor-pointer border border-sky-200"
                              title="Ver archivo PDF original"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>Ver PDF</span>
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          </div>
          <TablePagination
            currentPage={mailsPage}
            totalItems={sortedMails.length}
            pageSize={mailsPageSize}
            pageSizeOptions={[8, 15, 30]}
            itemLabel="correos"
            onPageChange={setMailsPage}
            onPageSizeChange={setMailsPageSize}
            variant="inline"
            compact={true}
            testId="carpeta-mails-pagination"
          />
          </>
        )}
      </div>
    </div>
  );
}
