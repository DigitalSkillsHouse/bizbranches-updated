import { CategoryIndexClient } from "./category-index-client";
import { fetchCategoriesForIndex } from "./fetch-categories-index";

export const revalidate = 600;

export default async function CategoryIndexPage() {
  const categories = await fetchCategoriesForIndex();
  return <CategoryIndexClient initialCategories={categories} />;
}
