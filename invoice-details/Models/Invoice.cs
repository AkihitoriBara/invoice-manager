namespace invoice_details.Models
{
    public class Invoice
    {
        public int Id { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public DateTime IssueDate { get; set; }
        public DateTime DueDate { get; set; }
        public string Status { get; set; } = "DRAFT"; // DRAFT | PAID
        public decimal Total { get; set; }
        public decimal AmountPaid { get; set; }
        public decimal BalanceDue { get; set; }
        public bool IsArchived { get; set; }

        // Relationships: One Invoice has Many LineItems and Many Payments
        public List<InvoiceLine> LineItems { get; set; } = new();
        public List<Payment> Payments { get; set; } = new();
        public bool IsDeleted { get; set; } = false;
        public string Currency { get; set; } = "$"; // Default to $
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? Deadline { get; set; } // Nullable in case no deadline is set
        public int? UserId { get; set; }
        public User? User { get; set; }
    }
}
