using Azure;
using Orders.Api.Repositories.JsonBlob;

class ProductService
{
    private readonly IProductStore _products;
    public ProductService(IProductStore products) => _products = products;

    public async Task<List<Product>> GetAllAsync()
    {
        return (await _products.GetAllAsync()).Items;
    }

    public async Task<Product> AddAsync(ProductDto dto)
    {
        bool retry;
        do
        {
            retry = false;
            var list = await _products.GetAllAsync();
            var p = new Product { Name = dto.Name, Quantity = dto.Quantity };
            list.Items.Add(p);
            try
            {
                await _products.SaveAllAsync(list.Items, list.ETag);
                return p;
            }
            catch (RequestFailedException ex) when (ex.Status == 412)
            {
                retry = true;
            }
        } while (retry);

        return null!;//not possible path but to satisfy compiler
    }

    public async Task<bool> UpdateAsync(ProductDto dto)
    {
        bool retry;
        do
        {
            retry = false;
            var list = await _products.GetAllAsync();
            var p = list.Items.FirstOrDefault(x => x.Id == dto.Id);
            if (p is null) return false;
            p.Name = dto.Name;
            p.Quantity = dto.Quantity;
            try
            {
                await _products.SaveAllAsync(list.Items, list.ETag);
                return true;
            }
            catch (RequestFailedException ex) when (ex.Status == 412)
            {
                retry = true;
            }
        } while (retry);
        return false;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        bool retry;
        do
        {
            retry = false;
            var list = await _products.GetAllAsync();
            var removed = list.Items.RemoveAll(p => p.Id == id) > 0;
            if (removed)
            {
                try
                {
                    await _products.SaveAllAsync(list.Items, list.ETag);
                    return true;
                }
                catch (RequestFailedException ex) when (ex.Status == 412)
                {
                    retry = true;
                }
            }
        } while (retry);

        return false;
    }
}
