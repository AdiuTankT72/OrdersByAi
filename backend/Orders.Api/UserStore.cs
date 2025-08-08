class UserStore : IUserStore
{
    private readonly IJsonBlobStore _store;
    private const string Container = "data";
    private const string BlobName = "users.json";
    private List<UserAccount>? _cache;
    public UserStore(IJsonBlobStore store) => _store = store;

    public async Task EnsureSeedAsync()
    {
        var list = (await _store.LoadListAsync<UserAccount>(Container, BlobName)).ToList();
        if (list.Count == 0)
        {
            list.Add(new UserAccount { Login = "admin", PasswordHash = "admin", Role = Role.Admin });
            list.Add(new UserAccount { Login = "user", PasswordHash = "user", Role = Role.User });
            await _store.SaveListAsync(Container, BlobName, list);
        }
        _cache = list;
    }

    private async Task<List<UserAccount>> LoadAsync()
    {
        if (_cache is null)
        {
            _cache = (await _store.LoadListAsync<UserAccount>(Container, BlobName)).ToList();
        }
        return _cache;
    }

    public async Task<UserAccount?> FindByLoginAsync(string login)
    {
        var list = await LoadAsync();
        return list.FirstOrDefault(u => u.Login.Equals(login, StringComparison.OrdinalIgnoreCase));
    }

    public async Task<List<UserAccount>> GetAllAsync()
    {
        return await LoadAsync();
    }
}
