/**
 * ArtifactRecord is the mapped class used with Dexie.
 * Each record gets instance methods for convenience.
 */
import { Attachment, IArtifact } from '../../types';
import { db } from '../db/dexieDb';
import { debug } from '../../services/logger_services';
import { blobToBase64Image, sha256FromBlob } from '../../utilities/transformers';

export class Artifact implements IArtifact {
  createdOn: Date = new Date();
  uuid!: string;
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
      uuid: artifact.uuid,
      mimeType: artifact.mimeType,
      size: artifact.size,
      url: artifact.url,
    };
  }

  static async create(
    blob: Blob,
    rapportUuid: string,
    url: string,
    mimeType: string = ''
  ): Promise<IArtifact> {
    // Compute a hash of the content for deduplication / integrity
    const hash = await sha256FromBlob(blob);
    const record: IArtifact = {
      uuid: crypto.randomUUID(),
      rapportUuid,
      size: blob.size,
      hash,
      hashAlgorithm: 'SHA-256',
      mimeType: !blob.type ? mimeType : blob.type,
      data: blob,
      url,
    };
    debug('artifact saved', record);
    return record;
  }

  static async downloadArtifact(
    attachment: Attachment,
    fileName: string
  ): Promise<void> {
    const artifact = await db.artifact.get(attachment.uuid);
    if (artifact === undefined) {
      debug(`Artifact record does not exist for ${attachment.uuid}`);
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

  static async serialize(artifact: Artifact)
  {
    return {
      createdOn: artifact.createdOn,
      uuid: artifact.uuid,
      rapportUuid: artifact.rapportUuid,
      size: artifact.size,
      hash: artifact.hash,
      hashAlgorithm: artifact.hashAlgorithm,
      mimeType: artifact.mimeType,
      data: await blobToBase64Image(artifact.data),
      url: artifact.url
    }
  }


  /**
   * When data is transported between systems we need to hydrate the data
   * object correctly for persisting. This is a pro feature
   * Validation happens outside this method
   * @param artifact
   */
  static async deserialize(artifact: any)
  {
    let base64Data = artifact.data.split(',')[1];
    // Add padding '=' characters until the length is a multiple of 4
    while (base64Data.length % 4 !== 0) {
      base64Data += '=';
    }

    const byteChars = globalThis.atob(base64Data);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
    }

    return {
      createdOn: artifact.createdOn,
      uuid: artifact.uuid,
      rapportUuid: artifact.rapportUuid,
      size: artifact.size,
      hash: artifact.hash,
      hashAlgorithm: artifact.hashAlgorithm,
      mimeType: artifact.mimeType,
      data: new Blob([new Uint8Array(byteNumbers)], {type: artifact.mimeType}),
      url: artifact.url
    }
  }
}
