using invoice_details.Data;
using invoice_details.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace invoice_details.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthController(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    [HttpPost("register")]
    public async Task<ActionResult<object>> Register(UserDto request)
    {
        if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password) || string.IsNullOrEmpty(request.Email))
        {
            return BadRequest("All fields are required.");
        }

        var emailPattern = @"^[^@\s]+@[^@\s]+\.[^@\s]+$";
        if (!Regex.IsMatch(request.Email, emailPattern))
        {
            return BadRequest("Please enter a valid email address.");
        }

        if (await _context.Users.AnyAsync(u => u.Username == request.Username))
        {
            return BadRequest("This username is already taken.");
        }

        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
        {
            return BadRequest("An account with this email already exists.");
        }

        using var hmac = new HMACSHA512();

        var user = new User
        {
            Username = request.Username,
            Email = request.Email.ToLower().Trim(), 
            PasswordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(request.Password)),
            PasswordSalt = hmac.Key,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Registration successful!", userId = user.Id });
    }

    [HttpPost("login")]
    public async Task<ActionResult<string>> Login(LoginDto request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email.ToLower().Trim());

        if (user == null)
        {
            return BadRequest("Invalid email or password.");
        }

        using var hmac = new HMACSHA512(user.PasswordSalt);
        var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(request.Password));

        for (int i = 0; i < computedHash.Length; i++)
        {
            if (computedHash[i] != user.PasswordHash[i])
            {
                return BadRequest("Invalid email or password.");
            }
        }

        string token = CreateToken(user);
        return Ok(token);
    }

    private string CreateToken(User user)
    {
        List<Claim> claims = new List<Claim> {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _configuration.GetSection("AppSettings:Token").Value!));

        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

        var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.Now.AddDays(1),
                signingCredentials: creds
            );

        var jwt = new JwtSecurityTokenHandler().WriteToken(token);
        return jwt;
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult> GetMyProfile()
    {
        // 🔍 Try to find the ID using multiple common claim names
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier) // Standard URL
                        ?? User.FindFirstValue("sub")                    // Standard JWT 'Subject'
                        ?? User.FindFirstValue("id")                     // Custom 'id'
                        ?? User.FindFirstValue("uid");                   // Custom 'uid'

        if (string.IsNullOrEmpty(userIdString))
        {
            // 🛠️ DEBUG: If it's still failing, this will print all available claims to your VS Console
            var allClaims = string.Join(", ", User.Claims.Select(c => $"{c.Type}:{c.Value}"));
            Console.WriteLine($"DEBUG: No ID found. Available claims are: {allClaims}");

            return Unauthorized("User ID not found in token claims.");
        }

        if (!int.TryParse(userIdString, out int userId))
        {
            return BadRequest("Invalid User ID format.");
        }

        var user = await _context.Users
            .Where(u => u.Id == userId)
            .Select(u => new { u.Username, u.Email })
            .FirstOrDefaultAsync();

        if (user == null) return NotFound("User does not exist in database.");

        return Ok(user);
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword(ChangePasswordDto request)
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdString)) return Unauthorized();

        var user = await _context.Users.FindAsync(int.Parse(userIdString));
        if (user == null) return NotFound();

        // 1. Verify Old Password hash
        using var hmac = new HMACSHA512(user.PasswordSalt);
        var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(request.OldPassword));

        // Compare byte-by-byte
        for (int i = 0; i < computedHash.Length; i++)
        {
            if (computedHash[i] != user.PasswordHash[i]) return BadRequest("Old password is incorrect.");
        }

        // 2. Generate NEW Salt and Hash for the new password
        using var newHmac = new HMACSHA512();
        user.PasswordSalt = newHmac.Key;
        user.PasswordHash = newHmac.ComputeHash(Encoding.UTF8.GetBytes(request.NewPassword));

        await _context.SaveChangesAsync();
        return Ok("Password changed successfully.");
    }

    // Add this DTO class at the bottom of your file or in a Models folder
    public class ChangePasswordDto
    {
        public string OldPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}

public class UserDto
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}

public class LoginDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}