class ProductStore : IProductStore
{
    private readonly IJsonBlobStore _store;
    private const string Container = "data";
    private const string BlobName = "products.json";
    public ProductStore(IJsonBlobStore store) => _store = store;

    public Task<List<Product>> GetAllAsync() => _store.LoadListAsync<Product>(Container, BlobName).ContinueWith(t => t.Result.ToList());
    public Task SaveAllAsync(List<Product> products) => _store.SaveListAsync(Container, BlobName, products);
}
