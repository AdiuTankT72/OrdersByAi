interface IOrderStore
{
    Task<List<Order>> GetAllAsync();
    Task SaveAllAsync(List<Order> orders);
}
