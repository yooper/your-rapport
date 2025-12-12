// DiscoveryPlugin.ts
import { DiscoveryPluginAction, DiscoveryPluginInit, onClick } from '../../types';
import { DiscoveryPluginSchema } from "../validators/DiscoveryPlugin.validator";
import Package from './Package';

export class DiscoveryPlugin {
  uuid: string = crypto.randomUUID();
  pluginType: string | 'content';
  url: string | null;
  active: boolean = true;
  groupName: string = 'Default';
  action: DiscoveryPluginAction | null = 'CreateTab';
  homePage: string | null;
  description: string | null;
  label: string | null;
  readOnly: boolean = false;
  sortOrder: number = 0;
  timeOut: number = 600;
  lastAccessedOn: Date | null;
  createdOn: Date = new Date();
  timeTakenIn: number;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | string = 'GET';
  accessed: number = 0;
  version: string = '0.0.0';
  mimeTypeRegex: string | null;
  status: number | null;
  statusError: string | null;
  contentTypeHeader: string | null;
  fieldMapping: Record<string, any> = {};
  headers: Record<string, any> = {};
  /** selected selector value by the user or automation */
  selectorValue: string | number | null;
  country: string = 'us';
  onClick: onClick | null;
  authorizationBearerToken: string | null;
  authorizationUserName: string | null;
  authorizationPassword: string | null;


  constructor(init: DiscoveryPluginInit = {}) {
    this.uuid = init.uuid ?? crypto.randomUUID();
    this.pluginType = init.pluginType ?? 'content';
    this.url = init.url ?? null;
    this.active = init.active ?? true;
    this.groupName = init.groupName ?? 'Default';
    this.action = init.action ?? 'CreateTab';
    this.homePage = init.homePage ?? null;
    this.description = init.description ?? null;
    this.label = init.label ?? null;
    this.readOnly = init.readOnly ?? false;
    this.sortOrder = init.sortOrder ?? 0;
    this.timeOut = init.timeOut ?? 600; // in seconds
    this.lastAccessedOn = init.lastAccessedOn ?? null;
    this.createdOn = init.createdOn ?? new Date();
    this.timeTakenIn = init.timeTakenIn ?? 0;
    this.method = init.method ?? 'GET';
    this.accessed = init.accessed ?? 0;
    this.version = init.version ?? '0.0.1';
    this.mimeTypeRegex = init.mimeTypeRegex ?? null;
    this.status = init.status ?? null;
    this.statusError = init.statusError ?? null;
    this.contentTypeHeader = init.contentTypeHeader ?? null;
    this.fieldMapping = init.fieldMapping ?? {};
    this.headers = init.headers ?? {};
    this.selectorValue = init.selectorValue ?? null;
    this.country = init.country ?? 'us';
    this.onClick = init.onClick ?? null;
    this.authorizationBearerToken = init.authorizationBearerToken ?? null;
    this.authorizationUserName = init.authorizationUserName ?? null;
    this.authorizationPassword = init.authorizationPassword ?? null;
  }

  /** Increment access count and mark last accessed time */
  touch(): void {
    this.accessed += 1;
    this.lastAccessedOn = new Date();
  }

  /** Update status fields from a fetch-like response */
  setStatus(status: number, error: string | null = null): void {
    this.status = status;
    this.statusError = error;
  }

  /** Serialize to a plain JSON-friendly object */
  toJSON(): Omit<DiscoveryPlugin, 'toJSON' | 'getActions' | 'touch' | 'setStatus' | 'uuid'> & { uuid: string } {
    const { uuid, ...rest } = this;
    return { uuid, ...rest };
  }

  /** Rehydrate from a plain object (e.g., DB or JSON) */
  static from(obj: Package): DiscoveryPlugin {
    const pl = new DiscoveryPlugin(obj);
    // If a uuid was provided, keep it (useful when loading from storage)
    if (obj.uuid) (pl as { uuid: string }).uuid = obj.uuid;
    return pl;
  }

  static async validate(input: unknown)
  {
      const res = await DiscoveryPluginSchema.safeParseAsync(input);
      if (!res.success) {
        return { ok: false, errors: res.error.issues.map(i => `${i.path.join(".") || "(root)"}: ${i.message}`+ "   ") };
      }
      return { ok: true, data: res.data };
  }
}
