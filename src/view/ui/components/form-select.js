'use strict';

import { inputBase } from '../base/BaseFormField.js';
import { BaseFormField } from '../base/BaseFormField.js';

export class FormSelect extends BaseFormField {
    loadOptions(items, placeholder = 'Seleccione una opción') {
        const select = this.shadowRoot.querySelector('select');
        if (!select) return;
        select.innerHTML = `<option value="">${placeholder}</option>` +
            items.map(item => `<option value="${item.id}">${item.nombre}</option>`).join('');
    }

    render() {
        const label = this.getAttribute('label') || '';
        const id = this.getAttribute('id') || '';

        const extraStyles = `.form-select { ${inputBase} cursor: pointer; } .form-select:focus { border-color: var(--border-focus, #64748b); }`;

        const staticOptions = this.innerHTML.trim();
        const selectContent = staticOptions || '<option value="">Cargando...</option>';

        this.renderField(label, '', `<select id="${id}" class="form-select">${selectContent}</select>`, extraStyles);
    }
}
