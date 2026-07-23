/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

/* Keep track of the available products and the user's selections */
let allProducts = [];
let selectedProducts = [];

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Check whether a product is already selected */
function isProductSelected(productId) {
  return selectedProducts.some((product) => product.id === productId);
}

/* Add or remove a product from the selected list */
function toggleProductSelection(product) {
  const alreadySelected = isProductSelected(product.id);

  if (alreadySelected) {
    selectedProducts = selectedProducts.filter(
      (selectedProduct) => selectedProduct.id !== product.id,
    );
  } else {
    selectedProducts = [...selectedProducts, product];
  }

  renderProducts();
  renderSelectedProducts();
}

/* Remove a product directly from the selected list */
function removeSelectedProduct(productId) {
  selectedProducts = selectedProducts.filter(
    (product) => product.id !== productId,
  );

  renderProducts();
  renderSelectedProducts();
}

/* Show the selected products list */
function renderSelectedProducts() {
  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = `
      <p class="selected-empty">No products selected yet.</p>
    `;
    return;
  }

  selectedProductsList.innerHTML = selectedProducts
    .map(
      (product) => `
        <div class="selected-product-item">
          <div>
            <strong>${product.name}</strong>
            <p>${product.brand}</p>
          </div>
          <button
            type="button"
            class="remove-product-btn"
            data-remove-id="${product.id}"
            aria-label="Remove ${product.name}"
          >
            Remove
          </button>
        </div>
      `,
    )
    .join("");
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map((product) => {
      const selectedClass = isProductSelected(product.id)
        ? " product-card--selected"
        : "";

      return `
          <button type="button" class="product-card${selectedClass}" data-product-id="${product.id}">
            <img src="${product.image}" alt="${product.name}">
            <div class="product-info">
              <h3>${product.name}</h3>
              <p>${product.brand}</p>
            </div>
          </button>
        `;
    })
    .join("");
}

/* Re-render the current category grid using the latest selection state */
function renderProducts() {
  const selectedCategory = categoryFilter.value;

  if (!selectedCategory) {
    productsContainer.innerHTML = `
      <div class="placeholder-message">
        Select a category to view products
      </div>
    `;
    return;
  }

  /* filter() creates a new array containing only products
     where the category matches what the user selected */
  const filteredProducts = allProducts.filter(
    (product) => product.category === selectedCategory,
  );

  displayProducts(filteredProducts);
}

/* Handle clicks on product cards */
productsContainer.addEventListener("click", (e) => {
  const card = e.target.closest(".product-card");

  if (!card) {
    return;
  }

  const productId = Number(card.dataset.productId);
  const product = allProducts.find((item) => item.id === productId);

  if (product) {
    toggleProductSelection(product);
  }
});

/* Handle clicks on remove buttons in the selected list */
selectedProductsList.addEventListener("click", (e) => {
  const removeButton = e.target.closest(".remove-product-btn");

  if (!removeButton) {
    return;
  }

  removeSelectedProduct(Number(removeButton.dataset.removeId));
});

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  renderProducts();
});

/* Load products once, then render the empty selected state */
loadProducts().then((products) => {
  allProducts = products;
  renderProducts();
  renderSelectedProducts();
});

const workerUrl = "https://teenyweeniedog.sophart.workers.dev/api";

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userInput = document.getElementById("userInput");
  const message = userInput.value.trim();

  if (!message) return;

  chatWindow.innerHTML += `<p><strong>You:</strong> ${message}</p>`;
  userInput.value = "";

  try {
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content:
              "You are a friendly L'Oréal beauty assistant. Only answer questions about L'Oréal products, skincare, makeup, haircare, fragrances, and routines.",
          },
          {
            role: "user",
            content: message,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();

    const reply =
      data.choices?.[0]?.message?.content || "No response received.";

    chatWindow.innerHTML += `<p><strong>AI:</strong> ${reply}</p>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;
  } catch (err) {
    console.error(err);
    chatWindow.innerHTML += `<p><strong>Error:</strong> ${err.message}</p>`;
  }
});
