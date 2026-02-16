import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  App,
  Breadcrumb,
  Button,
  Card,
  Col,
  InputNumber,
  Row,
  Space,
  Spin,
  Typography,
  Image,
} from "antd";
import { HomeOutlined, BookOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import type { Route } from "./+types/menu.$menuId";
import { ApiException } from "~/api/errors";
import { getMenu } from "~/api/menu";
import { getStaticUrl } from "~/api/client";
import type { MenuDetail } from "~/types";
import { useCart } from "~/context/CartContext";
import { CartButton } from "~/components/Cart";

const { Title, Text } = Typography;

const DISH_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%23999'%3EНет изображения%3C/text%3E%3C/svg%3E";

export function meta({ params }: Route.MetaArgs) {
  return [{ title: `Меню — Школьная столовая` }];
}

export default function MenuDetailPage({ params }: Route.ComponentProps) {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { addToCart } = useCart();
  const [menu, setMenu] = useState<MenuDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  const handleAddToCart = (dish: MenuDetail["items"][0]) => {
    const quantity = quantities[dish.id] || 1;
    addToCart(dish, quantity);
    message.success(`${dish.name} добавлено в корзину (${quantity} шт.)`);
    setQuantities((prev) => ({ ...prev, [dish.id]: 1 }));
  };

  const handleQuantityChange = (dishId: number, value: number | null) => {
    setQuantities((prev) => ({ ...prev, [dishId]: value || 1 }));
  };

  useEffect(() => {
    const loadMenu = async () => {
      const menuId = params.menuId;
      if (!menuId) return;

      setLoading(true);
      try {
        const response = await getMenu(Number(menuId));
        setMenu(response);
      } catch (error) {
        if (error instanceof ApiException) {
          message.error(error.error.message);
        } else {
          message.error("Не удалось загрузить меню");
        }
        navigate("/menu");
      } finally {
        setLoading(false);
      }
    };

    loadMenu();
  }, [params.menuId, message, navigate]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!menu) {
    return null;
  }

  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 24 }}
        items={[
          {
            href: "/",
            title: <HomeOutlined />,
          },
          {
            href: "/menu",
            title: (
              <>
                <BookOutlined />
                <span>Меню</span>
              </>
            ),
          },
          {
            title: menu.name,
          },
        ]}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>{menu.name}</Title>
        <CartButton />
      </div>

      {menu.items.length === 0 ? (
        <Text type="secondary">В этом меню пока нет блюд</Text>
      ) : (
        <Row gutter={[16, 16]}>
          {menu.items.map((dish) => (
            <Col key={dish.id} xs={24} sm={12} md={8} lg={6}>
              <Card
                hoverable
                cover={
                  <div style={{ height: 200, overflow: "hidden", background: "#f0f0f0" }}>
                    <Image
                      alt={dish.name}
                      src={dish.image_url ? getStaticUrl(dish.image_url) : DISH_PLACEHOLDER}
                      height={200}
                      width="100%"
                      style={{ objectFit: "cover" }}
                      preview={!!dish.image_url}
                      fallback={DISH_PLACEHOLDER}
                    />
                  </div>
                }
                styles={{
                  body: {
                    padding: 16,
                  },
                }}
              >
                <Space orientation="vertical" style={{ width: "100%" }} size="middle">
                  <Card.Meta
                    title={<div style={{ fontSize: 16 }}>{dish.name}</div>}
                    description={
                      <Text strong style={{ fontSize: 18, color: "#52c41a" }}>
                        {(dish.price / 100).toFixed(2)} ₽
                      </Text>
                    }
                  />
                  <Space style={{ width: "100%" }}>
                    <InputNumber
                      min={1}
                      max={99}
                      value={quantities[dish.id] || 1}
                      onChange={(value) => handleQuantityChange(dish.id, value)}
                      style={{ width: 60 }}
                    />
                    <Button
                      type="primary"
                      icon={<ShoppingCartOutlined />}
                      onClick={() => handleAddToCart(dish)}
                      block
                    >
                      В корзину
                    </Button>
                  </Space>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
