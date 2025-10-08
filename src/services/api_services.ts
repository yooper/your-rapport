import { APIResponse } from '../types';
import { db } from '../models/db/dexieDb';

/**
 * This is a proof of concept for interacting with the extensions data and
 * allowing for automated test cases to be built more readily
 */
export async function processApiRequest(): Promise<APIResponse> {
  const params = new URLSearchParams(window.location.search);
  const tableName = params.get('table');
  const action = params.get('action');
  const id = params.get('id');
  const rawData = params.get('data');

  if (!tableName || !action) {
    return { success: false, error: 'Missing table or action parameter' };
  }

  const table = (db as any)[tableName];
  if (!table || typeof table !== 'object' || typeof table.toArray !== 'function') {
    return { success: false, error: `Invalid table name: ${tableName}` };
  }

  try {
    switch (action) {
      case 'create': {
        if (!rawData) return { success: false, error: 'Missing data for create' };
        const obj = JSON.parse(rawData);
        const newId = await table.add(obj);
        return { success: true, data: { id: newId } };
      }

      case 'read': {
        if (id) {
          const record = await table.get(id);
          return { success: true, data: record };
        } else {
          const records = await table.toArray();
          return { success: true, data: records };
        }
      }

      case 'update': {
        if (!id || !rawData) return { success: false, error: 'Missing id or data for update' };
        const updated = JSON.parse(rawData);
        await table.update(id, updated);
        return { success: true, data: { id, updated } };
      }

      case 'delete': {
        if (!id) return { success: false, error: 'Missing id for delete' };
        await table.delete(id);
        return { success: true, data: { id } };
      }

      default:
        return { success: false, error: `Unsupported action: ${action}` };
    }
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}