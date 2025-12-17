
import * as cheerio from 'cheerio';
import { IArtifact, IRapport } from '../types';
import { DiscoveryPlugin } from '../models/schemas/DiscoveryPlugin';


export async function extractor(discoveryPlugin: DiscoveryPlugin, rapport: IRapport) : IArtifact|IArtifact[]
{
  return {} as IArtifact
}


