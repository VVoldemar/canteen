import { useCallback, useState } from "react";
import { App } from "antd";
import type { Ingredient } from "~/types";
import { getIngredients } from "~/api/ingredients";
import { ApiException } from "~/api/errors";

export function useIngredients() {
  const { message } = App.useApp();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);

  const loadIngredients = useCallback(async () => {
    if (ingredients.length > 0) return;
    setLoading(true);
    try {
      const response = await getIngredients({ page: 1, limit: 100 });
      setIngredients(response.items);
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Не удалось загрузить ингредиенты");
      }
    } finally {
      setLoading(false);
    }
  }, [ingredients.length, message]);

  return { ingredients, loading, loadIngredients };
}
