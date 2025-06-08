/*
 * @license
 * @Copyright Baker Street Enterprises LLC
 * All rights reserved. Copying, distributing or modifying of software is prohibited for commercial purposes.
 * Please contact support@bakerstreet.llc for assistance
 */

import { initAutoScrollerHandler } from './modules/autoScroller';
import { initMarkJsHandler } from './modules/markText';
import { INITIALIZED } from '../../services/constants';

const pageId = crypto.randomUUID();
var scriptState = INITIALIZED;


initAutoScrollerHandler();
initMarkJsHandler();
