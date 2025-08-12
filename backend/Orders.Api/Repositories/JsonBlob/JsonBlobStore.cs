using System.Text;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using System.Text.Json;
using Azure;

namespace Orders.Api.Repositories.JsonBlob;

class JsonBlobStore : IJsonBlobStore
{
    private readonly BlobServiceClient _service;
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    public JsonBlobStore(BlobServiceClient service) => _service = service;

    public async Task<ListWithETag<T>> LoadListAsync<T>(string container, string blobName)
    {
        var client = _service.GetBlobContainerClient(container);
        await client.CreateIfNotExistsAsync(PublicAccessType.None);
        var blob = client.GetBlobClient(blobName);
        if (!await blob.ExistsAsync()) return new ListWithETag<T> { ETag = default, Items = new List<T>() };
        var resp = await blob.DownloadContentAsync();
        var json = resp.Value.Content.ToString();
        var items = JsonSerializer.Deserialize<List<T>>(json, JsonOptions) ?? new List<T>();
        return new ListWithETag<T> { ETag = resp.Value.Details.ETag, Items = items };
    }

    public async Task SaveListAsync<T>(string container, string blobName, IReadOnlyList<T> list, ETag? eTag)
    {
        var client = _service.GetBlobContainerClient(container);
        await client.CreateIfNotExistsAsync(PublicAccessType.None);
        var blob = client.GetBlobClient(blobName);
        var json = JsonSerializer.Serialize(list, JsonOptions);
        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(json));

        if (eTag.HasValue)
        {
            BlobUploadOptions options = new BlobUploadOptions
            {
                Conditions = new BlobRequestConditions
                {
                    IfMatch = eTag,
                },
            };

            await blob.UploadAsync(stream, options);
        }
        else
        {
            await blob.UploadAsync(stream, overwrite: true);
        }
    }
}
