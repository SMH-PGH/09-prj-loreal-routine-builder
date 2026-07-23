/* Get references to DOM elements */
const generateRoutineBtn = document.getElementById("generateRoutine");
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const productPreview = document.getElementById("productPreview");
const selectedProductsList = document.getElementById("selectedProductsList");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

/* Keep track of the available products and the user's selections */
let allProducts = [];
let selectedProducts = [];
const selectedProductsStorageKey = "loreal-selected-products";

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

/* Save the selected product ids so the list stays after a refresh */
function savePreferences() {
  localStorage.setItem(
    selectedProductsStorageKey,
    JSON.stringify(selectedProducts.map((product) => product.id)),
  );
}

/* Restore the saved selections after products are loaded */
function loadPreferences() {
  const savedValue = localStorage.getItem(selectedProductsStorageKey);

  if (!savedValue) {
    selectedProducts = [];
    return;
  }

  try {
    const savedIds = JSON.parse(savedValue);

    if (!Array.isArray(savedIds)) {
      selectedProducts = [];
      return;
    }

    selectedProducts = allProducts.filter((product) =>
      savedIds.includes(product.id),
    );
  } catch {
    selectedProducts = [];
  }
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
      (selectedProduct) => selectedProduct.id !== product.id
    );
  } else {
    selectedProducts = [...selectedProducts, product];
  }

  savePreferences();

  renderProducts();
  renderSelectedProducts();
}

/* Remove a product directly from the selected list */
function removeSelectedProduct(productId) {
  selectedProducts = selectedProducts.filter(
    (product) => product.id !== productId
  );

  savePreferences();

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

/* Show a preview card for the hovered or focused product */
function showProductPreview(product) {
  productPreview.innerHTML = `
    <div class="product-preview-card">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-preview-content">
        <h3>${product.name}</h3>
        <p class="product-brand">${product.brand}</p>
        <p>${product.description}</p>
      </div>
    </div>
  `;
}

/* Reset the preview when the pointer leaves the grid */
function clearProductPreview() {
  productPreview.innerHTML = `
    <p class="product-preview-empty">Hover over a product to see a preview.</p>
  `;
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
    clearProductPreview();
    return;
  }

  /* filter() creates a new array containing only products
     where the category matches what the user selected */
  const filteredProducts = allProducts.filter(
    (product) => product.category === selectedCategory,
  );

  displayProducts(filteredProducts);
  clearProductPreview();
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

/* Show a product preview while hovering over a card */
productsContainer.addEventListener("mouseover", (e) => {
  const card = e.target.closest(".product-card");

  if (!card || !productsContainer.contains(card)) {
    return;
  }

  const productId = Number(card.dataset.productId);
  const product = allProducts.find((item) => item.id === productId);

  if (product) {
    showProductPreview(product);
  }
});

/* Keep the preview working for keyboard users too */
productsContainer.addEventListener("focusin", (e) => {
  const card = e.target.closest(".product-card");

  if (!card) {
    return;
  }

  const productId = Number(card.dataset.productId);
  const product = allProducts.find((item) => item.id === productId);

  if (product) {
    showProductPreview(product);
  }
});

/* Restore the default preview when the pointer leaves the grid */
productsContainer.addEventListener("mouseleave", clearProductPreview);

/* Clear the preview after keyboard focus leaves the grid */
productsContainer.addEventListener("focusout", (e) => {
  if (!productsContainer.contains(e.relatedTarget)) {
    clearProductPreview();
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
  loadPreferences();
  renderProducts();
  renderSelectedProducts();
  clearProductPreview();
});

const workerUrl = "https://teenyweeniedog.sophart.workers.dev/api";

/* Shared function to send requests to the AI */
async function sendToAI(userMessage) {
  const productList =
    selectedProducts.length > 0
      ? selectedProducts
          .map(
            (product) =>
              `${product.name} (${product.category}) - ${product.description}`
          )
          .join("\n")
      : "No products selected.";

  const response = await fetch(workerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        {
          role: "system",
          content: `
You are a friendly L'Oréal beauty assistant.

Only answer questions about L'Oréal products, skincare, makeup, haircare, fragrances, and routines.

If products are selected:
- Use ONLY the selected products when creating a routine.
- Put products in the correct order.
- Separate Morning and Evening routines.
- Briefly explain each step.
- Mention if a product is not for daily use.

If the user asks a general beauty question, answer normally.
`,
        },
        {
          role: "user",
          content: `
Selected Products:
${productList}

${userMessage}
`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Server returned ${response.status}`);
  }

  const data = await response.json();

  return data.choices?.[0]?.message?.content || "No response received.";
}

/* Chat */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userInput = document.getElementById("userInput");
  const message = userInput.value.trim();

  if (!message) return;

  chatWindow.innerHTML += `<p><strong>You:</strong> ${message}</p>`;
  userInput.value = "";

  try {
    const reply = await sendToAI(message);

    chatWindow.innerHTML += `<p><strong>AI:</strong> ${reply}</p>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;
  } catch (err) {
    chatWindow.innerHTML += `<p><strong>Error:</strong> ${err.message}</p>`;
  }
});

/* Generate Routine Button */
generateRoutineBtn.addEventListener("click", async () => {
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML +=
      `<p><strong>AI:</strong> Please select at least one product first.</p>`;
    return;
  }

  chatWindow.innerHTML +=
    `<p><strong>You:</strong> Generate my routine.</p>`;

  try {
    const reply = await sendToAI(
      "Generate a personalized morning and evening routine using ONLY the selected products."
    );

    chatWindow.innerHTML += `<p><strong>AI:</strong> ${reply}</p>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;
  } catch (err) {
    chatWindow.innerHTML += `<p><strong>Error:</strong> ${err.message}</p>`;
  }
});