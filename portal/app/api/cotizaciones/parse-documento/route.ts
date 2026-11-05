import { NextResponse } from 'next/server';
import { parsearBufferDocumentoLogistico } from '@/lib/documento-parser-server';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      const defaultHeightRaw = formData.get('defaultPalletHeightM');
      const defaultPalletHeightM = defaultHeightRaw ? parseFloat(String(defaultHeightRaw)) || 1.2 : 1.2;

      if (!file || typeof (file as Blob).arrayBuffer !== 'function') {
        return NextResponse.json(
          { success: false, error: 'No se recibió un archivo válido en el formulario.' },
          { status: 400 }
        );
      }

      const uploadedFile = file as File;
      const arrayBuf = await uploadedFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);

      const parsed = parsearBufferDocumentoLogistico({
        fileName: uploadedFile.name || 'documento_cargado.bin',
        buffer,
        mimeType: uploadedFile.type || 'application/octet-stream',
        defaultPalletHeightM,
      });

      return NextResponse.json({
        success: true,
        ...parsed,
      });
    }

    const body = (await request.json()) as {
      fileName?: string;
      base64Content?: string;
      rawContent?: string;
      mimeType?: string;
      defaultPalletHeightM?: number;
    };

    const fileName = body.fileName || 'documento_cargado.txt';
    const buffer = body.base64Content
      ? Buffer.from(body.base64Content, 'base64')
      : Buffer.from(body.rawContent || '', 'utf8');

    const parsed = parsearBufferDocumentoLogistico({
      fileName,
      buffer,
      mimeType: body.mimeType || 'application/octet-stream',
      defaultPalletHeightM: body.defaultPalletHeightM ?? 1.2,
    });

    return NextResponse.json({
      success: true,
      ...parsed,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Error al procesar el documento.',
      },
      { status: 500 }
    );
  }
}
