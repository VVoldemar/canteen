import { Button, Typography, Space, Row, Col, Card, Flex } from "antd";
import { LoginOutlined, UserAddOutlined, AppleOutlined, CoffeeOutlined, SafetyOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { useEffect } from "react";
import type { Route } from "./+types/home";

const { Title, Paragraph, Text } = Typography;

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Школьная столовая — Главная" },
    { name: "description", content: "Автоматизированная информационная система школьного питания" },
  ];
}

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/menu");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl text-center">
        <Flex vertical gap="large" className="w-full">
          <Flex vertical gap="middle">
            <Title level={1} className="!mb-0">
              Школьная столовая
            </Title>
            <Paragraph className="text-base text-gray-600">
              Автоматизированная информационная система школьного питания
            </Paragraph>
          </Flex>

          <Row gutter={[16, 16]} className="my-8">
            <Col xs={24} sm={8}>
              <Flex vertical align="center">
                <CoffeeOutlined className="text-4xl text-blue-500" />
                <Text className="text-sm text-gray-600">Электронное меню</Text>
              </Flex>
            </Col>
            <Col xs={24} sm={8}>
              <Flex vertical align="center">
                <SafetyOutlined className="text-4xl text-blue-500" />
                <Text className="text-sm text-gray-600">Безопасные платежи</Text>
              </Flex>
            </Col>
            <Col xs={24} sm={8}>
              <Flex vertical align="center">
                <UserAddOutlined className="text-4xl text-blue-500" />
                <Text className="text-sm text-gray-600">Личный кабинет</Text>
              </Flex>
            </Col>
          </Row>

          <Space size="middle" wrap className="justify-center">
            <Button
              type="primary"
              size="large"
              icon={<LoginOutlined />}
              onClick={() => navigate("/login")}
            >
              Войти
            </Button>
            <Button
              size="large"
              icon={<UserAddOutlined />}
              onClick={() => navigate("/register")}
            >
              Регистрация
            </Button>
          </Space>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Flex vertical gap={0}>
              <Text type="secondary" className="text-xs">
                Московская предпрофессиональная олимпиада школьников
              </Text>
              <Text type="secondary" className="text-xs">
                Профиль «Информационные технологии»
              </Text>
            </Flex>
          </div>
        </Flex>
      </Card>
    </div>
  );
}
