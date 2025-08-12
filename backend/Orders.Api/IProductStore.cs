using Azure;
using Orders.Api.Repositories.JsonBlob;

interface IProductStore
{
    Task<ListWithETag<Product>> GetAllAsync();
    Task SaveAllAsync(List<Product> products, ETag eTag);
}
