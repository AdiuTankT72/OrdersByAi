using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// Configuration
var configuration = builder.Configuration;

// Services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors();

// JWT Auth (simple symmetric key)
var jwtKey = configuration["Jwt:Key"] ?? "dev-secret-key-change-me-please";
var jwtIssuer = configuration["Jwt:Issuer"] ?? "OrdersApp";
var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            IssuerSigningKey = key
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
});

// Blob storage config
builder.Services.AddSingleton(sp =>
{
    var conn = configuration.GetValue<string>("Azure:BlobConnectionString");
    if (string.IsNullOrWhiteSpace(conn))
    {
        // Allow Azurite/local emulator by default
        conn = "UseDevelopmentStorage=true";
    }
    return new BlobServiceClient(conn);
});

builder.Services.AddSingleton<IJsonBlobStore, JsonBlobStore>();
builder.Services.AddSingleton<IUserStore, UserStore>();
builder.Services.AddSingleton<IProductStore, ProductStore>();
builder.Services.AddSingleton<IOrderStore, OrderStore>();
builder.Services.AddSingleton<AuthService>();
builder.Services.AddSingleton<ProductService>();
builder.Services.AddSingleton<OrderService>();

builder.Services.Configure<Microsoft.AspNetCore.Http.Json.JsonOptions>(options =>
{
    options.SerializerOptions.PropertyNameCaseInsensitive = true;
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();

// CORS for local Vite dev server
app.UseCors(policy => policy
    .WithOrigins("http://localhost:5173")
    .AllowAnyHeader()
    .AllowAnyMethod());

// Minimal API endpoints
app.MapPost("/api/auth/login", async (LoginRequest req, AuthService auth) =>
{
    var token = await auth.LoginAsync(req.Login, req.Password);
    return token is null ? Results.Unauthorized() : Results.Ok(new { token });
});

app.MapGet("/api/products", [Authorize] async (ProductService svc) => Results.Ok(await svc.GetAllAsync()));
app.MapPost("/api/products", [Authorize(Roles = "Admin")] async (ProductDto dto, ProductService svc) => Results.Ok(await svc.AddAsync(dto)));
app.MapPut("/api/products/{id}", [Authorize(Roles = "Admin")] async (string id, ProductDto dto, ProductService svc) =>
{
    dto.Id = id;
    var ok = await svc.UpdateAsync(dto);
    return ok ? Results.NoContent() : Results.NotFound();
});
app.MapDelete("/api/products/{id}", [Authorize(Roles = "Admin")] async (string id, ProductService svc) =>
{
    var ok = await svc.DeleteAsync(id);
    return ok ? Results.NoContent() : Results.NotFound();
});

app.MapPost("/api/orders", [Authorize] async (CreateOrderRequest req, ClaimsPrincipal user, OrderService orders) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var order = await orders.PlaceOrderAsync(userId, req.Items);
    return order is null ? Results.BadRequest(new { message = "Brak towaru" }) : Results.Ok(order);
});

app.MapGet("/api/orders/me", [Authorize] async (ClaimsPrincipal user, OrderService orders) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
    return Results.Ok(await orders.GetByUserAsync(userId));
});

app.MapGet("/api/orders", [Authorize(Roles = "Admin")] async (OrderService orders) => Results.Ok(await orders.GetAllAsync()));

app.MapPut("/api/orders/{id}/status", [Authorize(Roles = "Admin")] async (string id, UpdateStatusRequest req, OrderService orders) =>
{
    var ok = await orders.UpdateStatusAsync(id, req.Status);
    return ok ? Results.NoContent() : Results.NotFound();
});

// Admin: get all users (id, login)
app.MapGet("/api/users", [Authorize(Roles = "Admin")] async (IUserStore users) =>
{
    var list = await users.GetAllAsync();
    return Results.Ok(list.Select(u => new { u.Id, u.Login }));
});

app.Run();

// Models and DTOs
record LoginRequest(string Login, string Password);

enum Role { Admin, User }

record UserAccount
{
    public string Id { get; init; } = Guid.NewGuid().ToString("N");
    public string Login { get; init; } = default!;
    public string PasswordHash { get; init; } = default!; // demo only
    public Role Role { get; init; }
}

record Product
{
    public string Id { get; init; } = Guid.NewGuid().ToString("N");
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; }
}

record ProductDto
{
    public string? Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; }
}

enum OrderStatus { ToDo, ToBeSent, Sent }

record OrderItem
{
    public string ProductId { get; init; } = default!;
    public string Name { get; init; } = default!;
    public int Quantity { get; init; }
}

record Order
{
    public string Id { get; init; } = Guid.NewGuid().ToString("N");
    public string UserId { get; init; } = default!;
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public OrderStatus Status { get; set; } = OrderStatus.ToDo;
    public List<OrderItem> Items { get; init; } = new();
}

record CreateOrderRequest(List<OrderItemRequest> Items);
record OrderItemRequest(string ProductId, int Quantity);
class UpdateStatusRequest
{
    public OrderStatus Status { get; set; }
}

// Storage abstractions
interface IJsonBlobStore
{
    Task<IReadOnlyList<T>> LoadListAsync<T>(string container, string blobName);
    Task SaveListAsync<T>(string container, string blobName, IReadOnlyList<T> list);
}

class JsonBlobStore : IJsonBlobStore
{
    private readonly BlobServiceClient _service;
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    public JsonBlobStore(BlobServiceClient service) => _service = service;

    public async Task<IReadOnlyList<T>> LoadListAsync<T>(string container, string blobName)
    {
        var client = _service.GetBlobContainerClient(container);
        await client.CreateIfNotExistsAsync(PublicAccessType.None);
        var blob = client.GetBlobClient(blobName);
        if (!await blob.ExistsAsync()) return new List<T>();
        var resp = await blob.DownloadContentAsync();
        var json = resp.Value.Content.ToString();
        return JsonSerializer.Deserialize<List<T>>(json, JsonOptions) ?? new List<T>();
    }

    public async Task SaveListAsync<T>(string container, string blobName, IReadOnlyList<T> list)
    {
        var client = _service.GetBlobContainerClient(container);
        await client.CreateIfNotExistsAsync(PublicAccessType.None);
        var blob = client.GetBlobClient(blobName);
        var json = JsonSerializer.Serialize(list, JsonOptions);
        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(json));
        await blob.UploadAsync(stream, overwrite: true);
    }
}

// Stores
interface IUserStore
{
    Task<UserAccount?> FindByLoginAsync(string login);
    Task EnsureSeedAsync();
    Task<List<UserAccount>> GetAllAsync();
}

class UserStore : IUserStore
{
    private readonly IJsonBlobStore _store;
    private const string Container = "data";
    private const string BlobName = "users.json";
    private List<UserAccount>? _cache;
    public UserStore(IJsonBlobStore store) => _store = store;

    public async Task EnsureSeedAsync()
    {
        var list = (await _store.LoadListAsync<UserAccount>(Container, BlobName)).ToList();
        if (list.Count == 0)
        {
            list.Add(new UserAccount { Login = "admin", PasswordHash = "admin", Role = Role.Admin });
            list.Add(new UserAccount { Login = "user", PasswordHash = "user", Role = Role.User });
            await _store.SaveListAsync(Container, BlobName, list);
        }
        _cache = list;
    }

    private async Task<List<UserAccount>> LoadAsync()
    {
        if (_cache is null)
        {
            _cache = (await _store.LoadListAsync<UserAccount>(Container, BlobName)).ToList();
        }
        return _cache;
    }

    public async Task<UserAccount?> FindByLoginAsync(string login)
    {
        var list = await LoadAsync();
        return list.FirstOrDefault(u => u.Login.Equals(login, StringComparison.OrdinalIgnoreCase));
    }

    public async Task<List<UserAccount>> GetAllAsync()
    {
        return await LoadAsync();
    }
}

interface IProductStore
{
    Task<List<Product>> GetAllAsync();
    Task SaveAllAsync(List<Product> products);
}

class ProductStore : IProductStore
{
    private readonly IJsonBlobStore _store;
    private const string Container = "data";
    private const string BlobName = "products.json";
    public ProductStore(IJsonBlobStore store) => _store = store;

    public Task<List<Product>> GetAllAsync() => _store.LoadListAsync<Product>(Container, BlobName).ContinueWith(t => t.Result.ToList());
    public Task SaveAllAsync(List<Product> products) => _store.SaveListAsync(Container, BlobName, products);
}

interface IOrderStore
{
    Task<List<Order>> GetAllAsync();
    Task SaveAllAsync(List<Order> orders);
}

class OrderStore : IOrderStore
{
    private readonly IJsonBlobStore _store;
    private const string Container = "data";
    private const string BlobName = "orders.json";
    public OrderStore(IJsonBlobStore store) => _store = store;

    public Task<List<Order>> GetAllAsync() => _store.LoadListAsync<Order>(Container, BlobName).ContinueWith(t => t.Result.ToList());
    public Task SaveAllAsync(List<Order> orders) => _store.SaveListAsync(Container, BlobName, orders);
}

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

class ProductService
{
    private readonly IProductStore _products;
    public ProductService(IProductStore products) => _products = products;

    public async Task<List<Product>> GetAllAsync() => await _products.GetAllAsync();

    public async Task<Product> AddAsync(ProductDto dto)
    {
        var list = await _products.GetAllAsync();
        var p = new Product { Name = dto.Name, Quantity = dto.Quantity };
        list.Add(p);
        await _products.SaveAllAsync(list);
        return p;
    }

    public async Task<bool> UpdateAsync(ProductDto dto)
    {
        var list = await _products.GetAllAsync();
        var p = list.FirstOrDefault(x => x.Id == dto.Id);
        if (p is null) return false;
        p.Name = dto.Name;
        p.Quantity = dto.Quantity;
        await _products.SaveAllAsync(list);
        return true;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var list = await _products.GetAllAsync();
        var removed = list.RemoveAll(p => p.Id == id) > 0;
        if (removed) await _products.SaveAllAsync(list);
        return removed;
    }
}

class OrderService
{
    private readonly IOrderStore _orders;
    private readonly IProductStore _products;
    public OrderService(IOrderStore orders, IProductStore products)
    {
        _orders = orders;
        _products = products;
    }

    public async Task<Order?> PlaceOrderAsync(string userId, List<OrderItemRequest> items)
    {
        if (items is null || items.Count == 0) return null;
        var products = await _products.GetAllAsync();

        // Validate stock
        foreach (var i in items)
        {
            var p = products.FirstOrDefault(p => p.Id == i.ProductId);
            if (p is null || i.Quantity <= 0 || i.Quantity > p.Quantity) return null;
        }

        // Subtract stock
        foreach (var i in items)
        {
            var p = products.First(p => p.Id == i.ProductId);
            p.Quantity -= i.Quantity;
        }
        await _products.SaveAllAsync(products);

        var order = new Order
        {
            UserId = userId,
            Items = items.Select(i =>
            {
                var p = products.First(pp => pp.Id == i.ProductId);
                return new OrderItem { ProductId = p.Id, Name = p.Name, Quantity = i.Quantity };
            }).ToList()
        };

        var all = await _orders.GetAllAsync();
        all.Add(order);
        await _orders.SaveAllAsync(all);
        return order;
    }

    public async Task<List<Order>> GetByUserAsync(string userId)
    {
        var all = await _orders.GetAllAsync();
        return all.Where(o => o.UserId == userId).OrderByDescending(o => o.CreatedAt).ToList();
    }

    public Task<List<Order>> GetAllAsync() => _orders.GetAllAsync();

    public async Task<bool> UpdateStatusAsync(string id, OrderStatus status)
    {
        var all = await _orders.GetAllAsync();
        var o = all.FirstOrDefault(o => o.Id == id);
        if (o is null) return false;
        o.Status = status;
        await _orders.SaveAllAsync(all);
        return true;
    }
}
