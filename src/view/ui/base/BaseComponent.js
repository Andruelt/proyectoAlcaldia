'use strict';

export class BaseComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        if (!this._rendered) {
            this._rendered = true;
            this.render();
        }
    }
}
