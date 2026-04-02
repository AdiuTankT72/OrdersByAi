namespace Orders.Api.Models;

record OrderItem
{
    public string ProductId { get; init; } = default!;
    public string Name { get; init; } = default!;
    public int Quantity { get; init; }
}
