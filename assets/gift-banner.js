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

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.gift-guide-banner').forEach(function (banner) {
    const toggle = banner.querySelector('.gift-guide-menu');
    const topbar = banner.querySelector('.gift-guide-topbar');

    if (!toggle || !topbar) return;

    toggle.addEventListener('click', function () {
      const open = topbar.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  });
});