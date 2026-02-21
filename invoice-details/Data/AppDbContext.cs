using Microsoft.EntityFrameworkCore;
using invoice_details.Models;

namespace invoice_details.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        // These represent the actual tables that will be created
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<InvoiceLine> InvoiceLines { get; set; }
        public DbSet<Payment> Payments { get; set; }
    }
}
