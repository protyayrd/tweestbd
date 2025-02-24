import { createSelector } from 'reselect';

// Base selector
const selectCategoryState = state => state.category;

// Memoized selectors
export const selectCategories = createSelector(
  [selectCategoryState],
  categoryState => categoryState.categories
);

export const selectCategoryLoading = createSelector(
  [selectCategoryState],
  categoryState => categoryState.loading
);

export const selectCategoryError = createSelector(
  [selectCategoryState],
  categoryState => categoryState.error
);

export const selectLevel3Categories = createSelector(
  [selectCategories],
  categories => {
    console.log('Filtering level 3 categories from:', categories);
    return categories.filter(cat => cat.level === 3);
  }
);

export const selectFeaturedCategories = createSelector(
  [selectCategories],
  categories => {
    console.log('Filtering featured categories from:', categories);
    const featured = categories.filter(cat => cat.featuredInCarousel === true);
    console.log('Found featured categories:', featured);
    return featured;
  }
); 