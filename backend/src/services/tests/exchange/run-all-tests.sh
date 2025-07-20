#!/bin/bash

# Run all exchange service tests

echo "Running Exchange Service Tests..."
echo "================================"

# Array of test files
tests=(
  "cache.test.ts"
  "base.test.ts" 
  "manager.test.ts"
  "balance.test.ts"
  "deposit.test.ts"
  "withdraw.test.ts"
  "trade.test.ts"
  "market-data.test.ts"
  "events.test.ts"
)

# Run each test file
for test in "${tests[@]}"; do
  echo ""
  echo "Running $test..."
  echo "----------------"
  bun test "$test"
  
  if [ $? -ne 0 ]; then
    echo "❌ Test failed: $test"
    exit 1
  else
    echo "✅ Test passed: $test"
  fi
done

echo ""
echo "================================"
echo "✅ All tests passed successfully!"