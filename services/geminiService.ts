import { Finding, LibraryDocument, ProjectDocument, SamplingParameters } from '../types';

export async function callApiStream(action: string, payload: any, onChunk: (chunk: string) => void) {
  try {
    console.log(`[GeminiService] Preparing prompt for action: ${action}`);
    const { prompt } = getPromptAndConfig(action, payload);
    const systemInstruction = getBaseSystemInstruction(action, payload.projectMode);

    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generate',
        payload: { systemInstruction, prompt },
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errData.error || `API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response stream available');

    const decoder = new TextDecoder();
    let hasResponse = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const text = parsed.choices?.[0]?.delta?.content;
          if (text) {
            hasResponse = true;
            onChunk(text);
          }
        } catch {
          // partial JSON line, skip
        }
      }
    }

    if (!hasResponse) {
      throw new Error('AI returned no content (possibly blocked or empty response).');
    }

  } catch (error: any) {
    console.error(`Streaming AI call for action '${action}' failed:`, error);
    throw new Error(error.message || 'Failed to communicate with the AI service.');
  }
}

// --- Helpers ---

const formatProjectMode = (mode: string): string => {
    return mode ? mode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Audit';
};

const getBaseSystemInstruction = (action: string, projectMode: string): string => {
    const modeLabel = formatProjectMode(projectMode);
    const baseInstruction = `
    IMPORTANT FORMATTING RULES: 
    1. Do NOT use LaTeX formatting for math. Write equations in plain text or code blocks.
    2. Use bolding for emphasis.
    `;
    
    if (action.startsWith('generateFindings') || action === 'refineFindings') {
        return `You are a lead carbon auditor and technical expert conducting a ${modeLabel}. Your role is to strictly evaluate project evidence. ${baseInstruction}`;
    }
    if (action.startsWith('generateSamplingPlan') || action === 'refineSamplingPlan') {
        return `You are a lead carbon auditor specializing in risk-based assessment for a ${modeLabel}. Follow CDM guidelines for Acceptance Sampling. ${baseInstruction}`;
    }
    if (action.includes('report-section')) {
        return `You are a professional carbon audit report writer drafting sections for a ${modeLabel} Report. Your tone is formal and objective. ${baseInstruction}`;
    }
    if (action.includes('response')) {
        return `You are a senior VVB manager drafting official responses to stakeholders. Tone is professional and diplomatic. ${baseInstruction}`;
    }
    return `You are a helpful AI assistant for carbon auditing. ${baseInstruction}`;
};

const getPromptAndConfig = (action: string, payload: any) => {
    let prompt = '';
    
    const knowledgeBaseDocs = payload.knowledgeBaseDocs || [];
    const kbContext = (knowledgeBaseDocs.length > 0)
        ? `\n\n**Reference Standards:**\n${knowledgeBaseDocs.map((d: LibraryDocument) => `--- ${d.name} ---\n${d.content}`).join('\n')}\n\n`
        : '';

    switch (action) {
        case 'generateFindings':
        case 'refineFindings':
            prompt = kbContext + getFindingsPrompt(payload);
            break;
        case 'generateSamplingPlan':
        case 'refineSamplingPlan':
            prompt = kbContext + getSamplingPlanPrompt(payload);
            break;
        case 'generateReportSection':
        case 'refine-report-section': 
        case 'report-section-val_exec_summary':
        case 'report-section-val_team_means':
        case 'report-section-val_findings':
        case 'report-section-val_iqc':
        case 'report-section-val_opinion':
        case 'report-section-ver_exec_summary':
        case 'report-section-ver_team_materiality':
        case 'report-section-ver_means':
        case 'report-section-ver_findings':
        case 'report-section-ver_iqc_opinion':
            prompt = kbContext + getReportSectionPrompt(payload);
            break;
        case 'generateResponse':
        case 'refine-response':
        case 'response-finding':
        case 'response-registry':
        case 'response-technical':
             prompt = kbContext + getResponsePrompt(payload);
             break;
        default:
             if (action.startsWith('report-section-') || action.startsWith('refine-report-section-')) {
                 prompt = kbContext + getReportSectionPrompt(payload);
             } else if (action.startsWith('response-') || action.startsWith('refine-response-')) {
                 prompt = kbContext + getResponsePrompt(payload);
             } else {
                 throw new Error(`Unknown action: ${action}`);
             }
    }
    return { prompt };
}

// --- Prompt Getters ---

const formatExamples = (docs: LibraryDocument[], label: string): string => {
    if (!docs || docs.length === 0) return '';
    return `\n\n**${label}:**\n${docs.map(d => `--- ${d.name} ---\n${d.content}`).join('\n\n')}\n`;
};

const getFindingsPrompt = (payload: {
    standardName: string,
    requirementsText: string,
    documents: ProjectDocument[],
    libraryDocs?: LibraryDocument[],
    previousFindings?: Finding[],
    correction?: string
}): string => {
    const { standardName, requirementsText, documents, libraryDocs, previousFindings, correction } = payload;
    const docsText = documents.map((doc) => `\n--- Document: ${doc.name} ---\n${doc.content}`).join('\n');
    const delimiter = '<END_OF_FINDING>';

    const examplesBlock = formatExamples(libraryDocs || [], 'Example Findings (match this format and quality)');

    let prompt = `
      Review the provided project context against the requirements of the selected standard. Identify any gaps, inconsistencies, or areas needing clarification.

      **Selected Standard:** ${standardName}

      **Applicable Requirements:**
      ${requirementsText}

      **Project Context / Evidence:**
      ${docsText}
      ${examplesBlock}
      Based on your review, generate a series of findings.
      
      **Output Format Rules:**
      1.  Generate one finding at a time.
      2.  Each finding must be a single, valid JSON object with the keys "type" (string, one of "CL", "CAR", "FAR"), "description" (string), and "reference" (string).
      3.  After EACH JSON object, you MUST write the delimiter: ${delimiter}
      4.  DO NOT wrap the output in a JSON array.
      5.  Start generating the first finding immediately.
    `;

    if (previousFindings && correction) {
        prompt += `
        \n\n---
        The user has reviewed a previous set of findings and provided feedback. Generate a new, updated stream of findings that incorporates this feedback.
        **Previous Findings (JSON):**
        ${JSON.stringify(previousFindings, null, 2)}
        **User Feedback for Refinement:**
        ${correction}
      `;
    }
    return prompt;
};

const getSamplingPlanPrompt = (payload: {
    standardName: string;
    documents: ProjectDocument[];
    findings: Finding[];
    criteria?: SamplingParameters;
    samplingParams?: SamplingParameters;
    previousPlan?: string;
    correction?: string;
}): string => {
    const { standardName, documents, findings, previousPlan, correction } = payload;
    const samplingParams = payload.criteria || payload.samplingParams;
    if (!samplingParams) {
        throw new Error('Sampling parameters are required (pass as "criteria" or "samplingParams").');
    }
    
    const docsContent = documents.map((doc) => `"${doc.name}"`).join(', ');

    const findingsText = findings && findings.length > 0 ? `The following findings have been drafted and may indicate high-risk areas:\n${JSON.stringify(findings, null, 2)}` : 'No findings have been drafted yet.';
    
    const methodDescription = samplingParams.approach === 'acceptance' 
        ? `Acceptance Sampling (CDM Guidelines). \n   - AQL: ${samplingParams.aql}\n   - UQL: ${samplingParams.uql}\n   - Producer Risk (Alpha): ${samplingParams.producerRisk}\n   - Consumer Risk (Beta): ${samplingParams.consumerRisk}` 
        : `Parameter Estimation. \n   - Confidence: ${samplingParams.confidence}\n   - Precision: ${samplingParams.precision}`;

    let prompt = `
      Create a detailed and robust sampling plan for a GHG audit. The plan must be practical and sufficient to gather evidence to support the audit opinion.
      
      **Project Standard:** ${standardName}
      **Project Context:** 
      ${docsContent}
      
      **Findings Drafted So Far:**
      ${findingsText}
      
      **Sampling Criteria & Methodology:**
      - **Population Size:** ${samplingParams.populationSize || 'Not specified (infer from context)'}
      - **Approach:** ${samplingParams.approach === 'acceptance' ? 'Acceptance Sampling (Hypothesis Testing)' : 'Parameter Estimation'}
      - **Method:** ${samplingParams.method.replace('_', ' ').toUpperCase()}
      - **Parameters:** ${methodDescription}
      - **Random Seed (Fixed):** ${samplingParams.seed || 'No seed provided'}
      - **Context:** "${samplingParams.additionalContext}"
      
      **Specific Requirements:**
      1. **Use CDM-EB50-A30-STAN Guidelines:**
         - If Approach is **Acceptance Sampling**, you MUST calculate the sample size (n) and acceptance number (c).
      
      2. **Justify Method:** Explain why ${samplingParams.method} is appropriate.
      
      3. **Python Code:** Include a Python code block using \`random.seed(${samplingParams.seed})\` to simulate selection.
      
      Structure your response in Markdown.
    `;
    
    if (previousPlan && correction) {
        prompt += `
        \n\n---
        Refine the previous plan based on feedback:
        **Previous Plan:**
        ${previousPlan}
        **Feedback:**
        ${correction}
        `;
    }
    return prompt;
};

const getReportSectionPrompt = (payload: {
    standardName: string,
    documents: ProjectDocument[],
    userInput: { assessment: string; opinion: string },
    sectionTemplate: string,
    libraryDocs?: LibraryDocument[],
    previousContent?: string,
    correction?: string,
}): string => {
    const { standardName, documents, userInput, sectionTemplate, libraryDocs, previousContent, correction } = payload;
    
    const docsContent = documents.map((doc) => `\n--- ${doc.name} ---\n${doc.content}`).join('\n');
    
    let filledTemplate = sectionTemplate;
    if (userInput) {
        filledTemplate = filledTemplate
            .replace(/{{assessment}}/g, userInput.assessment || '')
            .replace(/{{opinion}}/g, userInput.opinion || '');
    }

    const examplesBlock = formatExamples(libraryDocs || [], 'Example Report Sections (match this style and quality)');

    let prompt = `
      Draft the content for the following section of a Report.
      Use the provided project details and user inputs to generate a professional, detailed, and accurate section.

      **Project Standard:** ${standardName}
      **Project Context/Evidence:**
      ${docsContent}
      ${examplesBlock}
      **Section to Draft:**
      ---
      ${filledTemplate}
      ---
    `;

    if (previousContent && correction) {
        prompt += `
        \n\n---
        Refine the previous content based on feedback:
        **Previous Content:**
        ${previousContent}
        **Feedback:**
        ${correction}
      `;
    }
    return prompt;
};

const getResponsePrompt = (payload: {
    receivedComment: string,
    projectContext: string,
    responseType: 'finding' | 'registry' | 'technical',
    libraryDocs?: LibraryDocument[],
    previousResponse?: string,
    correction?: string,
    documents?: ProjectDocument[]
}): string => {
    const { receivedComment, projectContext, responseType, libraryDocs, previousResponse, correction } = payload;
    
    const personaDetail = {
        finding: 'Draft a response to a project proponent about a finding that was raised.',
        registry: 'Draft an official response to a review comment received from a major carbon registry.',
        technical: 'Draft a clear and precise response to a detailed query from a third-party technical reviewer.'
    }[responseType] || 'Draft a professional response.';

    const examplesBlock = formatExamples(libraryDocs || [], 'Example Responses (match this tone and quality)');

    let prompt = `
      ${personaDetail}

      **Project Context:**
      ${projectContext}
      ${examplesBlock}
      **Comment Received:**
      "${receivedComment}"

      Address the points raised directly, referencing the project context and maintaining a collaborative tone.
    `;

    if (previousResponse && correction) {
        prompt += `
        \n\n---
        Refine based on feedback:
        **Previous Response:**
        ${previousResponse}
        **Feedback:**
        ${correction}
      `;
    }
    return prompt;
};