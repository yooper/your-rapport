/**
 * ArtifactRecord is the mapped class used with Dexie.
 * Each record gets instance methods for convenience.
 */
import { IArtifact } from '../../types';
import { db } from '../db/dexieDb';
import { debug } from '../../services/logger_services';

export class Artifact implements IArtifact {
  id!: string;
  rapportUuid!: string;
  size!: number;
  hash!: string;
  hashAlgorithm!: string;
  mimeType!: string;
  data!: Blob;
  createdBy!: string;
  createdOn!: Date;
  updatedBy!: string;
  updatedOn!: Date;
  url!: string;
  domain!: string;
  title?: string;
  note?: string;

  static async calculateSha256(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  static async create(blob: Blob, rapportUuid: string, url: string, title?: string): Promise<IArtifact> {
    // Compute a hash of the content for deduplication / integrity
    const hash = await Artifact.calculateSha256(blob);
    const record: IArtifact = {
      id: crypto.randomUUID(),
      rapportUuid,
      size: blob.size,
      hash,
      hashAlgorithm: 'SHA-256',
      mimeType: blob.type, // TODO, this is empty
      data: blob,
      url: url,
      domain: url,
      createdBy: 'TODO',
      createdOn: new Date(),
      updatedBy: 'TODO',
      updatedOn: new Date(),
      title: title
    }
    debug('artifact saved', record)
    return record;
  }

  static async downloadArtifact(id: string, fileName: string): Promise<void> {
    const artifact = await db.artifact.get(id);
    if(artifact === undefined){
      debug(`Artifact record does not exist for ${id}`)
      return;
    }
    const url = URL.createObjectURL(artifact.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}