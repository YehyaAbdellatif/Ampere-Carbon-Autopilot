import React, { useMemo } from 'react';
import { Standard, StandardDocument } from '../types';

interface StandardSelectorProps {
  standards: Standard[];
  selectedStandard: Standard | null;
  onStandardSelect: (standard: Standard | null) => void;
  selectedOptionalDocs: StandardDocument[];
  onOptionalDocsSelect: (docs: StandardDocument[]) => void;
  mainGoverningRequirements: Standard;
  selectedGoverningDocs: StandardDocument[];
  onGoverningDocsSelect: (docs: StandardDocument[]) => void;
}

const OptionalDocsSelector: React.FC<{
  title: string;
  documents: StandardDocument[];
  selectedDocs: StandardDocument[];
  onToggle: (doc: StandardDocument) => void;
}> = ({ title, documents, selectedDocs, onToggle }) => {
  if (documents.length === 0) return null;
  return (
    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700/50 animate-fade-in">
      <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold mb-5 text-slate-700 dark:text-slate-300 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-ampere-mint"></span>
        {title}
      </h4>
      <div className="space-y-3">
        {documents.map(doc => {
          const isSelected = selectedDocs.some(d => d.id === doc.id);
          return (
            <label key={doc.id} className={`group flex items-start p-4 rounded-xl cursor-pointer transition-all duration-200 border relative overflow-hidden ${isSelected
                ? 'bg-ampere-mint/5 border-ampere-mint/50 shadow-sm ring-1 ring-ampere-mint/20'
                : 'bg-white dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 hover:border-ampere-mint/30 hover:shadow-sm'
              }`}>
              <div className="relative flex items-center justify-center mt-0.5">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(doc)}
                  className="peer sr-only"
                />
                <div className={`w-5 h-5 rounded-md border transition-all duration-300 flex items-center justify-center ${isSelected
                    ? 'bg-ampere-mint border-ampere-mint shadow-sm scale-100'
                    : 'border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-ampere-mint'
                  }`}>
                  <svg className={`w-3.5 h-3.5 text-white dark:text-ampere-navy transition-transform duration-200 ${isSelected ? 'scale-100' : 'scale-0'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
              </div>
              <div className="ml-3 flex-1">
                 <span className={`text-sm font-semibold transition-colors duration-200 block ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                    {doc.name}
                 </span>
                 {isSelected && <span className="text-xs text-ampere-green dark:text-ampere-mint font-medium block mt-1 animate-fade-in">Include in analysis context</span>}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export const StandardSelector: React.FC<StandardSelectorProps> = ({
  standards,
  selectedStandard,
  onStandardSelect,
  selectedOptionalDocs,
  onOptionalDocsSelect,
  mainGoverningRequirements,
  selectedGoverningDocs,
  onGoverningDocsSelect,
}) => {
  const optionalStandardDocs = useMemo(() => {
    return selectedStandard?.documents.filter(d => d.applicability === 'sometimes') || [];
  }, [selectedStandard]);

  const optionalGoverningDocs = useMemo(() => {
    return mainGoverningRequirements.documents.filter(d => d.applicability === 'sometimes');
  }, [mainGoverningRequirements]);

  const handleToggleOptionalDoc = (doc: StandardDocument, list: StandardDocument[], setter: (docs: StandardDocument[]) => void) => {
    const isSelected = list.some(d => d.id === doc.id);
    if (isSelected) {
      setter(list.filter(d => d.id !== doc.id));
    } else {
      setter([...list, doc]);
    }
  };

  const handleStandardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const standardId = e.target.value;
    const newSelectedStandard = standards.find(s => s.id === standardId) || null;
    onStandardSelect(newSelectedStandard);
    onOptionalDocsSelect([]); // Reset optional docs when standard changes
  };

  return (
    <div>
      <h3 className="text-xl font-display font-bold mb-8 text-slate-900 dark:text-white flex items-center">
        <span className="bg-gradient-to-br from-ampere-mint to-ampere-green text-white rounded-xl w-8 h-8 inline-flex items-center justify-center text-sm mr-4 shadow-lg shadow-ampere-mint/30 font-mono">1</span>
        Select Standard
      </h3>

      {/* White Box Accent: Mint bottom border, Navy shadow */}
      <div className="relative group z-20">
        <select
          value={selectedStandard?.id || ''}
          onChange={handleStandardChange}
          className="w-full p-5 pr-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-x border-t border-b-4 border-slate-300 dark:border-slate-700 hover:border-ampere-mint dark:hover:border-ampere-mint focus:border-ampere-mint focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-ampere-mint/10 outline-none text-slate-900 dark:text-white appearance-none cursor-pointer transition-all duration-300 font-semibold shadow-mint text-sm"
        >
          <option value="" className="text-slate-500">-- Select Certification Standard --</option>
          {standards.map(standard => (
            <option key={standard.id} value={standard.id} className="text-slate-900 font-medium">
              {standard.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-slate-600 dark:text-slate-300 group-hover:text-ampere-mint transition-colors duration-300">
           {/* Custom Chevron */}
           <div className="bg-white dark:bg-slate-700 rounded-lg p-1.5 shadow-sm border border-slate-200 dark:border-slate-600">
              <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
           </div>
        </div>
      </div>

      {selectedStandard && (
        /* White Box Accent: Top border Navy, Mint shadow */
        <div className="mt-6 p-5 bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-slate-800 dark:to-slate-800/50 rounded-2xl border-x border-b border-slate-200 dark:border-slate-700 animate-fade-in relative overflow-hidden border-t-4 border-t-ampere-navy shadow-mint">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
          <div className="flex items-start relative z-10">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg mr-3">
                 <svg className="w-5 h-5 text-blue-700 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
                 <h5 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wide mb-1">Standard Description</h5>
                 <p className="text-sm text-slate-800 dark:text-slate-300 leading-relaxed font-medium">{selectedStandard.description}</p>
            </div>
          </div>
        </div>
      )}

      <OptionalDocsSelector
        title="Governing Requirements"
        documents={optionalGoverningDocs}
        selectedDocs={selectedGoverningDocs}
        onToggle={(doc) => handleToggleOptionalDoc(doc, selectedGoverningDocs, onGoverningDocsSelect)}
      />

      {selectedStandard && (
        <OptionalDocsSelector
          title={`${selectedStandard.name} Requirements`}
          documents={optionalStandardDocs}
          selectedDocs={selectedOptionalDocs}
          onToggle={(doc) => handleToggleOptionalDoc(doc, selectedOptionalDocs, onOptionalDocsSelect)}
        />
      )}
    </div>
  );
};