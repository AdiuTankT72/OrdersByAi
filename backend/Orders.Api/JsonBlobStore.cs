using System.Text;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using System.Text.Json;

class JsonBlobStore : IJsonBlobStore
{
    private readonly BlobServiceClient _service;
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    public JsonBlobStore(BlobServiceClient service) => _service = service;

    public async Task<IReadOnlyList<T>> LoadListAsync<T>(string container, string blobName)
    {
        var client = _service.GetBlobContainerClient(container);
        await client.CreateIfNotExistsAsync(PublicAccessType.None);
        var blob = client.GetBlobClient(blobName);
        if (!await blob.ExistsAsync()) return new List<T>();
        var resp = await blob.DownloadContentAsync();
        var json = resp.Value.Content.ToString();
        return JsonSerializer.Deserialize<List<T>>(json, JsonOptions) ?? new List<T>();
    }

    public async Task SaveListAsync<T>(string container, string blobName, IReadOnlyList<T> list)
    {
        var client = _service.GetBlobContainerClient(container);
        await client.CreateIfNotExistsAsync(PublicAccessType.None);
        var blob = client.GetBlobClient(blobName);
        var json = JsonSerializer.Serialize(list, JsonOptions);
        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(json));
        await blob.UploadAsync(stream, overwrite: true);
    }
}
