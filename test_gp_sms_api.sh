#!/bin/bash

# GP SMS API Test Script
# Using provided credentials and endpoints

echo "======================================"
echo "GP SMS API Testing Script"
echo "======================================"

# Configuration
API_URL="https://gpcmp.grameenphone.com/gp/ecmapigw/webresources/ecmapigw.v3"
USERNAME="Tweest_9234"
PASSWORD="Tweest2233@@"
CLI="TWEEST"

# Generate a unique 25-digit client transaction ID
TIMESTAMP=$(date +%s)
RANDOM_SUFFIX=$(openssl rand -hex 6)
CLIENT_TRANS_ID="${TIMESTAMP}${RANDOM_SUFFIX}abc"

echo "Generated Client Transaction ID: $CLIENT_TRANS_ID"
echo ""

# Test 1: CLI Check API
echo "======================================"
echo "Test 1: CLI Check API"
echo "======================================"

CLI_CHECK_PAYLOAD=$(cat << EOF
{
  "username": "$USERNAME",
  "password": "$PASSWORD",
  "apicode": "2",
  "cli": "$CLI",
  "clienttransid": "$CLIENT_TRANS_ID"
}
EOF
)

echo "Request Payload:"
echo "$CLI_CHECK_PAYLOAD"
echo ""

echo "Making CLI Check API request..."
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "$CLI_CHECK_PAYLOAD" \
  "$API_URL" \
  -w "\n\nHTTP Status: %{http_code}\nTotal Time: %{time_total}s\n" \
  -v

echo ""
echo "======================================"
echo "Test 2: Single SMS API"
echo "======================================"

# Generate new client transaction ID for SMS
TIMESTAMP2=$(date +%s)
RANDOM_SUFFIX2=$(openssl rand -hex 6)
CLIENT_TRANS_ID2="${TIMESTAMP2}${RANDOM_SUFFIX2}sms"

SMS_PAYLOAD=$(cat << EOF
{
  "username": "$USERNAME",
  "password": "$PASSWORD",
  "apicode": "1",
  "msisdn": ["01711086791"],
  "countrycode": "880",
  "cli": "$CLI",
  "messagetype": "1",
  "message": "This is a test SMS from TWEEST API verification.",
  "clienttransid": "$CLIENT_TRANS_ID2",
  "bill_msisdn": "01313704545",
  "tran_type": "T",
  "request_type": "S",
  "rn_code": "71"
}
EOF
)

echo "Request Payload:"
echo "$SMS_PAYLOAD"
echo ""

echo "Making Single SMS API request..."
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "$SMS_PAYLOAD" \
  "$API_URL" \
  -w "\n\nHTTP Status: %{http_code}\nTotal Time: %{time_total}s\n" \
  -v

echo ""
echo "======================================"
echo "Test 3: Credit Balance Check API"
echo "======================================"

# Generate new client transaction ID for balance check
TIMESTAMP3=$(date +%s)
RANDOM_SUFFIX3=$(openssl rand -hex 6)
CLIENT_TRANS_ID3="${TIMESTAMP3}${RANDOM_SUFFIX3}bal"

BALANCE_PAYLOAD=$(cat << EOF
{
  "username": "$USERNAME",
  "password": "$PASSWORD",
  "apicode": "3",
  "clienttransid": "$CLIENT_TRANS_ID3"
}
EOF
)

echo "Request Payload:"
echo "$BALANCE_PAYLOAD"
echo ""

echo "Making Credit Balance Check API request..."
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "$BALANCE_PAYLOAD" \
  "$API_URL" \
  -w "\n\nHTTP Status: %{http_code}\nTotal Time: %{time_total}s\n" \
  -v

echo ""
echo "======================================"
echo "API Testing Complete"
echo "======================================" 