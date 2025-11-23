import React, { useRef, useState } from 'react';
import { ProjectDocument } from '../types';
import { readFileContent } from '../services/fileReaderService';

interface DocumentManagerProps {
  documents: ProjectDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<ProjectDocument[]>>;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({ documents, setDocuments }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    processFiles(files);
  };

  const processFiles = (files: FileList | null) => {
    if (!files) return;
    setFileError(null);

    Array.from(files).forEach(async (file) => {
      try {
        const content = await readFileContent(file);
        const newDoc: ProjectDocument = {
          id: Date.now() + Math.random(),
          name: file.name,
          content,
        };
        setDocuments(prevDocs => [...prevDocs, newDoc]);
      } catch (error: any) {
        console.error("Error reading file:", file.name, error);
        setFileError(error.message || `Failed to read ${file.name}.`);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  }

  const removeDocument = (id: number) => {
    setDocuments(docs => docs.filter(doc => doc.id !== id));
  };

  const getFileIcon = (name: string) => {
    if (name.endsWith('.pdf')) return (
      <div className="bg-red-100 dark:bg-red-900/30 p-2.5 rounded-xl text-red-600 dark:text-red-400">
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" /><path d="M3 8a2 2 0 012-2v10h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>
      </div>
    );
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) return (
      <div className="bg-green-100 dark:bg-green-900/30 p-2.5 rounded-xl text-green-600 dark:text-green-400">
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 5a1 1 0 011-1h6a1 1 0 011 1v5a1 1 0 01-1 1H4a1 1 0 01-1-1V9zm8-1a1 1 0 00-1 1v5a1 1 0 001 1h4a1 1 0 001-1V9a1 1 0 00-1-1h-4z" clipRule="evenodd" /></svg>
      </div>
    );
    return (
      <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-xl text-blue-600 dark:text-blue-400">
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xl font-display font-bold mb-6 text-slate-900 dark:text-white flex items-center">
        <span className="bg-gradient-to-br from-ampere-mint to-ampere-green text-white rounded-xl w-8 h-8 inline-flex items-center justify-center text-sm mr-4 shadow-lg shadow-ampere-mint/30 font-mono">2</span>
        Upload Documents
      </h3>

      <div
        className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-[2rem] transition-all duration-300 cursor-pointer group overflow-hidden flex-grow min-h-[220px]
            ${isDragging
            ? 'border-ampere-mint bg-ampere-mint/10 scale-[1.01] shadow-mint-lg border-t-4 border-b-4'
            : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 hover:border-ampere-mint/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-mint hover:border-t-4 hover:border-b-4 hover:border-l-2 hover:border-r-2'
          }
        `}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {/* Animated Background Pulse during Drag */}
        {isDragging && (
          <div className="absolute inset-0 animate-pulse bg-ampere-mint/10 z-0"></div>
        )}
        
        {/* Subtle hover gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-ampere-mint/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        {/* White Box Accent: Added shadow and ring to icon container */}
        <div className={`relative z-10 bg-white dark:bg-slate-700 p-4 rounded-2xl shadow-navy mb-4 transition-transform duration-500 ${isDragging ? 'scale-125 rotate-6 ring-4 ring-ampere-mint/20' : 'group-hover:scale-110 group-hover:-rotate-3 group-hover:ring-4 group-hover:ring-ampere-mint/10'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 transition-colors ${isDragging ? 'text-ampere-mint' : 'text-slate-600 dark:text-slate-400 group-hover:text-ampere-mint'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>
        <p className="relative z-10 text-base font-bold text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Drag & Drop project files</p>
        <p className="relative z-10 text-sm text-slate-600 dark:text-slate-300 mt-2 font-medium">or click to browse local drive</p>
        <div className="flex gap-2 mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
           <span>PDF</span>
           <span>•</span>
           <span>DOCX</span>
           <span>•</span>
           <span>XLSX</span>
           <span>•</span>
           <span>TXT</span>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept=".txt,.md,.pdf,.docx,.xlsx,.xls"
          className="hidden"
        />
      </div>

      {fileError && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800 animate-slide-up flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-sm text-red-600 dark:text-red-300 font-medium">{fileError}</p>
        </div>
      )}

      {documents.length > 0 && (
        <div className="mt-8 flex-grow">
          <div className="flex justify-between items-end mb-4 px-2">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-700 dark:text-slate-300">Project Context</h4>
            <span className="text-xs font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-600">{documents.length} files</span>
          </div>
          <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
            {documents.map((doc, idx) => (
              <div
                key={doc.id}
                className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-2xl border-x border-b border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 group hover:translate-x-1 hover:border-t-4 hover:border-t-ampere-mint animate-slide-up"
                style={{ animationDelay: `${idx * 0.1}s`, animationFillMode: 'both' }}
              >
                <div className="flex items-center overflow-hidden">
                  <div className="flex-shrink-0 mr-4">
                    {getFileIcon(doc.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{doc.name}</p>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-wider mt-0.5 font-medium">Ready for analysis</p>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeDocument(doc.id); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};