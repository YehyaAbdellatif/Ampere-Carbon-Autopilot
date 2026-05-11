import { openDB, DBSchema } from 'idb';
import { Standard, LibraryDocument, ReportTemplate, Project } from '../types';
import { INITIAL_STANDARDS, INITIAL_LIBRARY_DOCUMENTS, INITIAL_MAIN_GOVERNING_REQUIREMENTS, INITIAL_REPORT_TEMPLATES } from '../src/data/defaults';

interface AmpereDB extends DBSchema {
  standards: {
    key: string;
    value: Standard;
  };
  library: {
    key: string;
    value: LibraryDocument & { embedding?: number[] };
    indexes: { 'by-type': string };
  };
  governing: {
    key: string;
    value: Standard;
  };
  templates: {
    key: string;
    value: ReportTemplate;
  };
  projects: {
    key: string;
    value: Project;
  };
}

const DB_NAME = 'ampere-db';
const DB_VERSION = 2;

let dbInstance: Awaited<ReturnType<typeof openDB<AmpereDB>>> | null = null;

export const initDB = async () => {
  if (dbInstance) return dbInstance;

  const db = await openDB<AmpereDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('standards')) {
        db.createObjectStore('standards', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('library')) {
        const store = db.createObjectStore('library', { keyPath: 'id' });
        store.createIndex('by-type', 'type');
      }
      if (!db.objectStoreNames.contains('governing')) {
        db.createObjectStore('governing', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('templates')) {
        db.createObjectStore('templates', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: 'id' });
      }
    },
  });

  // Seed defaults if library is empty
  const count = await db.count('library');
  if (count === 0) {
    console.log('Seeding database with defaults...');
    const tx = db.transaction(['standards', 'library', 'governing', 'templates'], 'readwrite');
    
    for (const std of INITIAL_STANDARDS) {
      await tx.objectStore('standards').put(std);
    }
    for (const doc of INITIAL_LIBRARY_DOCUMENTS) {
      await tx.objectStore('library').put(doc);
    }
    await tx.objectStore('governing').put(INITIAL_MAIN_GOVERNING_REQUIREMENTS);
    for (const tmpl of INITIAL_REPORT_TEMPLATES) {
      await tx.objectStore('templates').put(tmpl);
    }
    await tx.done;
  }

  dbInstance = db;
  return db;
};

export const dbService = {
  async getStandards(): Promise<Standard[]> {
    const db = await initDB();
    return db.getAll('standards');
  },

  async saveStandard(standard: Standard) {
    const db = await initDB();
    return db.put('standards', standard);
  },

  async getLibraryDocs(): Promise<(LibraryDocument & { embedding?: number[] })[]> {
    const db = await initDB();
    return db.getAll('library');
  },

  async saveLibraryDoc(doc: LibraryDocument, embedding?: number[]) {
    const db = await initDB();
    // If embedding is undefined, we might want to preserve the existing one or overwrite it.
    // Ideally, we fetch the existing one first if we want to be safe, but for now:
    return db.put('library', { ...doc, embedding });
  },

  async deleteLibraryDoc(id: string) {
    const db = await initDB();
    return db.delete('library', id);
  },

  async getMainGoverning(): Promise<Standard> {
    const db = await initDB();
    const gov = await db.get('governing', 'main_governing');
    return gov || INITIAL_MAIN_GOVERNING_REQUIREMENTS;
  },

  async saveMainGoverning(std: Standard) {
    const db = await initDB();
    return db.put('governing', std);
  },
  
  async getReportTemplates(): Promise<ReportTemplate[]> {
    const db = await initDB();
    return db.getAll('templates');
  },

  async saveProject(project: Project): Promise<string> {
    const db = await initDB();
    return db.put('projects', project);
  },

  async getProject(id: string): Promise<Project | undefined> {
    const db = await initDB();
    return db.get('projects', id);
  },

  async deleteProject(id: string): Promise<void> {
    const db = await initDB();
    return db.delete('projects', id);
  },

  async getAllProjects(): Promise<Project[]> {
    const db = await initDB();
    return db.getAll('projects');
  },
};