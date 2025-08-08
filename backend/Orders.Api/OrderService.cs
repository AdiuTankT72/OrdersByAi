class OrderService
{
    private readonly IOrderStore _orders;
    private readonly IProductStore _products;
    public OrderService(IOrderStore orders, IProductStore products)
    {
        _orders = orders;
        _products = products;
    }

    public async Task<bool> DeleteOrderAsync(string id)
    {
        var all = await _orders.GetAllAsync();
        var countBefore = all.Count;
        all = all.Where(o => o.Id != id).ToList();
        if (all.Count == countBefore) return false;
        await _orders.SaveAllAsync(all);
        return true;
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
