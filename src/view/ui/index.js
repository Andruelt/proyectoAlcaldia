'use strict';

import './utils/escape.js';
import './utils/ipc.js';
import './utils/icons.js';
import './date-utils.js';
import './icons.js';
import './tokens.js';

import './components/button-primary.js';
import './components/button-action.js';
import './components/form-input.js';
import './components/form-textarea.js';
import './components/select-dropdown.js';
import './components/modal-dialog.js';
import './components/toast-container.js';
import './components/stat-card.js';
import './components/nav-menu-item.js';
import './components/title-bar.js';
import './components/tool-tip.js';
import './components/calendar-grid.js';
import './components/report-builder.js';
import './components/activity-selector.js';

import './registry.js';

import { templates } from '../report-templates/index.js';

window.reportTemplates = templates;
