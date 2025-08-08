class ProductService
{
    private readonly IProductStore _products;
    public ProductService(IProductStore products) => _products = products;

    public async Task<List<Product>> GetAllAsync() => await _products.GetAllAsync();

    public async Task<Product> AddAsync(ProductDto dto)
    {
        var list = await _products.GetAllAsync();
        var p = new Product { Name = dto.Name, Quantity = dto.Quantity };
        list.Add(p);
        await _products.SaveAllAsync(list);
        return p;
    }

    public async Task<bool> UpdateAsync(ProductDto dto)
    {
        var list = await _products.GetAllAsync();
        var p = list.FirstOrDefault(x => x.Id == dto.Id);
        if (p is null) return false;
        p.Name = dto.Name;
        p.Quantity = dto.Quantity;
        await _products.SaveAllAsync(list);
        return true;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var list = await _products.GetAllAsync();
        var removed = list.RemoveAll(p => p.Id == id) > 0;
        if (removed) await _products.SaveAllAsync(list);
        return removed;
    }
}
