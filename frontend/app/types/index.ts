export type OrderStatus = "paid" | "served" | "cancelled";

export type Measure = "Kg" | "L";

export type UserRole = "student" | "cook" | "admin";

export interface User {
  id: number;
  name: string;
  surname: string;
  patronymic?: string;
  role: UserRole;
  email?: string;
  registered_at?: string;
  banned?: boolean;
  subscription_start?: string | null;
  subscription_days?: number | null;
  balance?: number;
  is_banned?: boolean;
  allergies?: Ingredient[];
}

export interface UpdateUserRequest {
  name?: string;
  surname?: string;
  patronymic?: string;
  password?: string;
}

export interface AdminUpdateUserRequest {
  role?: UserRole;
  banned?: boolean;
}

export interface AddAllergyRequest {
  ingredient_id: number;
}

export interface Ingredient {
  id: number;
  name: string;
  price: number;
  measure: Measure;
}

export interface CreateIngredientRequest {
  name: string;
  price: number;
  measure: Measure;
}

export interface UpdateIngredientRequest {
  name?: string;
  price?: number;
  measure?: Measure;
}

export interface Dish {
  id: number;
  name: string;
  price: number;
}

export interface DishIngredient {
  ingredient: Ingredient;
  amount_thousandth_measure: number;
}

export interface DishDetail extends Dish {
  ingredients: DishIngredient[];
}

export interface DishIngredientLink {
  ingredient_id: number;
  amount_thousandth_measure: number;
}

export interface Menu {
  id: number;
  name: string;
}

export interface MenuDetail extends Menu {
  items: Dish[];
}

export interface CreateMenuRequest {
  name: string;
  dish_ids?: number[];
}

export interface UpdateMenuRequest {
  name?: string;
  dish_ids?: number[];
}

export interface Order {
  id: number;
  user_id: number;
  ordered_at: string;
  completed_at?: string | null;
  status: OrderStatus;
}

export interface OrderDish {
  dish: Dish;
  quantity: number;
}

export interface OrderDetail extends Order {
  dishes: OrderDish[];
}

export interface OrderDishLink {
  dish_id: number;
  quantity: number;
}

export interface CreateOrderRequest {
  dishes: OrderDishLink[];
}

export interface Review {
  id: number;
  user_id: number;
  dish_id: number;
  rating?: number | null;
  content?: string | null;
  datetime: string;
}

export interface CreateReviewRequest {
  rating?: number | null;
  content: string;
}

export interface UpdateReviewRequest {
  rating?: number | null;
  content?: string | null;
}

export interface UserShort {
  id: number;
  name: string;
  surname: string;
  patronymic?: string;
}

export interface Application {
  id: number;
  user_id: number;
  applicant: UserShort;
  datetime: string;
  status: OrderStatus;
  rejection_reason?: string | null;
}

export interface ApplicationProduct {
  ingredient: Ingredient;
  quantity: number;
}

export interface ApplicationDetail extends Application {
  products: ApplicationProduct[];
}

export interface ApplicationProductLink {
  ingredient_id: number;
  quantity: number;
}

export interface CreateApplicationRequest {
  products: ApplicationProductLink[];
}

export interface ApplicationRejectRequest {
  reason?: string;
}

export interface Subscription {
  user_id: number;
  subscription_start: string;
  subscription_days: number;
  days_remaining: number;
  is_active: boolean;
}

export interface PurchaseSubscriptionRequest {
  days: number;
}

export interface Period {
  from: string;
  to: string;
}

export interface PaymentStatisticsResponse {
  total_amount: number;
  orders_count: number;
  subscriptions_count: number;
  average_order_amount: number;
  period: Period;
}

export interface AttendanceStatisticsByDay {
  date: string;
  served: number;
  paid: number;
}

export interface AttendanceStatisticsResponse {
  total_served: number;
  total_paid: number;
  attendance_rate: number;
  by_date: AttendanceStatisticsByDay[];
}

export interface DishStatistic {
  dish: Dish;
  orders_count: number;
  average_rating?: number | null;
  reviews_count: number;
}

export interface DishStatisticsResponse {
  dishes: DishStatistic[];
}

export interface CostsReportResponse {
  from: string;
  to: string;
  procurement_applications: number;
  estimated_total_cost_kopecks: number;
}

export interface NutritionDishBreakdown {
  dish_id: number;
  dish_name: string;
  quantity: number;
}

export interface NutritionReportResponse {
  from: string;
  to: string;
  served_orders: number;
  dishes_breakdown: NutritionDishBreakdown[];
}

export interface Notification {
  id: number;
  user_id?: number | null;
  created_at: string;
  title: string;
  body: string;
  read: boolean;
}

export interface CreateDishRequest {
  name: string;
  price: number;
  ingredients: DishIngredientLink[];
}

export interface UpdateDishRequest {
  name?: string;
  price?: number;
  ingredients?: DishIngredientLink[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  surname: string;
  patronymic?: string;
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
