export { default as apiClient } from "./client";
export {
  getToken,
  setToken,
  removeToken,
  getRefreshToken,
  setRefreshToken,
  setTokens,
  removeTokens,
} from "./client";
export { ApiException } from "./errors";
export type { ApiError } from "./errors";
export { login, register, logout, refreshSession, getCurrentUser } from "./auth";
export {
  getUsers,
  getUser,
  updateUserAdmin,
  updateProfile,
  getAllergies,
  addAllergy,
  removeAllergy,
} from "./users";
export {
  getIngredients,
  getIngredient,
  createIngredient,
  updateIngredient,
  deleteIngredient,
} from "./ingredients";
export {
  getDishes,
  getDish,
  createDish,
  updateDish,
  deleteDish,
} from "./dishes";
export {
  getMenus,
  getMenu,
  createMenu,
  updateMenu,
  deleteMenu,
} from "./menu";
export {
  getOrders,
  getOrder,
  createOrder,
  cancelOrder,
  confirmOrderReceipt,
  serveOrder,
} from "./orders";
