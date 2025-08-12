using Azure;
// Storage abstractions

namespace Orders.Api.Repositories.JsonBlob;

interface IJsonBlobStore
{
    Task<ListWithETag<T>> LoadListAsync<T>(string container, string blobName);
    Task SaveListAsync<T>(string container, string blobName, IReadOnlyList<T> list, ETag? eTag);
}
