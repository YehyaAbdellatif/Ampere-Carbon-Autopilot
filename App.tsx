
import React, { useState, useCallback, useEffect } from 'react';
import { Standard, ProjectDocument, Project, StandardDocument, ReportTemplate, LibraryDocument, ActiveAction, Finding } from './types';
import { INITIAL_MAIN_GOVERNING_REQUIREMENTS } from './src/data/defaults';
import { callApiStream } from './services/geminiService';
import { dataService } from './services/dataService';
import { Header } from './components/Header';
import { StandardSelector } from './components/StandardSelector';
import { DocumentManager } from './components/DocumentManager';
import { ProjectDashboard } from './components/ProjectDashboard';
import { DeveloperModeDashboard } from './components/DeveloperModeDashboard';
import { Toast } from './components/Toast';


const App: React.FC = () => {
  const [project, setProject] = useState<Project | null>(null);
  const [selectedStandard, setSelectedStandard] = useState<Standard | null>(null);
  const [selectedOptionalDocs, setSelectedOptionalDocs] = useState<StandardDocument[]>([]);
  const [selectedGoverningDocs, setSelectedGoverningDocs] = useState<StandardDocument[]>([]);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [projectMode, setProjectMode] = useState<string>('project_validation');
  const [activeAction, setActiveAction] = useState<ActiveAction>(null);
  const [error, setError] = useState<string | null>(null);

  // Developer Mode State
  const [isDeveloperMode, setIsDeveloperMode] = useState<boolean>(false);

  const [mainGoverningRequirements, setMainGoverningRequirements] = useState<Standard>(INITIAL_MAIN_GOVERNING_REQUIREMENTS);
  const [standards, setStandards] = useState<Standard[]>([]);
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [libraryDocuments, setLibraryDocuments] = useState<LibraryDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const fetchedStandards = await dataService.getStandards();
        setStandards(fetchedStandards);

        const fetchedLibDocs = await dataService.getLibraryDocuments();
        setLibraryDocuments(fetchedLibDocs);

        const fetchedGov = await dataService.getMainGoverningRequirements();
        setMainGoverningRequirements(fetchedGov);

        const fetchedTemplates = await dataService.getReportTemplates();
        setReportTemplates(fetchedTemplates);

      } catch (e) {
        console.error("Failed to load data", e);
        setError("Failed to load application data. Using defaults.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Logic to enforce VVM manuals based on audit scope
  const handleProjectModeChange = (mode: string, isInitialSetup: boolean = false) => {
    if (!isInitialSetup) {
      setProject(p => p ? { ...p, projectMode: mode } : null);
    }
    setProjectMode(mode);

    // Identify if this is a Project Level or Organizational Level audit
    const isProjectLevel = mode === 'project_validation' || mode === 'project_verification';
    const isOrgLevel = mode === 'ghg_inventory_verification' || mode === 'corsia_verification';

    const vvm001 = mainGoverningRequirements.documents.find(d => d.id === 'gov_doc_vvm_001');
    const vvm002 = mainGoverningRequirements.documents.find(d => d.id === 'gov_doc_vvm_002');

    // Start with current selection but remove any existing VVMs to prevent duplicates/conflicts
    let newGoverningDocs = selectedGoverningDocs.filter(d => d.id !== 'gov_doc_vvm_001' && d.id !== 'gov_doc_vvm_002');

    if (isProjectLevel && vvm001) {
      newGoverningDocs.push(vvm001);
    } else if (isOrgLevel && vvm002) {
      newGoverningDocs.push(vvm002);
    }

    setSelectedGoverningDocs(newGoverningDocs);

    if (project && !isInitialSetup) {
      setProject(p => p ? { ...p, selectedGoverningDocuments: newGoverningDocs } : null);
    }
  };

  // Initialize correct manual on mount or when requirements load
  useEffect(() => {
    handleProjectModeChange(projectMode, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainGoverningRequirements]);


  const handleStartProject = () => {
    if (!selectedStandard) {
      setError('Please select a standard to begin.');
      return;
    }
    if (documents.length === 0) {
      setError('Please upload at least one project document.');
      return;
    }
    setError(null);
    setProject({
      id: `proj_${Date.now()}`,
      selectedStandard,
      selectedOptionalDocuments: selectedOptionalDocs,
      selectedGoverningDocuments: selectedGoverningDocs,
      documents,
      findings: [],
      samplingPlan: '',
      report: {
        validation: {},
        verification: {},
        ghg_inventory: {},
        corsia: {}
      },
      responses: {},
      projectMode,
    });
  };


  const handleDeleteFinding = (index: number) => {
    setProject(p => {
      if (!p) return null;
      const newFindings = [...p.findings];
      newFindings.splice(index, 1);
      return { ...p, findings: newFindings };
    });
  };

  const handleRunAction = useCallback(async (action: string, payload?: any) => {
    if (!project) return;
    setActiveAction(action);
    setError(null);

    const getRequirementsText = () => {
      const standardAlways = project.selectedStandard.documents.filter(d => d.applicability === 'always');
      const governingAlways = mainGoverningRequirements.documents.filter(d => d.applicability === 'always');
      const allApplicableDocs = [
        ...governingAlways,
        ...project.selectedGoverningDocuments,
        ...standardAlways,
        ...project.selectedOptionalDocuments
      ];
      return allApplicableDocs.map(d => `--- ${d.name} ---\n${d.content}`).join('\n\n');
    }

    try {
      // -- CONTEXT PREPARATION LAYER --
      // Separate Knowledge Base vs Examples directly (No RAG)
      const kbDocs = libraryDocuments.filter(d => d.type === 'knowledge_base');
      const exampleDocs = libraryDocuments.filter(d => d.type !== 'knowledge_base');

      if (action === 'generateFindings' || action === 'refineFindings') {
        const findingExamples = exampleDocs.filter(d => d.type === 'finding');

        if (action === 'generateFindings') {
          setProject((p) => (p ? { ...p, findings: [] } : null)); // Clear previous findings
        }
        let buffer = '';
        const delimiter = '<END_OF_FINDING>';

        const requirementsText = getRequirementsText();
        const previousFindings = action === 'refineFindings' ? project.findings : undefined;
        const correction = action === 'refineFindings' ? payload.correction : undefined;

        const apiPayload = {
          projectMode: project.projectMode,
          standardName: project.selectedStandard.name,
          requirementsText,
          documents: project.documents,
          libraryDocs: findingExamples, // Direct pass of specific examples
          knowledgeBaseDocs: kbDocs,    // Direct pass of KB
          previousFindings,
          correction
        };

        await callApiStream('generateFindings', apiPayload, (chunk) => {
          buffer += chunk;
          while (buffer.includes(delimiter)) {
            const endOfFindingIndex = buffer.indexOf(delimiter);
            const findingJson = buffer.substring(0, endOfFindingIndex).trim();
            buffer = buffer.substring(endOfFindingIndex + delimiter.length);

            if (findingJson) {
              try {
                const newFinding: Finding = JSON.parse(findingJson);
                setProject((p) => (p ? { ...p, findings: [...p.findings, newFinding] } : null));
              } catch (e) {
                console.error("Failed to parse finding JSON:", e, "JSON string was:", findingJson);
              }
            }
          }
        });

      } else if (action === 'generateSamplingPlan' || action === 'refineSamplingPlan') {
        const isRefine = action === 'refineSamplingPlan';
        setProject(p => p ? { ...p, samplingPlan: '' } : null);

        const apiPayload = {
          projectMode: project.projectMode,
          standardName: project.selectedStandard.name,
          documents: project.documents,
          findings: project.findings,
          criteria: payload.criteria,
          knowledgeBaseDocs: kbDocs, // Direct pass of KB
          libraryDocs: [], // Sampling typically relies more on logic/KB than few-shot examples
          previousPlan: isRefine ? project.samplingPlan : undefined,
          correction: isRefine ? payload.correction : undefined,
        };

        await callApiStream('generateSamplingPlan', apiPayload, (chunk) => {
          setProject(p => {
            if (!p) return null;
            return { ...p, samplingPlan: p.samplingPlan + chunk };
          });
        });

      } else if (action.startsWith('report-section-') || action.startsWith('refine-report-section-')) {
        const isRefine = action.startsWith('refine-');
        const { section, reportType, inputs, correction } = payload;
        const previousContent = isRefine ? project.report[reportType as 'validation' | 'verification'][section.id] : undefined;

        setProject(p => {
          if (!p) return null;
          const newReport = { ...p.report };
          newReport[reportType as 'validation' | 'verification'][section.id] = '';
          return { ...p, report: newReport };
        });

        const reportExamples = exampleDocs.filter(d => d.type === 'report');
        
        const apiPayload = {
          projectMode: project.projectMode,
          standardName: project.selectedStandard.name,
          documents: project.documents,
          userInput: inputs,
          sectionTemplate: section.content,
          libraryDocs: reportExamples, // Direct pass of specific examples
          knowledgeBaseDocs: kbDocs,   // Direct pass of KB
          previousContent,
          correction
        };

        await callApiStream('generateReportSection', apiPayload, (chunk) => {
          setProject(p => {
            if (!p) return null;
            const newReport = { ...p.report };
            const currentContent = newReport[reportType as 'validation' | 'verification'][section.id] || '';
            newReport[reportType as 'validation' | 'verification'] = {
              ...newReport[reportType as 'validation' | 'verification'],
              [section.id]: currentContent + chunk,
            };
            return { ...p, report: newReport };
          });
        });

      } else if (action.startsWith('response-') || action.startsWith('refine-response-')) {
        const isRefine = action.startsWith('refine-');
        const { type, comment, correction } = payload;
        const previousResponse = isRefine ? project.responses[comment] : undefined;

        setProject(p => p ? { ...p, responses: { ...p.responses, [comment]: '' } } : null);

        const projectContext = `The project is being audited against the ${project.selectedStandard.name} standard. Key documents include: ${project.documents.map(d => d.name).join(', ')}.`;
        
        const responseExamples = exampleDocs.filter(d => d.type === `response_${type}`);

        const apiPayload = {
          projectMode: project.projectMode,
          receivedComment: comment,
          projectContext,
          responseType: type,
          libraryDocs: responseExamples, // Direct pass of specific examples
          knowledgeBaseDocs: kbDocs,     // Direct pass of KB
          previousResponse,
          correction
        };

        await callApiStream('generateResponse', apiPayload, (chunk) => {
            setProject(p => {
                if (!p) return null;
                const currentResponse = p.responses[comment] || '';
                return { ...p, responses: { ...p.responses, [comment]: currentResponse + chunk } };
            });
        });
      }
    } catch (err: any) {
        console.error('Error executing action:', err);
        setError(err.message || "An error occurred during AI processing.");
    } finally {
        setActiveAction(null);
    }
  }, [project, libraryDocuments, mainGoverningRequirements]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-200 transition-colors duration-300">
        <Header isDeveloperMode={isDeveloperMode} setIsDeveloperMode={setIsDeveloperMode} />
        
        <main className="container mx-auto px-4 py-8">
            {error && (
                 <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl relative mb-6 flex items-center shadow-sm" role="alert">
                    <strong className="font-bold mr-2">Error:</strong>
                    <span className="block sm:inline">{error}</span>
                    <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                        <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
                    </button>
                </div>
            )}

            {isDeveloperMode ? (
                <DeveloperModeDashboard 
                    standards={standards}
                    setStandards={setStandards}
                    libraryDocuments={libraryDocuments}
                    setLibraryDocuments={setLibraryDocuments}
                    mainGoverningRequirements={mainGoverningRequirements}
                    setMainGoverningRequirements={setMainGoverningRequirements}
                    onAddNewStandard={(name, description) => {
                        const newStandard: Standard = {
                            id: `std_${Date.now()}`,
                            name,
                            description,
                            documents: []
                        };
                        setStandards([...standards, newStandard]);
                    }}
                />
            ) : !project ? (
                <div className="max-w-6xl mx-auto animate-fade-in">
                     <div className="text-center mb-12">
                        <h1 className="text-4xl font-display font-bold text-slate-900 dark:text-white mb-4">Carbon Audit <span className="text-transparent bg-clip-text bg-gradient-to-r from-ampere-mint to-ampere-blue">Autopilot</span></h1>
                        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">AI-powered validation and verification for carbon offset projects. Configure your audit scope and upload evidence to begin.</p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-900/10 border border-slate-100 dark:border-slate-700/50">
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
                              <StandardSelector 
                                  standards={standards}
                                  selectedStandard={selectedStandard}
                                  onStandardSelect={setSelectedStandard}
                                  selectedOptionalDocs={selectedOptionalDocs}
                                  onOptionalDocsSelect={setSelectedOptionalDocs}
                                  mainGoverningRequirements={mainGoverningRequirements}
                                  selectedGoverningDocs={selectedGoverningDocs}
                                  onGoverningDocsSelect={setSelectedGoverningDocs}
                              />
                              <DocumentManager documents={documents} setDocuments={setDocuments} />
                         </div>

                         <div className="border-t border-slate-200 dark:border-slate-700 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
                              <div className="w-full md:w-auto">
                                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Audit Scope / Manual</label>
                                  <div className="flex flex-wrap gap-2">
                                      {[
                                          { id: 'project_validation', label: 'Validation' },
                                          { id: 'project_verification', label: 'Verification' },
                                          { id: 'ghg_inventory_verification', label: 'GHG Inventory' },
                                          { id: 'corsia_verification', label: 'CORSIA' }
                                      ].map((mode) => (
                                          <button
                                              key={mode.id}
                                              onClick={() => handleProjectModeChange(mode.id)}
                                              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${projectMode === mode.id 
                                                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-lg' 
                                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                                          >
                                              {mode.label}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                              
                              <button 
                                  onClick={handleStartProject}
                                  className="w-full md:w-auto bg-gradient-to-r from-ampere-mint to-ampere-green hover:from-ampere-green hover:to-emerald-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-ampere-mint/30 hover:shadow-xl hover:shadow-ampere-mint/40 transform hover:-translate-y-1 transition-all duration-300"
                              >
                                  Start Analysis Project
                              </button>
                         </div>
                    </div>
                </div>
            ) : (
                <ProjectDashboard 
                    project={project}
                    reportTemplates={reportTemplates}
                    onRunAction={handleRunAction}
                    onReset={() => setProject(null)}
                    activeAction={activeAction}
                    onProjectModeChange={handleProjectModeChange}
                    onDeleteFinding={handleDeleteFinding}
                />
            )}
        </main>
        <Toast message={null} onClose={() => {}} />
    </div>
  );
};

export default App;