import { getUtcNow, sha256FromBlob } from '../../utilities/transformers';


export class AiPrompt{
  createdOn!: number;
  uuid!: string;
  prompt!: string;
  role!: string;

  static create(prompt: string, role: string) : AiPrompt {
    // Compute a hash of the content for deduplication / integrity
    const record: AiPrompt = {
      uuid: crypto.randomUUID(),
      prompt,
      role,
      createdOn: getUtcNow()
    };
    return record;
  }
}

