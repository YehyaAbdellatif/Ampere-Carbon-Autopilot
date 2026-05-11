import React, { useState } from 'react';
import { Standard, StandardDocument, LibraryDocument, LibraryDocumentType } from '../types';
import { Modal } from './Modal';
import { FileUploadButton } from './FileUploadButton';
import { dbService, initDB } from '../services/db';

// Form for adding a new Standard
const StandardForm: React.FC<{
    onSave: (name: string, description: string) => void;
    onCancel: () => void;
}> = ({ onSave, onCancel }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(name, description);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Standard Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full p-2 bg-white dark:bg-slate-900 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-ampere-mint focus:outline-none" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} required className="block w-full p-2 bg-white dark:bg-slate-900 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-ampere-mint focus:outline-none" />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-ampere-mint text-ampere-navy font-semibold hover:bg-ampere-green">Create Standard</button>
            </div>
        </form>
    );
};


// Form for editing a Standard's documents
const StandardDocumentForm: React.FC<{
    document: Partial<StandardDocument>;
    onSave: (doc: StandardDocument) => void;
    onCancel: () => void;
}> = ({ document, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        id: document.id || `doc_${Date.now()}`,
        name: document.name || '',
        applicability: document.applicability || 'always',
        content: document.content || ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as StandardDocument);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Document Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full p-2 bg-white dark:bg-slate-900 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-ampere-mint focus:outline-none" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Applicability</label>
                <select name="applicability" value={formData.applicability} onChange={handleChange} className="mt-1 block w-full p-2 bg-white dark:bg-slate-900 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-ampere-mint focus:outline-none">
                    <option value="always">Always Applicable</option>
                    <option value="sometimes">Sometimes Applicable</option>
                </select>
            </div>
            <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Content / Requirements</label>
                    <FileUploadButton onFileRead={(content) => setFormData(fd => ({ ...fd, content }))} className="text-sm font-medium text-ampere-blue hover:underline">Upload from File</FileUploadButton>
                </div>
                <textarea name="content" value={formData.content} onChange={handleChange} rows={10} required className="block w-full p-2 bg-white dark:bg-slate-900 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-ampere-mint focus:outline-none font-mono text-sm" />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-ampere-mint text-ampere-navy font-semibold hover:bg-ampere-green">Save Document</button>
            </div>
        </form>
    );
};

// Form for editing a Library Document
const LibraryDocForm: React.FC<{
    doc: Partial<LibraryDocument>;
    docType: LibraryDocumentType;
    onSave: (doc: LibraryDocument) => void;
    onCancel: () => void;
}> = ({ doc, docType, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        id: doc.id || `lib_${Date.now()}`,
        name: doc.name || '',
        content: doc.content || '',
        type: doc.type || docType,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as LibraryDocument);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Document Name</label>
                <input type="text" name="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="mt-1 block w-full p-2 bg-white dark:bg-slate-900 rounded-md border border-slate-300 dark:border-slate-600" />
            </div>
            <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Document Content</label>
                    <FileUploadButton onFileRead={(content) => setFormData(fd => ({ ...fd, content }))} className="text-sm font-medium text-ampere-blue hover:underline">Upload from File</FileUploadButton>
                </div>
                <textarea name="content" value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} rows={15} required className="block w-full p-2 bg-white dark:bg-slate-900 rounded-md border border-slate-300 dark:border-slate-600 font-mono text-sm" />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-ampere-mint text-ampere-navy font-semibold">Save Document</button>
            </div>
        </form>
    );
}

// Main Dashboard Component
interface DeveloperModeDashboardProps {
    standards: Standard[];
    setStandards: React.Dispatch<React.SetStateAction<Standard[]>>;
    libraryDocuments: LibraryDocument[];
    setLibraryDocuments: React.Dispatch<React.SetStateAction<LibraryDocument[]>>;
    mainGoverningRequirements: Standard;
    setMainGoverningRequirements: React.Dispatch<React.SetStateAction<Standard>>;
}

const exampleCategories = [
    { type: 'finding', title: 'Findings Examples' },
    { type: 'report', title: 'Reports Examples' },
    { type: 'response_finding', title: 'Findings Response Examples' },
    { type: 'response_registry', title: 'Registry Response Examples' },
    { type: 'response_technical', title: 'Technical Response Examples' },
];


export const DeveloperModeDashboard: React.FC<DeveloperModeDashboardProps> = ({
    standards, setStandards,
    libraryDocuments, setLibraryDocuments,
    mainGoverningRequirements, setMainGoverningRequirements
}) => {
    const [modalContent, setModalContent] = useState<React.ReactNode | null>(null);

    // --- Document Management for any Standard object ---
    const handleSaveDocument = async (standardId: string, doc: StandardDocument) => {
        let updatedItem: Standard | null = null;

        if (standardId === mainGoverningRequirements.id) {
            const prev = mainGoverningRequirements;
            const docExists = prev.documents.some(d => d.id === doc.id);
            const documents = docExists ? prev.documents.map(d => d.id === doc.id ? doc : d) : [...prev.documents, doc];
            updatedItem = { ...prev, documents };
            
            setMainGoverningRequirements(updatedItem);
            await dbService.saveMainGoverning(updatedItem);
        } else {
            const prev = standards.find(s => s.id === standardId);
            if (prev) {
                const docExists = prev.documents.some(d => d.id === doc.id);
                const documents = docExists ? prev.documents.map(d => d.id === doc.id ? doc : d) : [...prev.documents, doc];
                updatedItem = { ...prev, documents };

                setStandards(prevs => prevs.map(s => s.id === standardId ? updatedItem! : s));
                await dbService.saveStandard(updatedItem);
            }
        }
        setModalContent(null);
    };

    const handleDeleteDocument = async (standardId: string, docId: string) => {
        if (standardId === mainGoverningRequirements.id) {
             const prev = mainGoverningRequirements;
             const updatedItem = { ...prev, documents: prev.documents.filter(d => d.id !== docId) };
             setMainGoverningRequirements(updatedItem);
             await dbService.saveMainGoverning(updatedItem);
        } else {
            const prev = standards.find(s => s.id === standardId);
            if (prev) {
                 const updatedItem = { ...prev, documents: prev.documents.filter(d => d.id !== docId) };
                 setStandards(prevs => prevs.map(s => s.id === standardId ? updatedItem : s));
                 await dbService.saveStandard(updatedItem);
            }
        }
    };
    const openDocumentModal = (standardId: string, doc?: StandardDocument) => {
        setModalContent(<StandardDocumentForm document={doc || {}} onSave={(newDoc) => handleSaveDocument(standardId, newDoc)} onCancel={() => setModalContent(null)} />);
    };

    // --- Standard Management ---
    const handleAddNewStandard = async (name: string, description: string) => {
        const newStandard: Standard = {
            id: `std_${Date.now()}`,
            name,
            description,
            documents: []
        };

        setStandards(prev => [...prev, newStandard]);
        await dbService.saveStandard(newStandard);

        setModalContent(null);
    }
    const openNewStandardModal = () => {
        setModalContent(<StandardForm onSave={handleAddNewStandard} onCancel={() => setModalContent(null)} />);
    };
    const handleDeleteStandard = async (standardId: string) => {
        if (window.confirm('Are you sure you want to delete this entire standard?')) {
            setStandards(standards.filter(s => s.id !== standardId));
            // Manually delete using IDB since dbService didn't expose deleteStandard in the prompt code
            const db = await initDB();
            await db.delete('standards', standardId);
        }
    };

    // --- Library Document Management ---
    const handleSaveLibraryDoc = async (doc: LibraryDocument) => {
        const exists = libraryDocuments.some(d => d.id === doc.id);
        if (exists) {
            setLibraryDocuments(libraryDocuments.map(d => d.id === doc.id ? doc : d));
        } else {
            setLibraryDocuments([...libraryDocuments, doc]);
        }
        await dbService.saveLibraryDoc(doc);
        setModalContent(null);
    };
    const handleDeleteLibraryDoc = async (docId: string) => {
        if (window.confirm('Delete this example document?')) {
            setLibraryDocuments(libraryDocuments.filter(d => d.id !== docId));
            await dbService.deleteLibraryDoc(docId);
        }
    };
    const openLibraryDocModal = (docType: LibraryDocumentType, doc?: LibraryDocument) => {
        setModalContent(<LibraryDocForm doc={doc || {}} docType={docType} onSave={handleSaveLibraryDoc} onCancel={() => setModalContent(null)} />);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-12">

            {/* Knowledge Base Section (NEW) */}
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 shadow-navy border-t-4 border-t-ampere-mint relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-ampere-mint/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Global Knowledge Base & Context</h2>
                            <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl font-light">
                                Upload "Source of Truth" documents here. These will be used as context for <strong>every</strong> AI generation task.
                                Use this for your company Style Guides, standard methodologies, or generic "Gold Standard" report templates.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                        {libraryDocuments.filter(d => d.type === 'knowledge_base').map(doc => (
                            <div key={doc.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border-x border-b border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-mint hover:border-t-4 hover:border-t-ampere-mint transition-all duration-300 group relative overflow-hidden">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate pr-2">{doc.name}</h3>
                                    <button onClick={() => handleDeleteLibraryDoc(doc.id)} className="text-slate-300 hover:text-red-500 transition-colors font-bold">&times;</button>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 line-clamp-3 font-mono bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 p-2 rounded-lg">{doc.content}</p>
                                <button onClick={() => openLibraryDocModal('knowledge_base', doc)} className="mt-4 text-[10px] font-bold text-ampere-blue hover:text-ampere-navy dark:hover:text-ampere-mint uppercase tracking-wider flex items-center">
                                    Edit Document <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                                </button>
                            </div>
                        ))}

                        <button onClick={() => openLibraryDocModal('knowledge_base')} className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-ampere-mint dark:hover:border-ampere-mint bg-slate-50/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 text-slate-400 hover:text-ampere-mint rounded-2xl p-4 flex flex-col items-center justify-center transition-all duration-300 min-h-[150px] group">
                            <span className="text-3xl mb-2 transition-transform group-hover:scale-110">+</span>
                            <span className="font-bold text-sm">Add Knowledge Base Doc</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Governing Requirements Section */}
            <div>
                <h2 className="text-2xl font-display font-bold mb-4 text-slate-900 dark:text-white">Manage Main Governing Requirements</h2>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-navy border-t-4 border-t-ampere-mint">
                    <p className="font-bold text-lg text-slate-800 dark:text-slate-100">{mainGoverningRequirements.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{mainGoverningRequirements.description}</p>
                    <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-3 space-y-2">
                        {mainGoverningRequirements.documents.map(doc => (
                            <div key={doc.id} className="flex justify-between items-center text-sm p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                <div>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{doc.name}</span>
                                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${doc.applicability === 'always' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'}`}>{doc.applicability}</span>
                                </div>
                                <div className="space-x-2">
                                    <button onClick={() => openDocumentModal(mainGoverningRequirements.id, doc)} className="font-medium text-ampere-blue hover:underline">Edit</button>
                                    <button onClick={() => handleDeleteDocument(mainGoverningRequirements.id, doc.id)} className="font-medium text-red-600 dark:text-red-400 hover:underline">Del</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => openDocumentModal(mainGoverningRequirements.id)} className="w-full mt-4 py-2 text-sm bg-ampere-mint/10 text-ampere-green dark:text-ampere-mint font-bold uppercase tracking-wider rounded-xl hover:bg-ampere-mint/20 border border-ampere-mint/20 transition-colors">+ Add Document</button>
                </div>
            </div>

            {/* Standards Section */}
            <div>
                <h2 className="text-2xl font-display font-bold mb-4 text-slate-900 dark:text-white">Manage Standards Library</h2>
                <div className="space-y-6">
                    {standards.map(standard => (
                        <div key={standard.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-navy border-t-4 border-t-ampere-navy">
                            <div className="flex justify-between items-center">
                                <p className="font-bold text-lg text-slate-800 dark:text-slate-100">{standard.name}</p>
                                <button onClick={() => handleDeleteStandard(standard.id)} className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline">Delete Standard</button>
                            </div>
                            <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-3 space-y-2">
                                {standard.documents.map(doc => (
                                    <div key={doc.id} className="flex justify-between items-center text-sm p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                        <div>
                                            <span className="font-semibold text-slate-700 dark:text-slate-200">{doc.name}</span>
                                            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${doc.applicability === 'always' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'}`}>{doc.applicability}</span>
                                        </div>
                                        <div className="space-x-2">
                                            <button onClick={() => openDocumentModal(standard.id, doc)} className="font-medium text-ampere-blue hover:underline">Edit</button>
                                            <button onClick={() => handleDeleteDocument(standard.id, doc.id)} className="font-medium text-red-600 dark:text-red-400 hover:underline">Del</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => openDocumentModal(standard.id)} className="w-full mt-4 py-2 text-sm bg-ampere-navy/5 dark:bg-white/5 text-ampere-navy dark:text-white font-bold uppercase tracking-wider rounded-xl hover:bg-ampere-navy/10 dark:hover:bg-white/10 border border-ampere-navy/10 dark:border-white/10 transition-colors">+ Add Document</button>
                        </div>
                    ))}
                    <button onClick={openNewStandardModal} className="w-full py-4 text-sm bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider rounded-2xl hover:bg-white dark:hover:bg-slate-700 hover:border-ampere-navy hover:text-ampere-navy transition-all shadow-sm">+ Add New Standard</button>
                </div>
            </div>

            {/* Examples Library Section */}
            <div>
                {/* Updated Text Color for better readability */}
                <h2 className="text-2xl font-display font-bold mb-4 text-slate-900 dark:text-white">Manage Few-Shot Examples</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-6 font-medium">Add "Best in Class" examples for specific outputs. The AI will use these to learn the expected format for specific tasks.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    {exampleCategories.map(({ type, title }) => (
                        <div key={type} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-navy flex flex-col border-t-4 border-t-ampere-mint">
                            <h3 className="text-sm font-bold mb-4 text-slate-800 dark:text-slate-100 uppercase tracking-wide h-10">{title}</h3>
                            <div className="space-y-3 flex-grow">
                                {libraryDocuments.filter(d => d.type === type).map(doc => (
                                    <div key={doc.id} className="text-sm p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                        <p className="font-semibold text-slate-700 dark:text-slate-200 truncate">{doc.name}</p>
                                        <div className="space-x-2 mt-2 flex justify-end">
                                            <button onClick={() => openLibraryDocModal(type as LibraryDocumentType, doc)} className="text-xs font-medium text-ampere-blue hover:underline">Edit</button>
                                            <button onClick={() => handleDeleteLibraryDoc(doc.id)} className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline">Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => openLibraryDocModal(type as LibraryDocumentType)} className="w-full mt-4 py-2 text-xs bg-ampere-mint/10 text-ampere-green dark:text-ampere-mint font-bold uppercase tracking-wider rounded-lg hover:bg-ampere-mint/20 border border-ampere-mint/20 transition-colors">+ Add Example</button>
                        </div>
                    ))}
                </div>
            </div>


            <Modal isOpen={!!modalContent} onClose={() => setModalContent(null)} title="Developer Mode">
                {modalContent}
            </Modal>
        </div>
    );
};