class ShopLook {
  constructor() {
    this.popup = document.querySelector('.shop-look-popup');
    this.popupContent = document.querySelector('.shop-look-popup-inner');
    this.currentProduct = null;
    this.selectedOptions = {};
    this.selectedVariant = null;
    this.lastScroll = 0;
    this.bonusProductHandle = this.popup?.dataset.bonusProduct || 'soft-winter-jacket';

    if (!this.popup || !this.popupContent) return;
    this.bindEvents();
  }

  bindEvents() {
    document.addEventListener('click', this.handleClick.bind(this));
    document.addEventListener('change', this.handleChange.bind(this));
  }

  normalizeOptionName(option) {
    if (typeof option === 'string') return option;
    if (option && typeof option === 'object') return option.name || option.label || JSON.stringify(option);
    return '';
  }

  normalizeOptionValue(value) {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') return value.name || value.value || JSON.stringify(value);
    return '';
  }

  async handleClick(event) {
    let target = event.target;
    if (target.nodeType !== Node.ELEMENT_NODE) target = target.parentElement;

    const openButton = target?.closest('.shop-look-open');
    if (openButton) {
      await this.openProduct(openButton.dataset.product);
      return;
    }

    const valueButton = target?.closest('.popup-value-btn');
    if (valueButton) {
      this.handleValueButtonClick(valueButton);
      return;
    }

    if (
      target?.matches('.shop-look-close') ||
      target?.matches('.shop-look-popup-overlay')
    ) {
      this.closePopup();
      return;
    }

    if (target?.matches('.popup-add')) {
      await this.addToCart();
      return;
    }
  }

  handleChange(event) {
    if (!event.target.matches('.popup-select')) return;
    const optionName = String(event.target.dataset.optionName);
    this.selectedOptions[optionName] = event.target.value;
    this.updateSelectedVariant();
  }

  handleValueButtonClick(button) {
    const optionName = String(button.dataset.optionName);
    const optionValue = String(button.dataset.optionValue);
    this.selectedOptions[optionName] = optionValue;
    this.updateSelectedVariant();
    this.renderPopup(this.currentProduct);
  }

  async openProduct(handle) {
    if (!handle) return;
    const response = await fetch(`/products/${handle}.js`);
    if (!response.ok) return;

    const product = await response.json();
    this.currentProduct = product;

    this.selectedOptions = {};
    product.options.forEach((option, index) => {
      const name = this.normalizeOptionName(option);
    //   const value = this.normalizeOptionValue(product.variants[0].options[index]);
      this.selectedOptions[name] = "";
    });

    this.updateSelectedVariant();
    this.renderPopup(product);
    this.popup.classList.add('active');

    this.lastScroll = window.scrollY;
    document.body.classList.add('shop-look-popup-open');
    document.body.style.position = 'fixed';
    document.body.style.top = `-${this.lastScroll}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
  }

  updateSelectedVariant() {
    if (!this.currentProduct) return;

    const selectedValues = this.currentProduct.options.map((option) =>
      this.selectedOptions[this.normalizeOptionName(option)]
    );

    this.selectedVariant =
      this.currentProduct.variants.find((variant) =>
        variant.options.every(
          (value, index) =>
            this.normalizeOptionValue(value) === selectedValues[index]
        )
      ) || this.currentProduct.variants[0];
  }

  formatPrice(amount) {
    if (window.Shopify && typeof Shopify.formatMoney === 'function') {
      return Shopify.formatMoney(
        amount,
        window.theme?.moneyFormat || '{{amount_no_decimals_with_comma_separator}}'
      );
    }
    return `$${(amount / 100).toFixed(2)}`;
  }

renderPopup(product) {
  const price = this.formatPrice(product.price);

  let html = `
    <div class="shop-look-popup-inner-content">

      <div class="popup-header">

        <div class="popup-image">
          <img src="${product.images[0] || ''}" alt="${product.title}">
        </div>

        <div class="popup-info">

          <h2 class="popup-title">${product.title}</h2>

          <div class="popup-price">
            ${price}
          </div>

          <div class="popup-description">
            ${product.description}
          </div>

        </div>

      </div>

      <div class="popup-options">
  `;

  /* ---------------- Color First ---------------- */

  product.options.forEach((option, optionIndex) => {

    const optionName = this.normalizeOptionName(option);

    if (optionName.toLowerCase() !== "color") return;

    const values = Array.from(
      new Set(
        product.variants.map((variant) =>
          this.normalizeOptionValue(variant.options[optionIndex])
        )
      )
    );

    html += `
      <div class="popup-option">

        <label>${optionName}</label>

        <div class="popup-values">
    `;

    values.forEach((value) => {

      const active =
        this.selectedOptions[optionName] === value
          ? "active"
          : "";

      html += `
        <button
          type="button"
          class="popup-value-btn ${active}"
          data-option-name="${optionName}"
          data-option-value="${value}"
        >
          ${value}
        </button>
      `;
    });

    html += `
        </div>

      </div>
    `;
  });

  /* ---------------- Remaining Options ---------------- */

  product.options.forEach((option, optionIndex) => {

    const optionName = this.normalizeOptionName(option);

    if (optionName.toLowerCase() === "color") return;

    const values = Array.from(
      new Set(
        product.variants.map((variant) =>
          this.normalizeOptionValue(variant.options[optionIndex])
        )
      )
    );

    html += `
      <div class="popup-option">

        <label>${optionName}</label>

        <div class="popup-select-wrapper">

      <select
  class="popup-select"
  data-option-name="${optionName}"
>
  <option value="" disabled ${
    !this.selectedOptions[optionName] ? "selected" : ""
  }>
    Choose your size
  </option>
    `;

    values.forEach((value) => {

      const selected =
        this.selectedOptions[optionName] === value
          ? "selected"
          : "";

      html += `
        <option value="${value}" ${selected}>
          ${value}
        </option>
      `;
    });

    html += `
          </select>

        </div>

      </div>
    `;
  });

  html += `
        <button class="popup-add" type="button">
          ADD TO CART
        </button>

      </div>

    </div>
  `;

  this.popupContent.innerHTML = html;
}
  async addToCart() {
    if (!this.selectedVariant) return;

    const addItem = async (variantId, quantity = 1) => {
      await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: variantId, quantity }),
      });
    };

    await addItem(this.selectedVariant.id);

    const blackMedium =
      this.selectedVariant.options.includes('Black') &&
      this.selectedVariant.options.includes('Medium');

    if (blackMedium && this.bonusProductHandle) {
      const bonusResponse = await fetch(`/products/${this.bonusProductHandle}.js`);
      if (bonusResponse.ok) {
        const bonusProduct = await bonusResponse.json();
        const bonusVariant = bonusProduct.variants[0];
        if (bonusVariant) {
          await addItem(bonusVariant.id);
        }
      }
    }

    window.location.href = '/cart';
  }

  closePopup() {
    this.popup.classList.remove('active');
    document.body.classList.remove('shop-look-popup-open');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    window.scrollTo(0, this.lastScroll || 0);
  }
}

document.addEventListener('DOMContentLoaded', () => new ShopLook());