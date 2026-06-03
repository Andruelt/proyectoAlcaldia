'use strict';

import { inputBase } from '../base/BaseFormField.js';
import { BaseFormField } from '../base/BaseFormField.js';

export class FormInput extends BaseFormField {
    render() {
        const label = this.getAttribute('label') || '';
        const placeholder = this.getAttribute('placeholder') || '';
        const id = this.getAttribute('id') || '';
        const type = this.getAttribute('type') || 'text';

        const extraStyles = `.form-input { ${inputBase} } .form-input::placeholder { color: var(--text-tertiary, #94a3b8); } .form-input:focus { border-color: var(--border-focus, #64748b); }`;

        this.renderField(label, id, `<input type="${type}" id="${id}" name="${id}" class="form-input" placeholder="${placeholder}">`, extraStyles);
    }
}
