#!/bin/sh

if ! command -v jq >/dev/null 2>&1; then
    echo "jq is not installed. Please install jq to proceed." >&2
    exit 1
fi

ADDRESS="$1"

if [ -z "$ADDRESS" ]; then
    echo "❌ Please provide an address as an argument." >&2
    exit 1
fi

# Set cookie and get CSRF token
CSRF_TOKEN=$(curl -G -s -c cookiejar \
    -H "Connection: close" \
    --data-urlencode "address=$ADDRESS" \
    https://bahnhof.se/bredband |
    sed -n 's/.*<meta name="csrf-token" id="csrf-token" content="\([^"]*\).*/\1/p')

# Get network from address
NETWORKS_RESPONSE=$(curl -s -c cookiejar -b cookiejar \
    -H "Content-Type: application/json" \
    -H "X-Requested-With: XMLHttpRequest" \
    -H "X-CSRF-TOKEN: $CSRF_TOKEN" \
    -d "{\"address\":\"$ADDRESS\"}" \
    https://bahnhof.se/ajax/search/networks) >/dev/null

NETWORK_RESPONSE_TYPE=$(echo "$NETWORKS_RESPONSE" | jq -r '.data.type // empty')

if [ "$NETWORK_RESPONSE_TYPE" = "COVERAGE_NOT_FOUND" ]; then
    FORMATTED_ADDRESS=$(echo "$NETWORKS_RESPONSE" | jq -r '.data.formattedAddress // empty')

    if [ -n "$FORMATTED_ADDRESS" ]; then
        ADDRESS="$FORMATTED_ADDRESS"
    fi
    
    echo "⚠️ Coverage not found for address: $ADDRESS" >&2
    exit 2
fi

# Extract redirectUrl from network
REDIRECT_URL=$(echo "$NETWORKS_RESPONSE" | jq -r '.data.networks[].redirectUrl')

# Get prices for network
PRODUCTS_RESPONSE=$(curl -s -b cookiejar \
    -H "Content-Type: application/json" \
    -H "X-Requested-With: XMLHttpRequest" \
    -H "X-CSRF-TOKEN: $CSRF_TOKEN" \
    https://bahnhof.se/ajax/bredband/products/$REDIRECT_URL) >/dev/null

# Filter out products that are not broadband
BROADBAND_PRODUCTS=$(
    jq -r '.data.products[] | select(.category.type == "BB")' <<EOF
$PRODUCTS_RESPONSE
EOF
)

# Print title with "Mbit/s" stripped and price
echo "$BROADBAND_PRODUCTS" | jq -r '[(.title | sub(" Mbit/s"; "")), .price] | join(" ")'

exit 0
