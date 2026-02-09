import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  index("routes/home.tsx"),

  layout("routes/_app.tsx", [
    route("profile", "routes/profile.tsx"),
    route("menu", "routes/menu.tsx"),
    route("dishes", "routes/dishes.tsx"),
    route("orders", "routes/orders.tsx"),
    route("reviews", "routes/reviews.tsx"),
    route("subscriptions", "routes/subscriptions.tsx"),
    route("applications", "routes/applications.tsx"),
    route("ingredients", "routes/ingredients.tsx"),
    route("users", "routes/users.tsx"),
    route("statistics", "routes/statistics.tsx"),
    route("reports", "routes/reports.tsx"),
    route("notifications", "routes/notifications.tsx"),
  ]),
] satisfies RouteConfig;
