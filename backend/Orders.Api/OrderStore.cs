using Azure;
using Orders.Api.Repositories.JsonBlob;

class OrderStore : IOrderStore
{
    private readonly IJsonBlobStore _store;
    private const string Container = "data";
    private const string BlobName = "orders.json";
    public OrderStore(IJsonBlobStore store) => _store = store;

    public async Task<ListWithETag<Order>> GetAllAsync()
    {
        return await _store.LoadListAsync<Order>(Container, BlobName);
    }

    public Task SaveAllAsync(List<Order> orders, ETag eTag)
    {
        return _store.SaveListAsync(Container, BlobName, orders, eTag);
    }
}
