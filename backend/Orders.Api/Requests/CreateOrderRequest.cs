namespace Orders.Api.Requests;

record CreateOrderRequest(List<OrderItemRequest> Items);
