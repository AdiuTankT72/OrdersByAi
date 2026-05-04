using Azure;
using Orders.Api;
using Orders.Api.Models;
using Orders.Api.Requests;
using Orders.Api.Repositories.JsonBlob;

class OrderService
{
    private readonly IOrderStore _orders;
    private readonly IProductStore _products;
    private readonly IDeletedOrderStore _deletedOrders;
    public OrderService(IOrderStore orders, IProductStore products, IDeletedOrderStore deletedOrders)
    {
        _orders = orders;
        _products = products;
        _deletedOrders = deletedOrders;
    }

    public async Task<bool> DeleteOrderAsync(string id)
    {
        var all = await _orders.GetAllAsync();
        Order? toDelete = all.Items.FirstOrDefault(o => o.Id == id);
        if (toDelete is null) return false;
        var updatedList = all.Items.Where(o => o.Id != id).ToList();
        await _deletedOrders.AppendAsync(toDelete);
        await _orders.SaveAllAsync(updatedList, all.ETag);

        if (toDelete.Status != OrderStatus.Wysłano)
        {
            bool retry;
            do
            {
                retry = false;
                var products = await _products.GetAllAsync();
                foreach (var item in toDelete.Items)
                {
                    var p = products.Items.FirstOrDefault(p => p.Id == item.ProductId);
                    if (p is not null)
                        p.Quantity += item.Quantity;
                }
                try
                {
                    await _products.SaveAllAsync(products.Items, products.ETag);
                }
                catch (Azure.RequestFailedException ex) when (ex.Status == 412)
                {
                    retry = true;
                }
            } while (retry);
        }

        return true;
    }

    public async Task<Result<Order?>> PlaceOrderAsync(string userId, List<OrderItemRequest> items)
    {
        if (items is null || items.Count == 0) return Result<Order?>.Failure("Brak pozycji zamówienia.");
        bool retry = false;
        ListWithETag<Product> products;
        do
        {
            retry = false;

            products = await _products.GetAllAsync();

            // Validate stock
            int sum = 0;
            foreach (var i in items)
            {
                var p = products.Items.FirstOrDefault(p => p.Id == i.ProductId);
                if (p is null || i.Quantity <= 0 || i.Quantity > p.Quantity)
                {
                    return Result<Order?>.Failure("Nieprawidłowa ilość produktu " + p?.Name + ". Być może ktoś inny właśnie złożył zamówienie na ten produkt.");
                }
                sum += i.Quantity;
            }

            if (sum % 6 != 0)
            {
                return Result<Order?>.Failure("Zamówienie musi zawierać wielokrotność 6 produktów.");
            }

            // Subtract stock
            foreach (var i in items)
            {
                var p = products.Items.First(p => p.Id == i.ProductId);
                p.Quantity -= i.Quantity;
            }

            try
            {
                await _products.SaveAllAsync(products.Items, products.ETag);
            }
            catch (RequestFailedException ex) when (ex.Status == 412)
            {
                retry = true;
            }
        }
        while (retry);

        var order = new Order
        {
            UserId = userId,
            Items = items.Select(i =>
            {
                var p = products.Items.First(pp => pp.Id == i.ProductId);
                return new OrderItem { ProductId = p.Id, Name = p.Name, Quantity = i.Quantity };
            }).ToList()
        };

        do
        {
            retry = false;
            var all = await _orders.GetAllAsync();
            all.Items.Add(order);
            try
            {
                await _orders.SaveAllAsync(all.Items, all.ETag);
            }
            catch (RequestFailedException ex) when (ex.Status == 412)
            {
                retry = true;
            }
        } while (retry);

        return Result<Order?>.Success(order);
    }

    public async Task<List<Order>> GetByUserAsync(string userId)
    {
        var all = await _orders.GetAllAsync();
        return all.Items.Where(o => o.UserId == userId).OrderByDescending(o => o.CreatedAt).ToList();
    }

    public async Task<IEnumerable<Order>> GetAllAsync()
    {
        return (await _orders.GetAllAsync()).Items.OrderByDescending(o => o.CreatedAt);
    }

    public async Task<bool> UpdateStatusAsync(string id, OrderStatus status)
    {
        bool retry = false;
        do
        {
            retry = false;
            var all = await _orders.GetAllAsync();
            var o = all.Items.FirstOrDefault(o => o.Id == id);
            if (o is null) return false;
            o.Status = status;
            try
            {
                await _orders.SaveAllAsync(all.Items, all.ETag);
            }
            catch (RequestFailedException ex) when (ex.Status == 412)
            {
                // Handle concurrency conflict
                retry = true;
            }
        } while (retry); // Retry until successful
        return true;
    }
}
