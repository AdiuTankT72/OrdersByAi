using Azure;
using Orders.Api.Repositories.JsonBlob;

class ProductStore : IProductStore
{
    private readonly IJsonBlobStore _store;
    private const string Container = "data";
    private const string BlobName = "products.json";
    public ProductStore(IJsonBlobStore store) => _store = store;

    public async Task<ListWithETag<Product>> GetAllAsync()
    {
        return await _store.LoadListAsync<Product>(Container, BlobName);
    }

    public Task SaveAllAsync(List<Product> products, ETag eTag)
    {
        return _store.SaveListAsync(Container, BlobName, products, eTag);
    }
}
