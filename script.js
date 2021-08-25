function createProductImageElement(imageSource) {
  const img = document.createElement('img');
  img.className = 'item__image';
  img.src = imageSource;
  return img;
}

function createCustomElement(element, className, innerText) {
  const e = document.createElement(element);
  e.className = className;
  e.innerText = innerText;
  return e;
}

function createProductItemElement({ sku, name, image }) {
  const section = document.createElement('section');
  section.className = 'item';

  section.appendChild(createCustomElement('span', 'item__sku', sku));
  section.appendChild(createCustomElement('span', 'item__title', name));
  section.appendChild(createProductImageElement(image));
  section.appendChild(createCustomElement('button', 'item__add', 'Adicionar ao carrinho!'));

  return section;
}

function getSkuFromProductItem(item) {
  return item.querySelector('span.item__sku').innerText;
}

function cartItemClickListener(event) {
  const elem = event.target;
  const re = /(?:\w*: )(\w*)\s.*/gm;
  const sku = re.exec(elem.innerText)[1];

  const removeEvent = new CustomEvent('removefromcart', {
    detail: sku,
  });
  document.dispatchEvent(removeEvent);

  elem.parentNode.removeChild(elem);
}

function createCartItemElement({ sku, name, salePrice }) {
  const li = document.createElement('li');
  li.className = 'cart__item';
  li.innerText = `SKU: ${sku} | NAME: ${name} | PRICE: $${salePrice}`;
  li.addEventListener('click', cartItemClickListener);
  return li;
}

class ShoppingCart {
  constructor(config) {
    this.config = config;
    this.cartItems = [];
  }

  doRequest(action, queryParams) {
    return new Promise((accept, reject) => {
      const paramsStr = queryParams ? `?${new URLSearchParams(queryParams)}` : '';
      fetch(`${this.config.urlBase}/${action}${paramsStr}`, { method: 'GET' })
        .then((response) => {
            response.json()
              .then(
                (obj) => accept(obj),
                () => new Error('Resposta do servidor em formato inesperado!'),
              );
          },
          (error) => reject(error));
    });
  }

  loadAllProducts() {
    this.doRequest('sites/MLB/search', { q: 'computador' })
      .then((response) => {
        const section = document.querySelector('section.items');
        const items = response.results;

        items.forEach(({ id: sku, title: name, thumbnail: image }) => {
          const domElem = section.appendChild(createProductItemElement({ sku, name, image }));
          domElem.querySelector('button.item__add')
            .addEventListener('click', () => {
              this.onAddToCartClick(getSkuFromProductItem(domElem));
            });
        });
      });
  }

  loadProductToCart(itemId) {
    this.doRequest(`items/${itemId}`)
      .then(({ id: sku, title: name, price: salePrice }) => {
        this.addProductToCart({ sku, name, salePrice }, true);
      });
  }

  updateTotalPrice() {
    const total = this.cartItems.reduce((prev, curr) => prev + curr.salePrice, 0);
    const totalElem = document.querySelector('.total-price');
    totalElem.innerHTML = total;
  }

  addProductToCart(product, saveOnStorage) {
    const orderedList = document.querySelector('.cart__items');
    orderedList.appendChild(createCartItemElement(product));
    this.cartItems.push(product);

    if (saveOnStorage) {
      this.saveToStorage();
    }

    this.updateTotalPrice();
  }

  removeProductFromCart(itemId) {
    this.cartItems = this.cartItems.filter((item) => item.sku !== itemId);
    this.saveToStorage();

    this.updateTotalPrice();
  }

  onAddToCartClick(itemId) {
    this.loadProductToCart(itemId);
  }

  onEmptyCart() {
    const orderedList = document.querySelector('.cart__items');
    while (orderedList.firstChild) {
      orderedList.removeChild(orderedList.firstChild);
    }

    this.cartItems = [];
    this.saveToStorage();

    this.updateTotalPrice();
  }

  loadFromStorage() {
    const storageItems = window.localStorage.getItem(this.config.storageKey);
    const items = storageItems ? JSON.parse(storageItems) : [];
    items.forEach((item) => this.addProductToCart(item));
  }

  saveToStorage() {
    window.localStorage.setItem(this.config.storageKey, JSON.stringify(this.cartItems));
  }

  run() {
    document.addEventListener('removefromcart', (event) => {
      this.removeProductFromCart(event.detail);
    });

    document.querySelector('button.empty-cart').addEventListener('click', () => {
      this.onEmptyCart();
    });

    this.loadAllProducts();
    this.loadFromStorage();
  }
}

/**
 * Cria o carrinho de compras, informando as configurações do carrinho.
 * OBS.: Essas configurações podem ser obtidas da configuração global da aplicação
 * ou de um módulo externo específico que contém as configurações do Carrinho de Compras.
 */
const shoppingCart = new ShoppingCart({
  urlBase: 'https://api.mercadolibre.com',
  storageKey: 'cart',
});

window.onload = () => {
  shoppingCart.run();
};
