import React, { useState } from 'react';
import { Project, ReportTemplate, ActiveAction, Finding } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ThinkingBar } from './ThinkingBar';
import { Spinner } from './Spinner';
import { FileUploadButton } from './FileUploadButton';

interface ProjectDashboardProps {
  project: Project;
  reportTemplates: ReportTemplate[];
  onRunAction: (action: string, payload?: any) => void;
  onReset: () => void;
  activeAction: ActiveAction;
  onProjectModeChange: (mode: string) => void;
  onDeleteFinding: (index: number) => void;
}

type TabType = 'findings' | 'sampling' | 'report' | 'responses';

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  project,
  reportTemplates,
  onRunAction,
  onReset,
  activeAction,
  onDeleteFinding
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('findings');
  const [correctionInput, setCorrectionInput] = useState('');
  
  // Report State
  const [reportType, setReportType] = useState<'validation' | 'verification'>('validation');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [reportAssessment, setReportAssessment] = useState('');
  const [reportOpinion, setReportOpinion] = useState('');

  // Response State
  const [responseType, setResponseType] = useState<'finding' | 'registry' | 'technical'>('finding');
  const [responseComment, setResponseComment] = useState('');

  // Sampling State
  const [samplingContext, setSamplingContext] = useState('');
  
  const activeTemplate = reportTemplates.find(t => t.id === `${reportType}_report`);

  const handleAction = (action: string, payload?: any) => {
    setCorrectionInput(''); // Reset correction on new action
    onRunAction(action, payload);
  };

  const renderFindingsTab = () => (
    <div className="space-y-8 animate-fade-in">
      {/* White Box Accent: Top border Mint, Navy shadow */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-navy border-t-4 border-t-ampere-mint border-x border-b border-slate-100 dark:border-slate-700/50 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h3 className="text-2xl font-display font-bold text-slate-800 dark:text-white mb-2">Audit Findings</h3>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl font-medium">
            AI will analyze your documents against <span className="text-ampere-mint font-bold">{project.selectedStandard.name}</span> to identify gaps, non-conformities, and areas requiring clarification.
          </p>
        </div>
        <button
          onClick={() => handleAction('generateFindings')}
          disabled={!!activeAction}
          className="flex-shrink-0 bg-ampere-navy dark:bg-white text-white dark:text-ampere-navy px-8 py-4 rounded-2xl font-bold text-sm shadow-navy hover:shadow-navy-lg hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center min-w-[200px] justify-center"
        >
          {activeAction === 'generateFindings' ? (
              <span className="flex items-center gap-2"><Spinner /> Processing...</span>
          ) : (
              <span className="flex items-center gap-2">
                  {/* Updated Icon: Clipboard Check */}
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                  Auto-Generate Findings
              </span>
          )}
        </button>
      </div>

      {activeAction === 'generateFindings' && <ThinkingBar context="findings" />}

      <div className="space-y-5">
        {project.findings.map((finding, idx) => (
          <div key={idx} className={`bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-navy hover:shadow-navy-lg transition-all duration-300 group relative border-b-4 ${
               finding.type === 'CAR' ? 'border-b-red-500' : finding.type === 'CL' ? 'border-b-amber-400' : 'border-b-blue-400'
             }`}>
             
             <button 
                onClick={() => onDeleteFinding(idx)}
                className="absolute top-6 right-6 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
             >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path></svg>
             </button>

             <div className="flex flex-col md:flex-row md:items-center mb-4 gap-4">
                <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                    finding.type === 'CAR' ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 ring-1 ring-red-100' :
                    finding.type === 'CL' ? 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 ring-1 ring-amber-100' :
                    'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 ring-1 ring-blue-100'
                }`}>
                    {finding.type === 'CAR' ? 'Corrective Action' : finding.type === 'CL' ? 'Clarification Request' : 'Forward Action'}
                </span>
                <span className="text-xs text-slate-500 font-mono bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 font-medium">Ref: {finding.reference}</span>
             </div>
             <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-sm md:text-base font-medium">{finding.description}</p>
          </div>
        ))}

        {project.findings.length === 0 && !activeAction && (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-800/20">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-6 text-slate-400 dark:text-slate-500">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                </div>
                <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-2">No Findings Yet</h4>
                <p className="text-slate-600 dark:text-slate-400 max-w-sm font-medium">Click the button above to have AI scan your documents and generate an initial list of findings.</p>
            </div>
        )}
      </div>

      {project.findings.length > 0 && (
        <div className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-[2rem] border-x border-b border-slate-200 dark:border-slate-700 shadow-navy border-t-4 border-t-ampere-navy">
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">Refine Findings</h4>
                <FileUploadButton 
                    onFileRead={(content) => setCorrectionInput(prev => prev ? prev + '\n\n' + content : content)}
                    className="text-xs font-bold text-ampere-blue hover:text-ampere-navy flex items-center gap-1 hover:underline"
                >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    Upload Feedback
                </FileUploadButton>
            </div>
            <div className="flex gap-3">
                <input 
                    type="text"
                    value={correctionInput}
                    onChange={(e) => setCorrectionInput(e.target.value)}
                    placeholder="E.g., 'Focus strictly on additionality gaps' or 'Ignore formatting issues'..."
                    className="flex-grow p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-ampere-mint outline-none transition-all placeholder-slate-500 dark:placeholder-slate-500 text-slate-900 dark:text-white"
                />
                <button 
                    onClick={() => handleAction('refineFindings', { correction: correctionInput })}
                    disabled={!!activeAction || !correctionInput.trim()}
                    className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors border border-slate-200 dark:border-slate-600"
                >
                    Refine
                </button>
            </div>
        </div>
      )}
    </div>
  );

  const renderSamplingTab = () => (
     <div className="space-y-8 animate-fade-in">
        {/* White Box Accent: Top border Mint, Navy shadow */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-navy border-t-4 border-t-ampere-mint border-x border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-2xl font-display font-bold text-slate-800 dark:text-white mb-6">Sampling Plan Generator</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Population Context</label>
                        <FileUploadButton 
                            onFileRead={(content) => setSamplingContext(prev => prev ? prev + '\n\n' + content : content)}
                            className="text-xs font-bold text-ampere-blue hover:text-ampere-navy flex items-center gap-1 hover:underline"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            Upload
                        </FileUploadButton>
                    </div>
                    <textarea 
                        value={samplingContext}
                        onChange={(e) => setSamplingContext(e.target.value)}
                        placeholder="Describe the population (e.g., '5000 household cookstoves installed in 2023 across 3 regions')..."
                        className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-ampere-mint outline-none h-40 resize-none placeholder-slate-500 text-slate-900 dark:text-white"
                    />
                </div>
                <div className="flex flex-col justify-end">
                     <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 mb-4">
                        <p className="text-xs text-slate-500 mb-2 font-mono font-bold">CONFIGURATION</p>
                        <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                             <span className="bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-600">Approach: Acceptance Sampling</span>
                             <span className="bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-600">Method: Simple Random</span>
                             <span className="bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-600">Confidence: 95%</span>
                        </div>
                     </div>
                     <button
                        onClick={() => handleAction('generateSamplingPlan', { 
                            criteria: { 
                                approach: 'acceptance', 
                                method: 'simple_random', 
                                populationSize: 'Unknown', 
                                aql: '0.5%', uql: '10%', producerRisk: '5%', consumerRisk: '10%',
                                additionalContext: samplingContext 
                            } 
                        })}
                        disabled={!!activeAction}
                        className="w-full bg-ampere-navy dark:bg-white text-white dark:text-ampere-navy px-6 py-4 rounded-xl font-bold text-sm hover:shadow-navy-lg transition-all duration-300 disabled:opacity-50"
                    >
                        {activeAction?.includes('Sampling') ? <span className="flex items-center justify-center gap-2"><Spinner /> Computing Plan...</span> : 'Generate CDM Sampling Plan'}
                    </button>
                </div>
            </div>
        </div>

        {activeAction?.includes('Sampling') && <ThinkingBar context="findings" />}

        {project.samplingPlan ? (
            <div className="bg-white dark:bg-slate-800 p-8 md:p-10 rounded-[2.5rem] shadow-navy border-x border-b border-slate-200 dark:border-slate-700 border-t-4 border-t-ampere-navy">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                     <MarkdownRenderer content={project.samplingPlan} />
                </div>
                
                <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-3">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Refine Plan</p>
                        <FileUploadButton 
                            onFileRead={(content) => setCorrectionInput(prev => prev ? prev + '\n\n' + content : content)}
                            className="text-xs font-bold text-ampere-blue hover:text-ampere-navy flex items-center gap-1 hover:underline"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            Upload Feedback
                        </FileUploadButton>
                    </div>
                    <div className="flex gap-3">
                         <input 
                            type="text" 
                            value={correctionInput}
                            onChange={(e) => setCorrectionInput(e.target.value)}
                            placeholder="E.g., 'Change confidence level to 90%' or 'Switch to Stratified Sampling'..."
                            className="flex-grow p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-ampere-mint outline-none placeholder-slate-500 text-slate-900 dark:text-white"
                        />
                        <button 
                            onClick={() => handleAction('refineSamplingPlan', { correction: correctionInput })}
                            disabled={!!activeAction || !correctionInput}
                            className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold hover:shadow-lg transition-all"
                        >
                            Refine
                        </button>
                    </div>
                </div>
            </div>
        ) : !activeAction && (
             <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-800/20 opacity-75">
                <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4 text-slate-400">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <p className="text-slate-600 font-medium">Sampling plan will appear here</p>
             </div>
        )}
     </div>
  );

  const renderReportTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
        <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-navy border-x border-b border-slate-100 dark:border-slate-700 sticky top-40 border-t-4 border-t-ampere-mint">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-ampere-mint/10 rounded-lg text-ampere-green dark:text-ampere-mint">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Report Writer</h3>
                </div>
                
                <div className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Report Type</label>
                        <div className="relative">
                            <select 
                                value={reportType} 
                                onChange={(e) => setReportType(e.target.value as any)}
                                className="w-full p-3 pl-4 pr-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm appearance-none outline-none focus:border-ampere-mint text-slate-900 dark:text-white font-medium shadow-sm"
                            >
                                <option value="validation">Validation Report</option>
                                <option value="verification">Verification Report</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500"><svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg></div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Section</label>
                        <div className="relative">
                            <select 
                                value={selectedSectionId} 
                                onChange={(e) => setSelectedSectionId(e.target.value)}
                                className="w-full p-3 pl-4 pr-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm appearance-none outline-none focus:border-ampere-mint text-slate-900 dark:text-white font-medium shadow-sm"
                            >
                                <option value="">-- Select Section --</option>
                                {activeTemplate?.sections.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500"><svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg></div>
                        </div>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Key Assessment Notes</label>
                            <FileUploadButton 
                                onFileRead={(content) => setReportAssessment(prev => prev ? prev + '\n\n' + content : content)}
                                className="text-xs font-bold text-ampere-blue hover:text-ampere-navy flex items-center gap-1 hover:underline"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                Upload
                            </FileUploadButton>
                        </div>
                        <textarea 
                            value={reportAssessment}
                            onChange={(e) => setReportAssessment(e.target.value)}
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm h-24 focus:ring-2 focus:ring-ampere-mint outline-none resize-none placeholder-slate-400 text-slate-900 dark:text-white"
                            placeholder="Points to include..."
                        />
                    </div>
                    
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Conclusion / Opinion</label>
                            <FileUploadButton 
                                onFileRead={(content) => setReportOpinion(prev => prev ? prev + '\n\n' + content : content)}
                                className="text-xs font-bold text-ampere-blue hover:text-ampere-navy flex items-center gap-1 hover:underline"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                Upload
                            </FileUploadButton>
                        </div>
                        <input 
                            type="text"
                            value={reportOpinion}
                            onChange={(e) => setReportOpinion(e.target.value)}
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-ampere-mint outline-none placeholder-slate-400 text-slate-900 dark:text-white"
                            placeholder="e.g. Positive Assurance"
                        />
                    </div>
                    
                    <button
                        onClick={() => {
                            const section = activeTemplate?.sections.find(s => s.id === selectedSectionId);
                            if(section) handleAction(`report-section-${section.id}`, { 
                                section, 
                                reportType, 
                                inputs: { assessment: reportAssessment, opinion: reportOpinion } 
                            });
                        }}
                        disabled={!selectedSectionId || !!activeAction}
                        className="w-full bg-ampere-navy dark:bg-white text-white dark:text-slate-900 px-4 py-4 rounded-xl font-bold text-sm hover:shadow-navy-lg transition-all duration-300 disabled:opacity-50 mt-2"
                    >
                        {activeAction?.startsWith('report') ? <span className="flex items-center justify-center gap-2"><Spinner /> Drafting...</span> : 'Draft Section'}
                    </button>
                </div>
            </div>
        </div>

        <div className="lg:col-span-8">
            {activeAction?.startsWith('report') && <ThinkingBar context="report" />}
            
            {/* Added PB-20 to ensure bottom spacing and corrected height issue */}
            {selectedSectionId && project.report[reportType][selectedSectionId] ? (
                <div className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-[2.5rem] shadow-navy border-x border-b border-slate-100 dark:border-slate-700 animate-slide-up border-t-4 border-t-ampere-navy min-h-[500px]">
                    <div className="flex justify-between items-start mb-8 pb-6 border-b border-slate-100 dark:border-slate-700">
                         <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white max-w-lg leading-tight">{activeTemplate?.sections.find(s => s.id === selectedSectionId)?.name}</h2>
                         <span className="text-[10px] font-bold uppercase tracking-widest bg-ampere-mint/10 text-ampere-green dark:text-ampere-mint px-3 py-1.5 rounded-lg">Draft Generated</span>
                    </div>
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                        <MarkdownRenderer content={project.report[reportType][selectedSectionId]} />
                    </div>
                </div>
            ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-[2.5rem] bg-slate-50/30 dark:bg-slate-800/20 text-slate-400 p-12">
                     <svg className="w-16 h-16 text-slate-400 dark:text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <p className="font-medium text-lg text-slate-600 dark:text-slate-300">Report Workspace</p>
                    <p className="text-sm opacity-70 mt-1 text-slate-500 dark:text-slate-400">Select a section on the left to begin drafting.</p>
                </div>
            )}
        </div>
    </div>
  );

  const renderResponsesTab = () => (
      <div className="max-w-4xl mx-auto animate-fade-in space-y-8">
           {/* White Box Accent: Top border Mint, Navy shadow */}
           <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-navy border-x border-b border-slate-100 dark:border-slate-700 border-t-4 border-t-ampere-mint">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Communication Assistant</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="col-span-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Recipient</label>
                        <div className="relative">
                            <select 
                                value={responseType} 
                                onChange={(e) => setResponseType(e.target.value as any)}
                                className="w-full p-3 pl-4 pr-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm appearance-none outline-none focus:border-ampere-mint text-slate-900 dark:text-white font-medium"
                            >
                                <option value="finding">Project Proponent</option>
                                <option value="registry">Registry Body</option>
                                <option value="technical">Technical Reviewer</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500"><svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg></div>
                        </div>
                    </div>
                    <div className="col-span-3">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Incoming Message / Query</label>
                            <FileUploadButton 
                                onFileRead={(content) => setResponseComment(prev => prev ? prev + '\n\n' + content : content)}
                                className="text-xs font-bold text-ampere-blue hover:text-ampere-navy flex items-center gap-1 hover:underline"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                Upload
                            </FileUploadButton>
                        </div>
                        <textarea 
                            value={responseComment}
                            onChange={(e) => setResponseComment(e.target.value)}
                            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm h-32 focus:ring-2 focus:ring-ampere-mint outline-none resize-none placeholder-slate-400 text-slate-900 dark:text-white"
                            placeholder="Paste the email, finding, or comment here..."
                        />
                    </div>
                </div>
                <div className="flex justify-end mt-6">
                    <button
                        onClick={() => handleAction(`response-${responseType}`, { type: responseType, comment: responseComment })}
                        disabled={!responseComment || !!activeAction}
                        className="bg-ampere-navy dark:bg-white text-white dark:text-ampere-navy px-8 py-4 rounded-xl font-bold text-sm shadow-navy hover:shadow-navy-lg hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 flex items-center"
                    >
                         {activeAction?.startsWith('response') ? <span className="flex items-center gap-2"><Spinner /> Drafting...</span> : 'Generate Professional Response'}
                    </button>
                </div>
           </div>

           {activeAction?.startsWith('response') && <ThinkingBar context="response" />}

           {Object.entries(project.responses).map(([comment, response], idx) => (
               <div key={idx} className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-navy border-x border-b border-slate-100 dark:border-slate-700 animate-slide-up border-t-4 border-t-ampere-navy">
                    <div className="mb-6 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-l-4 border-slate-300 dark:border-slate-600">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Incoming Message</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">"{comment}"</p>
                    </div>
                    <div className="pl-2">
                        <p className="text-[10px] font-bold text-ampere-mint uppercase tracking-widest mb-4">Drafted Response</p>
                        <MarkdownRenderer content={response} />
                    </div>
               </div>
           ))}
      </div>
  );

  return (
    <div className="space-y-8 pb-20">
        {/* Top Bar - Sticky - Added Mint shadow */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 md:px-8 rounded-[2rem] border border-white/20 dark:border-slate-700 shadow-mint sticky top-24 z-30 transition-all border-t-4 border-t-ampere-mint">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-ampere-navy dark:bg-white text-white dark:text-ampere-navy flex items-center justify-center font-bold text-lg shadow-md">
                    {project.selectedStandard.name.substring(0,1)}
                </div>
                <div>
                    <h2 className="text-lg font-display font-bold text-slate-800 dark:text-white leading-tight">{project.selectedStandard.name}</h2>
                    <div className="flex items-center text-xs text-slate-600 dark:text-slate-400 space-x-2 mt-0.5">
                        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] uppercase tracking-wide border border-slate-200 dark:border-slate-600">{project.projectMode}</span>
                        <span>•</span>
                        <span>{project.documents.length} Docs</span>
                    </div>
                </div>
            </div>
            <button onClick={onReset} className="mt-4 md:mt-0 text-slate-500 hover:text-red-500 text-xs font-bold uppercase tracking-wider px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                Exit Project
            </button>
        </div>

        {/* Segmented Control Navigation */}
        <div className="flex justify-center">
            <div className="bg-slate-200 dark:bg-slate-800/50 p-1.5 rounded-2xl inline-flex relative">
                {[
                    { id: 'findings', label: 'Findings' },
                    { id: 'sampling', label: 'Sampling' },
                    { id: 'report', label: 'Reports' },
                    { id: 'responses', label: 'Comms' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`relative z-10 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                            activeTab === tab.id 
                            ? 'bg-white dark:bg-slate-700 text-ampere-navy dark:text-white shadow-md shadow-slate-300/50 dark:shadow-none' 
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Content Area */}
        <div className="min-h-[60vh] container mx-auto max-w-6xl">
            {activeTab === 'findings' && renderFindingsTab()}
            {activeTab === 'sampling' && renderSamplingTab()}
            {activeTab === 'report' && renderReportTab()}
            {activeTab === 'responses' && renderResponsesTab()}
        </div>
    </div>
  );
};