import type {
  CreateReviewRequest,
  PaginatedResponse,
  Review,
  UpdateReviewRequest,
} from "~/types";
import apiClient from "./client";

export interface GetReviewsParams {
  page?: number;
  limit?: number;
  dish_id?: number;
}

export async function getReviews(
  params: GetReviewsParams = {},
): Promise<PaginatedResponse<Review>> {
  const limit = Math.min(params.limit ?? 20, 100);
  const response = await apiClient.get<PaginatedResponse<Review>>("/reviews", {
    params: {
      page: params.page ?? 1,
      limit,
      dish_id: params.dish_id,
    },
  });
  return response.data;
}

export async function createReview(
  dishId: number,
  data: CreateReviewRequest,
): Promise<Review> {
  const response = await apiClient.post<Review>(`/reviews/${dishId}`, data);
  return response.data;
}

export async function updateReview(
  reviewId: number,
  data: UpdateReviewRequest,
): Promise<Review> {
  const response = await apiClient.patch<Review>(`/reviews/${reviewId}`, data);
  return response.data;
}

export async function deleteReview(reviewId: number): Promise<void> {
  await apiClient.delete(`/reviews/${reviewId}`);
}
