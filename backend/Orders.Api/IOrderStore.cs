using Azure;
using Orders.Api.Models;
using Orders.Api.Repositories.JsonBlob;

interface IOrderStore
{
    Task<ListWithETag<Order>> GetAllAsync();
    Task SaveAllAsync(List<Order> orders, ETag eTag);
}
