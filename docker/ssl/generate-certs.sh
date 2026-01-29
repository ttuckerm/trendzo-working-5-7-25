#!/bin/bash

# =============================================================================
# SSL CERTIFICATE GENERATION SCRIPT
# Generates self-signed certificates for development and testing
# =============================================================================

set -e

echo "🔐 Generating SSL certificates for Trendzo..."

# Create certificates directory if it doesn't exist
mkdir -p "$(dirname "$0")"

# Certificate details
CERT_DIR="$(dirname "$0")"
DOMAIN="trendzo.local"
DAYS=365

# Generate private key
echo "📝 Generating private key..."
openssl genrsa -out "$CERT_DIR/trendzo.key" 2048

# Generate certificate signing request
echo "📝 Generating certificate signing request..."
openssl req -new -key "$CERT_DIR/trendzo.key" -out "$CERT_DIR/trendzo.csr" -subj "/C=US/ST=California/L=San Francisco/O=Trendzo/OU=Development/CN=$DOMAIN/emailAddress=dev@trendzo.local"

# Generate self-signed certificate
echo "📝 Generating self-signed certificate..."
openssl x509 -req -in "$CERT_DIR/trendzo.csr" -signkey "$CERT_DIR/trendzo.key" -out "$CERT_DIR/trendzo.crt" -days $DAYS

# Create certificate with Subject Alternative Names for multiple domains
echo "📝 Creating certificate with SAN..."
cat > "$CERT_DIR/trendzo.conf" << EOF
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
CN = $DOMAIN

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = $DOMAIN
DNS.2 = localhost
DNS.3 = *.trendzo.local
DNS.4 = *.trendzo.app
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

# Generate new certificate with SAN
openssl req -new -key "$CERT_DIR/trendzo.key" -out "$CERT_DIR/trendzo.csr" -config "$CERT_DIR/trendzo.conf"
openssl x509 -req -in "$CERT_DIR/trendzo.csr" -signkey "$CERT_DIR/trendzo.key" -out "$CERT_DIR/trendzo.crt" -days $DAYS -extensions v3_req -extfile "$CERT_DIR/trendzo.conf"

# Set proper permissions
chmod 600 "$CERT_DIR/trendzo.key"
chmod 644 "$CERT_DIR/trendzo.crt"

# Clean up
rm "$CERT_DIR/trendzo.csr" "$CERT_DIR/trendzo.conf"

echo "✅ SSL certificates generated successfully!"
echo "📁 Certificate location: $CERT_DIR/trendzo.crt"
echo "🔑 Private key location: $CERT_DIR/trendzo.key"
echo ""
echo "🔗 To trust the certificate locally:"
echo "   - On macOS: sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain $CERT_DIR/trendzo.crt"
echo "   - On Linux: sudo cp $CERT_DIR/trendzo.crt /usr/local/share/ca-certificates/ && sudo update-ca-certificates"
echo "   - On Windows: Import $CERT_DIR/trendzo.crt to 'Trusted Root Certification Authorities'"
echo ""
echo "⚠️  For production, replace with valid SSL certificates from a trusted CA like Let's Encrypt"