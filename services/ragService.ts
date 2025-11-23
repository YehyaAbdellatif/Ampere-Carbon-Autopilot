import { LibraryDocument } from '../types';
import { dbService } from './db';

/**
 * A lightweight RAG (Retrieval Augmented Generation) service.
 * It handles interaction with the backend to generate embeddings and 
 * performs local cosine similarity search to filter library documents.
 */

// Type definition for a document with its vector embedding
interface VectorizedDoc {
    id: string;
    doc: LibraryDocument;
    embedding: number[];
}

export const ragService = {

    /**
     * Generates embeddings for an array of texts by calling the backend.
     */
    async generateEmbeddings(texts: string[]): Promise<number[][]> {
        try {
            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'embed',
                    payload: { texts }
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate embeddings');
            }

            const data = await response.json();
            return data.embeddings; // Expecting number[][]
        } catch (e) {
            console.error("Embedding generation failed:", e);
            return [];
        }
    },

    /**
     * Calculates Cosine Similarity between two vectors.
     */
    cosineSimilarity(vecA: number[], vecB: number[]): number {
        if (vecA.length !== vecB.length) return 0;
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    },

    /**
     * Optimized retrieval that checks DB for existing embeddings first
     */
    async retrieveRelevantDocs(
        query: string, 
        topK: number = 5
    ): Promise<LibraryDocument[]> {
        if (!query) return [];

        // 1. Get all docs from DB (including stored embeddings)
        const allDocs = await dbService.getLibraryDocs();
        if (allDocs.length === 0) return [];

        // 2. Identify docs that are missing embeddings
        const docsMissingEmbeddings = allDocs.filter(d => !d.embedding);
        
        // 3. Generate embeddings for new/updated docs and save them back to DB
        if (docsMissingEmbeddings.length > 0) {
            console.log(`Generating embeddings for ${docsMissingEmbeddings.length} new documents...`);
            // Truncate to avoid token limits for embedding
            const texts = docsMissingEmbeddings.map(d => (d.name + "\n" + d.content).substring(0, 2000));
            
            // Note: Ensure generateEmbeddings returns correct count even if some fail
            const newEmbeddings = await this.generateEmbeddings(texts);
            
            if (newEmbeddings.length === docsMissingEmbeddings.length) {
                // Save back to DB so we don't pay API costs next time
                for (let i = 0; i < docsMissingEmbeddings.length; i++) {
                    const doc = docsMissingEmbeddings[i];
                    if (newEmbeddings[i]) {
                        doc.embedding = newEmbeddings[i];
                        await dbService.saveLibraryDoc(doc, newEmbeddings[i]);
                    }
                }
            }
        }

        // 4. Generate embedding for the current USER QUERY
        const queryEmbeddingBatch = await this.generateEmbeddings([query]);
        if (queryEmbeddingBatch.length === 0) return [];
        const queryVector = queryEmbeddingBatch[0];

        // 5. Perform Cosine Similarity Search
        const scoredDocs = allDocs
            .filter(d => d.embedding) // Ensure we have a vector
            .map(doc => {
                const score = this.cosineSimilarity(queryVector, doc.embedding!);
                return { doc, score };
            });

        // 6. Sort and Return
        scoredDocs.sort((a, b) => b.score - a.score);
        return scoredDocs.slice(0, topK).map(item => item.doc);
    }
};