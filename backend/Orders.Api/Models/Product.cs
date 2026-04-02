namespace Orders.Api.Models;

record Product
{
    public string Id { get; init; } = Guid.NewGuid().ToString("N");
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; }
}
