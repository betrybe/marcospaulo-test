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
  // coloque seu código aqui
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
    this.itemsOnCart = window.localStorage.getItem(this.config.storageKey) || [];
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
          section.appendChild(createProductItemElement({ sku, name, image }));
        });
      });
  }

  run() {
    this.loadAllProducts();
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
