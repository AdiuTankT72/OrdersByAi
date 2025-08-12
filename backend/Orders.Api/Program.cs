using System.Security.Claims;
using System.Text;
using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using Orders.Api;
using Orders.Api.Repositories.JsonBlob;

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

// Serve static files (frontend)
app.UseDefaultFiles();
app.UseStaticFiles();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Fallback for React Router (serve index.html for non-API routes)
app.MapFallbackToFile("/index.html");

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

app.MapGet("/api/products", [Authorize] async (ProductService svc)
=> Results.Ok(await svc.GetAllAsync()));
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
    Result<Order?> order = await orders.PlaceOrderAsync(userId, req.Items);
    return order.IsSuccess ? Results.Ok(order.Value) : Results.BadRequest(new { message = order.Error });
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

// Admin: delete order
app.MapDelete("/api/orders/{id}", [Authorize(Roles = "Admin")] async (string id, OrderService orders) =>
{
    var ok = await orders.DeleteOrderAsync(id);
    return ok ? Results.NoContent() : Results.NotFound();
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

enum OrderStatus { Oczekuje = 0, GotoweDoWysłania = 1, Wysłano = 2 }

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
    public OrderStatus Status { get; set; } = OrderStatus.Oczekuje;
    public List<OrderItem> Items { get; init; } = new();
}

record CreateOrderRequest(List<OrderItemRequest> Items);
record OrderItemRequest(string ProductId, int Quantity);
class UpdateStatusRequest
{
    public OrderStatus Status { get; set; }
}

// Stores
interface IUserStore
{
    Task<UserAccount?> FindByLoginAsync(string login);
    Task EnsureSeedAsync();
    Task<List<UserAccount>> GetAllAsync();
}
