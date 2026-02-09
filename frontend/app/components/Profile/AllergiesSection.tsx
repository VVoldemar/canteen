import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Tag,
  Button,
  Select,
  Spin,
  Empty,
  Divider,
  Typography,
  theme,
  App,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { red } from "@ant-design/colors";
import { getIngredients } from "~/api/ingredients";
import { addAllergy, removeAllergy } from "~/api/users";
import { ApiException } from "~/api/errors";
import type { Ingredient, User } from "~/types";

const { Text } = Typography;

interface AllergiesSectionProps {
  user: User;
  onUpdate: () => Promise<void>;
}

export function AllergiesSection({ user, onUpdate }: AllergiesSectionProps) {
  const { message } = App.useApp();
  const { token } = theme.useToken();

  const [allergiesModalOpen, setAllergiesModalOpen] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [ingredientsLoading, setIngredientsLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [removingAllergyId, setRemovingAllergyId] = useState<number | null>(
    null,
  );
  const [hoveredAllergyId, setHoveredAllergyId] = useState<number | null>(null);

  const searchIngredients = useCallback(
    async (search: string) => {
      setIngredientsLoading(true);
      try {
        const response = await getIngredients({ search, limit: 20 });
        const allergyIds = new Set(user?.allergies?.map((a) => a.id) || []);
        setIngredients(response.items.filter((i) => !allergyIds.has(i.id)));
      } catch {
        setIngredients([]);
      } finally {
        setIngredientsLoading(false);
      }
    },
    [user?.allergies],
  );

  useEffect(() => {
    if (allergiesModalOpen) {
      searchIngredients("");
    }
  }, [allergiesModalOpen, searchIngredients]);

  const handleAddAllergy = async (ingredientId: number) => {
    try {
      await addAllergy({ ingredient_id: ingredientId });
      await onUpdate();
      setIngredients((prev) => prev.filter((i) => i.id !== ingredientId));
      message.success("Аллергия добавлена");
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Ошибка при добавлении аллергии");
      }
    }
  };

  const handleRemoveAllergy = async (ingredientId: number) => {
    setRemovingAllergyId(ingredientId);
    try {
      await removeAllergy(ingredientId);
      await onUpdate();
      message.success("Аллергия удалена");
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Ошибка при удалении аллергии");
      }
    } finally {
      setRemovingAllergyId(null);
    }
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
    searchIngredients(value);
  };

  return (
    <Card
      title="Мои аллергии"
      className="mt-6"
      extra={
        <Button
          type="primary"
          icon={allergiesModalOpen ? undefined : <PlusOutlined />}
          onClick={() => setAllergiesModalOpen(!allergiesModalOpen)}
        >
          {allergiesModalOpen ? "Отмена" : "Добавить"}
        </Button>
      }
    >
      {user.allergies && user.allergies.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-4">
          {user.allergies.map((ingredient) => (
            <Tag
              key={ingredient.id}
              className="cursor-pointer transition-all duration-200 px-3 py-1"
              style={{
                backgroundColor:
                  hoveredAllergyId === ingredient.id
                    ? red[5]
                    : token.colorBgContainer,
                color:
                  hoveredAllergyId === ingredient.id
                    ? token.colorWhite
                    : token.colorText,
                borderColor:
                  hoveredAllergyId === ingredient.id
                    ? red[5]
                    : token.colorBorder,
              }}
              onMouseEnter={() => setHoveredAllergyId(ingredient.id)}
              onMouseLeave={() => setHoveredAllergyId(null)}
              onClick={() => {
                if (removingAllergyId !== ingredient.id) {
                  handleRemoveAllergy(ingredient.id);
                }
              }}
            >
              <span>
                {removingAllergyId === ingredient.id
                  ? "Удаление..."
                  : ingredient.name}
              </span>
              {removingAllergyId === ingredient.id ? (
                <Spin
                  size="small"
                  indicator={<LoadingOutlined style={{ color: "#fff" }} spin />}
                />
              ) : (
                <DeleteOutlined />
              )}
            </Tag>
          ))}
        </div>
      ) : (
        <Text type="secondary" className="block mb-4">
          Аллергии не указаны
        </Text>
      )}

      {allergiesModalOpen && (
        <div>
          <Divider />
          <Text strong className="block mb-2">
            Добавить новую аллергию:
          </Text>
          <Select
            showSearch
            placeholder="Найдите ингредиент..."
            style={{ width: "100%" }}
            filterOption={false}
            onSearch={handleSearch}
            loading={ingredientsLoading}
            notFoundContent={
              ingredientsLoading ? (
                <Spin size="small" />
              ) : (
                <Empty description="Ингредиенты не найдены" />
              )
            }
            onChange={(value: number) => {
              handleAddAllergy(value);
              setSearchValue("");
            }}
            value={null}
          >
            {ingredients.map((ingredient) => (
              <Select.Option key={ingredient.id} value={ingredient.id}>
                {ingredient.name}
              </Select.Option>
            ))}
          </Select>
          <div className="mt-2">
            <Text type="secondary" className="text-sm">
              Выберите ингредиент из списка. Блюда с этими ингредиентами будут
              помечены.
            </Text>
          </div>
        </div>
      )}
    </Card>
  );
}
