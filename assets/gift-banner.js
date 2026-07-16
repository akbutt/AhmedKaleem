/**
 * Gift Guide Banner Section
 * Handles section loading and interactions
 */

class GiftGuideBanner extends HTMLElement {

  constructor() {
    super();
  }


  connectedCallback() {

    this.classList.add('gift-guide-loaded');

  }

}


if (!customElements.get('gift-guide-banner')) {

  customElements.define(
    'gift-guide-banner',
    GiftGuideBanner
  );

}

