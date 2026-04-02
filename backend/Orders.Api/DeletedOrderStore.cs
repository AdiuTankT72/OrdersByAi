using System.Text;
using System.Text.Json;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Blobs.Specialized;
using Orders.Api.Models;

class DeletedOrderStore : IDeletedOrderStore
{
    private readonly BlobServiceClient _service;
    private const string Container = "data";
    private const string BlobName = "deleted-orders.jsonl";
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public DeletedOrderStore(BlobServiceClient service) => _service = service;

    public async Task AppendAsync(Order order)
    {
        var containerClient = _service.GetBlobContainerClient(Container);
        await containerClient.CreateIfNotExistsAsync(PublicAccessType.None);

        var appendBlob = containerClient.GetAppendBlobClient(BlobName);
        await appendBlob.CreateIfNotExistsAsync();

        var line = JsonSerializer.Serialize(order, JsonOptions) + "\n";
        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(line));
        await appendBlob.AppendBlockAsync(stream);
    }
}
