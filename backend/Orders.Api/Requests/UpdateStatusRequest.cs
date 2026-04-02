using Orders.Api.Models;

namespace Orders.Api.Requests;

class UpdateStatusRequest
{
    public OrderStatus Status { get; set; }
}
