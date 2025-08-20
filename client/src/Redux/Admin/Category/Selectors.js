import { createSelector } from 'reselect';

// Base selector
const selectCategoryState = state => state.category || {};

// Memoized selectors
export const selectCategories = createSelector(
  [selectCategoryState],
  categoryState => categoryState.categories || []
);

export const selectCategoryLoading = createSelector(
  [selectCategoryState],
  categoryState => categoryState.loading || false
);

export const selectCategoryError = createSelector(
  [selectCategoryState],
  categoryState => categoryState.error || null
);

export const selectLevel3Categories = createSelector(
  [selectCategories],
  categories => {
    return categories.filter(cat => cat.level === 3);
  }
);

export const selectFeaturedCategories = createSelector(
  [selectCategories],
  categories => {
    const featured = categories.filter(cat => cat.featuredInCarousel === true);
    return featured;
  }
); 