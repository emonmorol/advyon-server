#!/bin/bash

echo "============================================"
echo "Security Tests for Advyon Backend"
echo "============================================"

API_URL="http://localhost:5000/api/v1"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Test 1: Admin routes without auth should return 401
echo -e "\n[TEST 1] Admin route without auth (expect 401)..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/admin/users)
if [ "$STATUS" -eq 401 ]; then
  echo -e "${GREEN}✓ PASS${NC} - Returned 401"
else
  echo -e "${RED}✗ FAIL${NC} - Returned $STATUS (expected 401)"
fi

# Test 2: Rate limiting should work (Note: this might take time if limit is high, but we check 101 requests for 100 limit)
echo -e "\n[TEST 2] Rate limiting (sending 101 requests to /cases)..."
FAIL_COUNT=0
triggered=false
for i in {1..101}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/cases)
  if [ "$STATUS" -eq 429 ]; then
    echo -e "${GREEN}✓ PASS${NC} - Rate limit triggered at request $i"
    triggered=true
    break
  fi
done

if [ "$triggered" = false ]; then
  echo -e "${RED}✗ FAIL${NC} - Rate limit NOT triggered after 101 requests"
fi

# Test 3: CORS headers should be present
echo -e "\n[TEST 3] CORS headers..."
CORS=$(curl -s -I -H "Origin: http://localhost:5173" $API_URL/cases | grep -i "access-control-allow-origin")
if [ -n "$CORS" ]; then
  echo -e "${GREEN}✓ PASS${NC} - CORS headers present: $CORS"
else
  echo -e "${RED}✗ FAIL${NC} - CORS headers missing or origin not allowed"
fi

# Test 4: Security headers (helmet)
echo -e "\n[TEST 4] Security headers (CSP)..."
CSP=$(curl -s -I $API_URL/cases | grep -i "content-security-policy")
if [ -n "$CSP" ]; then
  echo -e "${GREEN}✓ PASS${NC} - CSP header present"
else
  echo -e "${RED}✗ FAIL${NC} - CSP header missing"
fi

echo -e "\n============================================"
echo "Tests complete!"
echo "============================================"
