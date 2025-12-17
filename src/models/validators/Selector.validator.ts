
import { z } from 'zod';
import {getSelectorTypeMap} from "../../utilities/loaders"

const selectorTypes: string[] = Object.keys(getSelectorTypeMap())

export const SelectorSchema = z.object({
 name: z.string(),
 selectorTypeName: z.string()
    .transform(v => (v === '' ? 'keyword' : v))
    .refine(v => selectorTypes.includes(v), { message: 'Invalid selectorTypeName' })
    .default('keyword'),
 active: z.boolean().default(true),
 description: z.string().nullish()
});

export type SelectorInfer = z.infer<typeof SelectorSchema>;