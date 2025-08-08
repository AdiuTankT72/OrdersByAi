using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
// Services
class AuthService
{
    private readonly IUserStore _users;
    private readonly string _issuer;
    private readonly SymmetricSecurityKey _key;
    public AuthService(IUserStore users, IConfiguration cfg)
    {
        _users = users;
        _issuer = cfg["Jwt:Issuer"] ?? "OrdersApp";
        var jwtKey = cfg["Jwt:Key"] ?? "dev-secret-key-change-me-please";
        _key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
    }

    public async Task<string?> LoginAsync(string login, string password)
    {
        await _users.EnsureSeedAsync();
        var user = await _users.FindByLoginAsync(login);
        if (user is null) return null;
        // demo only: plain-text compare
        if (!string.Equals(user.PasswordHash, password)) return null;

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Name, user.Login),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var creds = new SigningCredentials(_key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: null,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
