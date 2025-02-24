import { createSelector } from 'reselect';

// Base selector
const selectProductState = state => state.customersProduct;

// Memoized selectors
export const selectProducts = createSelector(
  [selectProductState],
  productState => productState.products
);

export const selectProductLoading = createSelector(
  [selectProductState],
  productState => productState.loading
);

export const selectProductError = createSelector(
  [selectProductState],
  productState => productState.error
);

export const selectProductById = createSelector(
  [selectProductState],
  productState => productState.product
);

export const selectProductsByCategory = (categoryId) => createSelector(
  [selectProducts],
  products => products[categoryId] || { content: [], totalPages: 0, currentPage: 0 }
); 