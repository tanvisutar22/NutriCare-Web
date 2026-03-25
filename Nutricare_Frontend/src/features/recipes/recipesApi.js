import { http } from "../../shared/api/http";

export async function getFoods(params) {
  const res = await http.get("/recipe/foods", { params });
  return res.data;
}

export async function getRecipeByName(name) {
  const res = await http.get("/recipe/recipeByName", {
    params: { name },
  });
  return res.data;
}
