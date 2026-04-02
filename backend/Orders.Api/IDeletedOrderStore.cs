using Orders.Api.Models;

interface IDeletedOrderStore
{
    Task AppendAsync(Order order);
}
