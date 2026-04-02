namespace Orders.Api.Models;

record UserAccount
{
    public string Id { get; init; } = Guid.NewGuid().ToString("N");
    public string Login { get; init; } = default!;
    public string PasswordHash { get; init; } = default!; // demo only
    public Role Role { get; init; }
}
