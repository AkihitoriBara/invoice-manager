using System.Text.Json.Serialization;

namespace invoice_details.Models
{
    public class InvoiceLine
    {
        public int Id { get; set; }
        public int InvoiceId { get; set; } // Foreign Key
        public string Description { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }

        // Logic: LineTotal = Quantity * UnitPrice
        public decimal LineTotal => Quantity * UnitPrice;

        // Navigation property back to the parent
        [JsonIgnore]
        public Invoice? Invoice { get; set; }
    }
}
