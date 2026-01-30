import { useState } from "react";
import { Form, Input, Button, Card, Typography, App } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useNavigate, Link } from "react-router";
import type { Route } from "./+types/login";
import type { LoginRequest } from "~/types";
import { login } from "~/api/auth";
import { getCurrentUser } from "~/api/auth";
import { useAuth } from "~/context/AuthContext";
import { ApiException } from "~/api/errors";

const { Title, Text } = Typography;

export function meta({}: Route.MetaArgs) {
  return [{ title: "Вход — Школьная столовая" }];
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { message } = App.useApp();

  const onFinish = async (values: LoginRequest) => {
    setLoading(true);

    try {
      await login(values);
      const user = await getCurrentUser();
      setUser(user);
      message.success("Добро пожаловать!");
      navigate("/");
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Ошибка при входе");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <Title level={2}>Вход в систему</Title>
          <Text type="secondary">Школьная столовая</Text>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[{ required: true, message: "Введите email" }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Введите пароль" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Пароль"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              Войти
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center">
          <Text>Нет аккаунта? </Text>
          <Link to="/register">Зарегистрироваться</Link>
        </div>
      </Card>
    </div>
  );
}