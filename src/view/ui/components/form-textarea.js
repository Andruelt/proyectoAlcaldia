'use strict';

import { inputBase } from '../base/BaseFormField.js';
import { BaseFormField } from '../base/BaseFormField.js';

export class FormTextarea extends BaseFormField {
    render() {
        const label = this.getAttribute('label') || '';
        const placeholder = this.getAttribute('placeholder') || '';
        const id = this.getAttribute('id') || '';

        const extraStyles = `.form-textarea { ${inputBase} min-height: 100px; resize: vertical; line-height: 1.5; } .form-textarea::placeholder { color: var(--text-tertiary, #94a3b8); } .form-textarea:focus { border-color: var(--border-focus, #64748b); }`;

        this.renderField(label, id, `<textarea id="${id}" class="form-textarea" placeholder="${placeholder}"></textarea>`, extraStyles);
    }
}
