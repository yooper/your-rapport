/**
 * ArtifactRecord is the mapped class used with Dexie.
 * Each record gets instance methods for convenience.
 */
import { Attachment, IArtifact } from '../../types';
import { db } from '../db/dexieDb';
import { debug } from '../../services/logger_services';
import { sha256FromBlob } from '../../utilities/transformers';

export class Artifact implements IArtifact {
  createdOn: Date = new Date();
  id!: string;
  rapportUuid!: string;
  size!: number;
  hash!: string;
  hashAlgorithm!: string;
  mimeType!: string;
  data!: Blob;
  url!: string;

  /**
   * Return a fly weight of the artifact
   * @param artifact
   */
  static getAttachment(artifact: IArtifact): Attachment {
    return {
      id: artifact.id,
      mimeType: artifact.mimeType,
      size: artifact.size,
      url: artifact.url
    };
  }


  static async create(blob: Blob, rapportUuid: string, url: string, mimeType: string = ''): Promise<IArtifact> {
    // Compute a hash of the content for deduplication / integrity
    const hash = await sha256FromBlob(blob);
    const record: IArtifact = {
      id: crypto.randomUUID(),
      rapportUuid,
      size: blob.size,
      hash,
      hashAlgorithm: 'SHA-256',
      mimeType: !blob.type ? mimeType : blob.type,
      data: blob,
      url
    }
    debug('artifact saved', record)
    return record;
  }


  static async downloadArtifact(attachment: Attachment, fileName: string): Promise<void> {
    const artifact = await db.artifact.get(attachment.id);
    if(artifact === undefined){
      debug(`Artifact record does not exist for ${attachment.id}`)
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