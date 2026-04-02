namespace Orders.Api.Models;

record Order
{
    public string Id { get; init; } = Guid.NewGuid().ToString("N");
    public string UserId { get; init; } = default!;
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public OrderStatus Status { get; set; } = OrderStatus.Oczekuje;
    public List<OrderItem> Items { get; init; } = new();
}
