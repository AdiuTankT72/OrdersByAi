export async function deleteOrder(id: string) {
  await api.delete(`/api/orders/${id}`);
}
export type User = { id: string; login: string };

export async function getUsers(): Promise<User[]> {
  const { data } = await api.get<User[]>("/api/users");
  return data;
}
import axios from "axios";

// If VITE_API_URL is empty string, we're in Azure environment, use relative URL
// If VITE_API_URL has a value, use that, otherwise fall back to localhost
const API_URL =
  import.meta.env.VITE_API_URL === ""
    ? ""
    : import.meta.env.VITE_API_URL || "http://localhost:5142";

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Types
export type Role = "Admin" | "User";
export type Product = { id: string; name: string; quantity: number };
export type ProductDto = { id?: string; name: string; quantity: number };
export type OrderStatus = "Oczekuje" | "Gotowe do wysłania" | "Wysłano";
export type OrderItem = { productId: string; name: string; quantity: number };
export type Order = {
  id: string;
  userId: string;
  createdAt: string;
  status: OrderStatus;
  items: OrderItem[];
};

export async function login(login: string, password: string) {
  const { data } = await api.post<{ token: string }>("/api/auth/login", {
    login,
    password,
  });
  localStorage.setItem("token", data.token);
  return data.token;
}

export async function getProducts() {
  const { data } = await api.get<Product[]>("/api/products");
  return data;
}
export async function addProduct(dto: ProductDto) {
  const { data } = await api.post<Product>("/api/products", dto);
  return data;
}
export async function updateProduct(id: string, dto: ProductDto) {
  await api.put(`/api/products/${id}`, dto);
}
export async function deleteProduct(id: string) {
  await api.delete(`/api/products/${id}`);
}

export async function placeOrder(
  items: { productId: string; quantity: number }[]
) {
  const { data } = await api.post<Order>("/api/orders", { items });
  return data;
}

export async function myOrders() {
  const { data } = await api.get<Order[]>("/api/orders/me");
  return data;
}

export async function allOrders() {
  const { data } = await api.get<Order[]>("/api/orders");
  return data;
}

export async function updateOrderStatus(id: string, status: number) {
  const payload = { Status: status };
  console.log("Sending status update payload:", payload);
  await api.put(`/api/orders/${id}/status`, payload);
}
