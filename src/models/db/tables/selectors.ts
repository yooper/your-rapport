// db/tables/selectors.ts

import { Table } from 'dexie';

export type Selector = {
  key: string;
  selectorTypeName: string;
  description: string | null;
  count: number;
  active: boolean;
};

export type SelectorsTable = {
  selectors: Table<Selector>;
};

export const selectorsSchema = {
  selectors: 'key, selectorTypeName, description, count, active'
};

