import { useState } from "react";
import { Form, Input, Button, Card, Typography, App } from "antd";
import { UserOutlined, LockOutlined, IdcardOutlined } from "@ant-design/icons";
import { useNavigate, Link } from "react-router";
import type { Route } from "./+types/register";
import type { RegisterRequest } from "~/types";
import { register, getCurrentUser } from "~/api/auth";
import { useAuth } from "~/context/AuthContext";
import { ApiException } from "~/api/errors";

const { Title, Text } = Typography;

export function meta({}: Route.MetaArgs) {
  return [{ title: "Регистрация — Школьная столовая" }];
}

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { message } = App.useApp();

  const onFinish = async (
    values: RegisterRequest & { confirmPassword: string },
  ) => {
    setLoading(true);

    try {
      const { confirmPassword, ...payload } = values;
      await register(payload);
      const user = await getCurrentUser();
      setUser(user);

      message.success("Регистрация успешна!");
      navigate("/");
    } catch (error) {
      if (error instanceof ApiException) {
        if (error.status === 409) {
          message.error("Пользователь уже существует");
        } else {
          message.error(error.error.message);
        }
      } else {
        message.error("Ошибка при регистрации");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <Title level={2}>Регистрация</Title>
          <Text type="secondary">Создайте аккаунт ученика</Text>
        </div>

        <Form
          name="register"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="surname"
            rules={[{ required: true, message: "Введите фамилию" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Фамилия" />
          </Form.Item>

          <Form.Item
            name="name"
            rules={[{ required: true, message: "Введите имя" }]}
          >
            <Input prefix={<IdcardOutlined />} placeholder="Имя" />
          </Form.Item>

          <Form.Item name="patronymic">
            <Input
              prefix={<IdcardOutlined />}
              placeholder="Отчество (необязательно)"
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Введите email" },
              { type: "email", message: "Некорректный email" },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Email" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: "Введите пароль" },
              { min: 6, message: "Минимум 6 символов" },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Пароль" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Подтвердите пароль" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Пароли не совпадают"));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Подтвердите пароль"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Зарегистрироваться
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center">
          <Text>Уже есть аккаунт? </Text>
          <Link to="/login">Войти</Link>
        </div>
      </Card>
    </div>
  );
}
