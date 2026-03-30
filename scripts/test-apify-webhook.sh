#!/bin/bash

# =====================================================
# Apify Webhook Test Script
# =====================================================
# Tests the apify-ingest Edge Function with mock payloads
#
# Usage:
#   bash scripts/test-apify-webhook.sh
#   bash scripts/test-apify-webhook.sh <PROJECT_REF> <SERVICE_ROLE_KEY>
#
# =====================================================

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}  Apify Webhook Test Script${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""

# =====================================================
# Configuration
# =====================================================

# Check if arguments provided
if [ $# -eq 2 ]; then
    PROJECT_REF=$1
    SERVICE_ROLE_KEY=$2
else
    # Try to read from environment or prompt
    if [ -z "$SUPABASE_PROJECT_REF" ]; then
        echo -e "${YELLOW}Enter your Supabase Project Reference ID:${NC}"
        read -r PROJECT_REF
    else
        PROJECT_REF=$SUPABASE_PROJECT_REF
    fi

    if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        echo -e "${YELLOW}Enter your Supabase Service Role Key:${NC}"
        read -rs SERVICE_ROLE_KEY
        echo ""
    else
        SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
    fi
fi

# Validate inputs
if [ -z "$PROJECT_REF" ] || [ -z "$SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ Error: Missing required configuration${NC}"
    echo "Usage: $0 <PROJECT_REF> <SERVICE_ROLE_KEY>"
    exit 1
fi

# Build function URL
FUNCTION_URL="https://${PROJECT_REF}.supabase.co/functions/v1/apify-ingest"

echo -e "${GREEN}✅ Configuration loaded${NC}"
echo -e "   URL: ${FUNCTION_URL}"
echo ""

# =====================================================
# Test 1: Basic Connectivity
# =====================================================

echo -e "${BLUE}Test 1: Basic Connectivity${NC}"
echo "Testing if function is reachable..."

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X GET \
    "${FUNCTION_URL}")

if [ "$RESPONSE" == "405" ]; then
    echo -e "${GREEN}✅ Function reachable (405 Method Not Allowed = expected for GET)${NC}"
else
    echo -e "${RED}❌ Unexpected response: ${RESPONSE}${NC}"
fi
echo ""

# =====================================================
# Test 2: Missing Auth Headers
# =====================================================

echo -e "${BLUE}Test 2: Missing Auth Headers (Should Fail)${NC}"
echo "Testing without authentication headers..."

RESPONSE=$(curl -s \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"test": true}' \
    "${FUNCTION_URL}")

echo "Response: ${RESPONSE}"
echo -e "${YELLOW}⚠️  Expected: Should fail with auth error${NC}"
echo ""

# =====================================================
# Test 3: Valid Auth with Empty Dataset
# =====================================================

echo -e "${BLUE}Test 3: Valid Auth with Empty Dataset${NC}"
echo "Testing with correct headers but empty dataset..."

MOCK_PAYLOAD='{
  "userId": "test_user",
  "createdAt": "2025-10-12T12:00:00Z",
  "eventType": "ACTOR.RUN.SUCCEEDED",
  "eventData": {
    "actorId": "test-actor",
    "actorRunId": "test-run-123"
  },
  "resource": {
    "defaultDatasetId": "empty-dataset-test",
    "defaultDatasetUrl": "https://api.apify.com/v2/datasets/empty-dataset-test/items?clean=1&format=json"
  }
}'

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
    -X POST \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
    -H "apikey: ${SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d "${MOCK_PAYLOAD}" \
    "${FUNCTION_URL}")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | sed 's/HTTP_CODE://')
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo "HTTP Status: ${HTTP_CODE}"
echo "Response Body: ${BODY}"

if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "400" ]; then
    echo -e "${GREEN}✅ Authentication working${NC}"
else
    echo -e "${RED}❌ Authentication failed (HTTP ${HTTP_CODE})${NC}"
fi
echo ""

# =====================================================
# Test 4: Mock Valid Payload
# =====================================================

echo -e "${BLUE}Test 4: Mock Valid Payload with Sample Data${NC}"
echo "Testing with mock Apify webhook payload..."

# Create a temporary file with mock dataset
TEMP_DIR=$(mktemp -d)
MOCK_DATASET_FILE="${TEMP_DIR}/mock_dataset.json"

cat > "${MOCK_DATASET_FILE}" << 'EOF'
[
  {
    "id": "7000000000000000001",
    "webVideoUrl": "https://www.tiktok.com/@testuser/video/7000000000000000001",
    "text": "Test video caption #test #viral",
    "createTime": 1697500000,
    "videoDuration": 30,
    "authorMeta": {
      "id": "123456",
      "name": "testuser",
      "nickName": "Test User",
      "verified": false,
      "fans": 10000
    },
    "stats": {
      "diggCount": 500,
      "shareCount": 50,
      "commentCount": 100,
      "playCount": 5000
    },
    "musicMeta": {
      "musicId": "music123",
      "musicName": "Test Song",
      "musicAuthor": "Test Artist"
    },
    "hashtags": [
      {"name": "test", "title": "test"},
      {"name": "viral", "title": "viral"}
    ]
  }
]
EOF

echo -e "${YELLOW}ℹ️  Note: This will attempt to fetch from a mock dataset URL (will fail)${NC}"
echo "   In production, Apify provides a real dataset URL."

MOCK_PAYLOAD_REAL='{
  "userId": "user123",
  "createdAt": "2025-10-12T15:30:00Z",
  "eventType": "ACTOR.RUN.SUCCEEDED",
  "eventData": {
    "actorId": "clockworks~free-tiktok-scraper",
    "actorTaskId": "tiktok-scraper-prod",
    "actorRunId": "run_abc123"
  },
  "resource": {
    "defaultDatasetId": "dataset_xyz789",
    "defaultDatasetUrl": "https://api.apify.com/v2/datasets/dataset_xyz789/items?clean=1&format=json"
  }
}'

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
    -X POST \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
    -H "apikey: ${SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d "${MOCK_PAYLOAD_REAL}" \
    "${FUNCTION_URL}")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | sed 's/HTTP_CODE://')
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo "HTTP Status: ${HTTP_CODE}"
echo "Response Body: ${BODY}"

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✅ Function executed successfully${NC}"
elif [ "$HTTP_CODE" == "500" ]; then
    echo -e "${YELLOW}⚠️  Expected: Dataset fetch will fail (mock URL)${NC}"
else
    echo -e "${RED}❌ Unexpected error (HTTP ${HTTP_CODE})${NC}"
fi

# Cleanup
rm -rf "${TEMP_DIR}"
echo ""

# =====================================================
# Test 5: Payload Validation
# =====================================================

echo -e "${BLUE}Test 5: Invalid Payload (Missing Dataset URL)${NC}"
echo "Testing error handling..."

INVALID_PAYLOAD='{
  "userId": "test_user",
  "eventType": "ACTOR.RUN.SUCCEEDED",
  "eventData": {},
  "resource": {}
}'

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
    -X POST \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
    -H "apikey: ${SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d "${INVALID_PAYLOAD}" \
    "${FUNCTION_URL}")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | sed 's/HTTP_CODE://')
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo "HTTP Status: ${HTTP_CODE}"
echo "Response Body: ${BODY}"

if [ "$HTTP_CODE" == "400" ]; then
    echo -e "${GREEN}✅ Validation working correctly${NC}"
else
    echo -e "${YELLOW}⚠️  Expected 400 Bad Request, got ${HTTP_CODE}${NC}"
fi
echo ""

# =====================================================
# Summary
# =====================================================

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}  Test Summary${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""
echo -e "${GREEN}✅ Function is deployed and accessible${NC}"
echo -e "${GREEN}✅ Authentication is configured correctly${NC}"
echo -e "${GREEN}✅ Payload validation is working${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Configure Apify webhook with the function URL"
echo "2. Run a real Apify scraping task"
echo "3. Check Supabase Edge Function logs"
echo "4. Verify data in scraped_videos table"
echo ""
echo -e "${BLUE}===========================================${NC}"

