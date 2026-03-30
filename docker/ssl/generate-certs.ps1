# =============================================================================
# SSL CERTIFICATE GENERATION SCRIPT (PowerShell)
# Generates self-signed certificates for development and testing on Windows
# =============================================================================

param(
    [string]$Domain = "trendzo.local",
    [int]$Days = 365
)

Write-Host "🔐 Generating SSL certificates for Trendzo..." -ForegroundColor Green

# Get script directory
$CertDir = Split-Path -Parent $MyInvocation.MyCommand.Path

try {
    # Check if OpenSSL is available
    $opensslPath = Get-Command openssl -ErrorAction SilentlyContinue
    
    if ($opensslPath) {
        Write-Host "📝 Using OpenSSL to generate certificates..." -ForegroundColor Yellow
        
        # Generate private key
        Write-Host "📝 Generating private key..."
        & openssl genrsa -out "$CertDir\trendzo.key" 2048
        
        # Create configuration file
        $configContent = @"
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = US
ST = California
L = San Francisco
O = Trendzo
OU = Development
CN = $Domain

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = $Domain
DNS.2 = localhost
DNS.3 = *.trendzo.local
DNS.4 = *.trendzo.app
IP.1 = 127.0.0.1
IP.2 = ::1
"@
        
        $configPath = "$CertDir\trendzo.conf"
        $configContent | Out-File -FilePath $configPath -Encoding ASCII
        
        # Generate certificate signing request
        Write-Host "📝 Generating certificate signing request..."
        & openssl req -new -key "$CertDir\trendzo.key" -out "$CertDir\trendzo.csr" -config $configPath
        
        # Generate self-signed certificate
        Write-Host "📝 Generating self-signed certificate..."
        & openssl x509 -req -in "$CertDir\trendzo.csr" -signkey "$CertDir\trendzo.key" -out "$CertDir\trendzo.crt" -days $Days -extensions v3_req -extfile $configPath
        
        # Clean up
        Remove-Item "$CertDir\trendzo.csr" -ErrorAction SilentlyContinue
        Remove-Item $configPath -ErrorAction SilentlyContinue
        
    } else {
        Write-Host "📝 OpenSSL not found, using PowerShell certificate generation..." -ForegroundColor Yellow
        
        # Use PowerShell's New-SelfSignedCertificate (Windows 10/Server 2016+)
        $cert = New-SelfSignedCertificate -DnsName $Domain, "localhost", "*.trendzo.local", "*.trendzo.app" `
                                         -CertStoreLocation "cert:\LocalMachine\My" `
                                         -NotAfter (Get-Date).AddDays($Days) `
                                         -KeyAlgorithm RSA `
                                         -KeyLength 2048 `
                                         -HashAlgorithm SHA256 `
                                         -KeyUsage DigitalSignature, KeyEncipherment `
                                         -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.1")
        
        # Export certificate
        $certBytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
        [System.IO.File]::WriteAllBytes("$CertDir\trendzo.crt", $certBytes)
        
        # Export private key (this is more complex in PowerShell)
        $keyBytes = $cert.PrivateKey.ExportPkcs8PrivateKey()
        $keyPem = "-----BEGIN PRIVATE KEY-----`n"
        $keyPem += [System.Convert]::ToBase64String($keyBytes, [System.Base64FormattingOptions]::InsertLineBreaks)
        $keyPem += "`n-----END PRIVATE KEY-----"
        $keyPem | Out-File -FilePath "$CertDir\trendzo.key" -Encoding ASCII
        
        # Remove from certificate store
        Remove-Item "cert:\LocalMachine\My\$($cert.Thumbprint)" -ErrorAction SilentlyContinue
    }
    
    Write-Host "✅ SSL certificates generated successfully!" -ForegroundColor Green
    Write-Host "📁 Certificate location: $CertDir\trendzo.crt" -ForegroundColor Cyan
    Write-Host "🔑 Private key location: $CertDir\trendzo.key" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🔗 To trust the certificate locally on Windows:" -ForegroundColor Yellow
    Write-Host "   1. Double-click on $CertDir\trendzo.crt" -ForegroundColor White
    Write-Host "   2. Click 'Install Certificate...'" -ForegroundColor White
    Write-Host "   3. Choose 'Local Machine' and click 'Next'" -ForegroundColor White
    Write-Host "   4. Select 'Place all certificates in the following store'" -ForegroundColor White
    Write-Host "   5. Click 'Browse...' and select 'Trusted Root Certification Authorities'" -ForegroundColor White
    Write-Host "   6. Click 'Next' and then 'Finish'" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  For production, replace with valid SSL certificates from a trusted CA like Let's Encrypt" -ForegroundColor Red
    
} catch {
    Write-Host "❌ Error generating certificates: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Try installing OpenSSL or running as Administrator" -ForegroundColor Yellow
    exit 1
}