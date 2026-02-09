import { Button, Form, InputNumber, Modal, Select, Space } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import type { FormInstance } from "antd";
import { Typography } from "antd";
import type { CreateApplicationRequest, Ingredient } from "~/types";

const { Text } = Typography;

interface CreateApplicationModalProps {
  open: boolean;
  saving: boolean;
  ingredients: Ingredient[];
  ingredientsLoading: boolean;
  form: FormInstance<CreateApplicationRequest>;
  onCancel: () => void;
  onOk: () => void;
}

export function CreateApplicationModal({
  open,
  saving,
  ingredients,
  ingredientsLoading,
  form,
  onCancel,
  onOk,
}: CreateApplicationModalProps) {
  return (
    <Modal
      open={open}
      title="Новая заявка"
      onCancel={onCancel}
      onOk={onOk}
      okText="Создать"
      confirmLoading={saving}
      width={720}
    >
      <Form form={form} layout="vertical">
        <Form.List
          name="products"
          rules={[
            {
              validator: async (_, value) => {
                if (!value || value.length < 1) {
                  return Promise.reject(
                    new Error("Добавьте хотя бы один ингредиент"),
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          {(fields, { add, remove }, { errors }) => (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Text strong>Ингредиенты</Text>
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => add()}
                  disabled={ingredientsLoading}
                >
                  Добавить
                </Button>
              </div>
              {fields.map((field) => (
                <Form.Item
                  key={field.key}
                  shouldUpdate={(prevValues, curValues) =>
                    prevValues.products?.[field.name]?.ingredient_id !==
                    curValues.products?.[field.name]?.ingredient_id
                  }
                  noStyle
                >
                  {() => {
                    const selectedIngredientId = form.getFieldValue([
                      "products",
                      field.name,
                      "ingredient_id",
                    ]);
                    const selectedIngredient = ingredients.find(
                      (i) => i.id === selectedIngredientId,
                    );
                    const unit = selectedIngredient?.measure === "Kg" ? "кг" : "л";

                    return (
                      <Space align="baseline">
                        <Form.Item
                          {...field}
                          name={[field.name, "ingredient_id"]}
                          rules={[
                            { required: true, message: "Выберите ингредиент" },
                          ]}
                        >
                          <Select
                            placeholder="Ингредиент"
                            loading={ingredientsLoading}
                            options={ingredients.map((ingredient) => ({
                              label: ingredient.name,
                              value: ingredient.id,
                            }))}
                            style={{ width: 260 }}
                          />
                        </Form.Item>
                        <Form.Item
                          {...field}
                          name={[field.name, "quantity"]}
                          rules={[
                            { required: true, message: "Введите количество" },
                          ]}
                        >
                          <InputNumber
                            min={1}
                            placeholder="Кол-во"
                            addonAfter={selectedIngredient ? unit : undefined}
                          />
                        </Form.Item>
                        <Button
                          icon={<DeleteOutlined />}
                          onClick={() => remove(field.name)}
                        />
                      </Space>
                    );
                  }}
                </Form.Item>
              ))}
              <Form.ErrorList errors={errors} />
            </div>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
}
