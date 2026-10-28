/**
 * Root wrapper for data verification gate
 * Delegates to api/scripts/verify-data.ts
 */

import * as path from 'path';
import { verifyDataset } from '../api/scripts/verify-data';

const dataDir = path.resolve(process.cwd(), 'api', 'data');
const success = verifyDataset(dataDir);
process.exit(success ? 0 : 1);
