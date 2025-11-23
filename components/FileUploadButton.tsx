import React, { useRef, useState } from 'react';
import { readFileContent } from '../services/fileReaderService';

interface FileUploadButtonProps {
    onFileRead: (content: string) => void;
    children: React.ReactNode;
    className?: string;
}

export const FileUploadButton: React.FC<FileUploadButtonProps> = ({ onFileRead, children, className }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);
    
    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setError(null);
        try {
            const content = await readFileContent(file);
            onFileRead(content);
        } catch (err: any) { 
            setError(err.message); 
        } finally {
            if (inputRef.current) { inputRef.current.value = ''; }
        }
    };

    return (
        <div>
            <input type="file" ref={inputRef} onChange={handleChange} className="hidden" accept=".txt,.md,.pdf,.docx" />
            <button type="button" onClick={() => inputRef.current?.click()} className={className}>{children}</button>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
};