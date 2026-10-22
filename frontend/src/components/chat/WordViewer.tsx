// components/WordViewer.tsx
'use client';

import { useEffect, useState } from 'react';
import mammoth from 'mammoth';

interface WordViewerProps {
  blobUrl: string;
  fileName?: string; // Made optional to prevent crashes
}

export default function WordViewer({ blobUrl, fileName = '' }: WordViewerProps) {
  const [htmlContent, setHtmlContent] = useState<string>('<p class="text-gray-500">Loading preview...</p>');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    async function loadWordDoc() {
      // Safely check filename extension if it exists
      const safeName = fileName ? fileName.toLowerCase() : '';
      
      if (safeName.endsWith('.doc')) {
        setHasError(true);
        setHtmlContent('<p class="text-amber-600 font-medium">Legacy .doc format cannot be previewed directly. Please download to view.</p>');
        return;
      }

      try {
        const response = await fetch(blobUrl);
        const arrayBuffer = await response.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setHtmlContent(result.value);
      } catch (error) {
        setHasError(true);
        setHtmlContent('<p class="text-red-500 font-medium">Failed to parse and load Word document preview. Make sure it is a valid .docx file.</p>');
      }
    }
    loadWordDoc();
  }, [blobUrl, fileName]);

  return (
    <div className="w-full h-full bg-white p-8 rounded border overflow-y-auto flex flex-col items-center justify-center">
      {hasError ? (
        <div className="text-center">
          <div className="mb-4 text-gray-700" dangerouslySetInnerHTML={{ __html: htmlContent }} />
          <a
            href={blobUrl}
            download={fileName || 'document.docx'}
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Download File
          </a>
        </div>
      ) : (
        <div 
          className="w-full h-full prose max-w-none text-left"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      )}
    </div>
  );
}