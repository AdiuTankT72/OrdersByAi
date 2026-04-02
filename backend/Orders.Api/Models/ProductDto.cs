namespace Orders.Api.Models;

record ProductDto
{
    public string? Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; }
}
