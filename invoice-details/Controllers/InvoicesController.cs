using invoice_details.Data;
using invoice_details.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace invoice_details.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize] 
public class InvoicesController : ControllerBase
{
    private readonly AppDbContext _context;

    public InvoicesController(AppDbContext context)
    {
        _context = context;
    }

    // NEW: Get all Invoices (for the Dashboard list)
    // This allows http://localhost:3000 to show everyone
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IEnumerable<Invoice>>> GetInvoices()
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdString)) return Unauthorized();

        var userId = int.Parse(userIdString);

        return await _context.Invoices
            .Where(i => i.UserId == userId)
            .ToListAsync();
    }

    // NEW: Create a brand new Invoice
    // This will be used by your "Create New" pop-up
    [HttpPost]
    [Authorize] // 🛡️ Core Rule: Only authenticated users can create invoices
    public async Task<ActionResult<Invoice>> CreateInvoice([FromBody] Invoice invoice)
    {
        // 1. EXTRACTION: Get the User ID from the JWT token claims
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);

        // 2. GUARD: Ensure the ID exists before proceeding
        if (string.IsNullOrEmpty(userIdString))
        {
            return Unauthorized("User identity could not be verified.");
        }

        // 3. OWNERSHIP: Assign the invoice to the logged-in user
        invoice.UserId = int.Parse(userIdString);

        // --- YOUR EXISTING CORE LOGIC (UTC & Formatting) ---
        invoice.CreatedAt = DateTime.UtcNow;

        if (invoice.Deadline.HasValue)
        {
            invoice.Deadline = DateTime.SpecifyKind(invoice.Deadline.Value, DateTimeKind.Utc);
        }

        // Invoice numbering logic (Global ID + 1)
        var lastInvoice = await _context.Invoices.OrderByDescending(i => i.Id).FirstOrDefaultAsync();
        int nextIdNumber = (lastInvoice?.Id ?? 0) + 1;
        invoice.InvoiceNumber = $"INV-{nextIdNumber:D3}";

        invoice.AmountPaid = 0;
        invoice.BalanceDue = invoice.Total;
        invoice.Status = "DRAFT";

        // --- DATABASE OPERATIONS ---
        _context.Invoices.Add(invoice);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetInvoice), new { id = invoice.Id }, invoice);
    }

    // 1. Get Specific Invoice Details: GET /api/invoices/:id
    [HttpGet("{id}")]
    public async Task<ActionResult<Invoice>> GetInvoice(int id)
    {
        var invoice = await _context.Invoices
            .Include(i => i.LineItems)
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.Id == id);

        return invoice == null ? NotFound() : invoice;
    }

    // 2. Add Payment: POST /api/invoices/:id/payments
    [HttpPost("{id}/payments")]
    public async Task<IActionResult> AddPayment(int id, [FromBody] Payment payment)
    {
        var invoice = await _context.Invoices.FindAsync(id);
        if (invoice == null) return NotFound();

        // Business Rules from your assignment
        if (payment.Amount <= 0 || payment.Amount > invoice.BalanceDue)
            return BadRequest("Invalid payment amount or exceeds balance due.");

        // Update Invoice Totals
        invoice.AmountPaid += payment.Amount;
        invoice.BalanceDue -= payment.Amount;

        // Rule: If balanceDue = 0 -> status = PAID
        if (invoice.BalanceDue <= 0) invoice.Status = "PAID";

        payment.InvoiceId = id;
        payment.PaymentDate = DateTime.UtcNow;

        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();

        return Ok(invoice);
    }

    // 3. Archive Invoice: POST /api/invoices/:id/archive
    [HttpPost("{id}/archive")]
    public async Task<IActionResult> ArchiveInvoice(int id)
    {
        var invoice = await _context.Invoices.FindAsync(id);
        if (invoice == null) return NotFound();

        invoice.IsArchived = true;
        await _context.SaveChangesAsync();
        return NoContent();
    }


    [HttpDelete("{id}")]
    public async Task<IActionResult> SoftDeleteInvoice(int id)
    {
        var invoice = await _context.Invoices.FindAsync(id);
        if (invoice == null) return NotFound();

        invoice.IsDeleted = true; // Move to Trash
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // REMOVED the ":" from "{id}/restore"
    [HttpPost("{id}/restore")]
    public async Task<IActionResult> RestoreInvoice(int id)
    {
        var invoice = await _context.Invoices.FindAsync(id);
        if (invoice == null) return NotFound();

        invoice.IsDeleted = false;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // 1. PERMANENT DELETE (Single): DELETE /api/invoices/:id/permanent
    [HttpDelete("{id}/permanent")]
    public async Task<IActionResult> PermanentDelete(int id)
    {
        var invoice = await _context.Invoices.FindAsync(id);
        if (invoice == null) return NotFound();

        _context.Invoices.Remove(invoice);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // 2. EMPTY TRASH (All): DELETE /api/invoices/trash/empty
    [HttpDelete("trash/empty")]
    public async Task<IActionResult> EmptyTrash()
    {
        var trashedInvoices = _context.Invoices.Where(i => i.IsDeleted);
        _context.Invoices.RemoveRange(trashedInvoices);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // FIXED UPDATE: PUT /api/invoices/:id
    [HttpPut("{id}")]
    public async Task<IActionResult> PutInvoice(int id, [FromBody] Invoice invoice)
    {
        if (id != invoice.Id) return BadRequest();

        // 1. UTC Date Safety for CreatedAt (MANDATORY for PostgreSQL)
        // The frontend sends this back, but we must re-label it as UTC
        invoice.CreatedAt = DateTime.SpecifyKind(invoice.CreatedAt, DateTimeKind.Utc);

        // 2. UTC Date Safety for Deadline
        if (invoice.Deadline.HasValue)
        {
            invoice.Deadline = DateTime.SpecifyKind(invoice.Deadline.Value, DateTimeKind.Utc);
        }

        // 3. Dynamic Recalculation
        // This ensures that if the user edited the 'Total', the 'Balance' updates
        invoice.BalanceDue = invoice.Total - invoice.AmountPaid;
        invoice.Status = invoice.BalanceDue <= 0 ? "PAID" : "DRAFT";

        try
        {
            _context.Entry(invoice).State = EntityState.Modified;
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            // This will print the ACTUAL error to your Visual Studio Output window
            Console.WriteLine($"DB ERROR: {ex.InnerException?.Message}");
            return StatusCode(500, "Database update failed. Check UTC kinds.");
        }

        return NoContent();
    }

    // 2. FIXED BULK ACTION: POST /api/invoices/completed/trash
    [HttpPost("completed/trash")]
    public async Task<IActionResult> TrashAllCompleted()
    {
        // Find invoices that are PAID and NOT already in trash
        var completed = _context.Invoices.Where(i => i.Status == "PAID" && !i.IsDeleted);

        foreach (var inv in completed)
        {
            inv.IsDeleted = true; // CHANGED to Capital 'I'
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }
}