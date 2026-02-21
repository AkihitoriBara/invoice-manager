using System.Text.Json.Serialization;

namespace invoice_details.Models
{
    public class Payment
    {
        public int Id { get; set; }
        public int InvoiceId { get; set; } // Foreign Key
        public decimal Amount { get; set; }
        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;

        // Navigation property back to the parent
        [JsonIgnore]
        public Invoice? Invoice { get; set; }
    }
}
