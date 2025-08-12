using Azure;

namespace Orders.Api.Repositories.JsonBlob;

public class ListWithETag<T>
{
    public required ETag ETag { get; set; }

    public required List<T> Items { get; set; }
}
