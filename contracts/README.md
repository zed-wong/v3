  Lines 1-2: Import statements
  - anchor_lang::prelude::* - Core Anchor framework types and macros
  - anchor_spl::token - SPL Token program interface for token operations

  Line 4: declare_id! macro declares the program's on-chain address

  Lines 6-8: Program module definition using Anchor's #[program] attribute

  Lines 10-17: initialize function - Sets up the fund account
  - Creates admin control
  - Initializes total funds to 0
  - Stores PDA bump seed
  - Sets whitelist count to 0

  Lines 19-36: store_funds function - Deposits tokens into the fund
  - Transfers tokens from user to fund's token account
  - Updates total_funds counter with overflow protection

  Lines 38-83: allocate_funds function - Distributes funds to whitelisted recipients
  - Verifies admin authorization
  - Checks sufficient balance
  - Validates recipient is whitelisted and active
  - Uses PDA signing to transfer tokens
  - Updates total_funds balance

  Lines 85-95: set_admin function - Transfers admin control
  - Only current admin can change admin
  - Updates admin pubkey

  Lines 97-120: add_whitelist function - Adds address to whitelist
  - Admin-only operation
  - Creates new whitelist entry PDA
  - Stores address, label, timestamp, and creator
  - Increments whitelist counter

  Lines 122-139: remove_whitelist function - Deactivates whitelist entry
  - Sets is_active to false (soft delete)

  Lines 141-153: toggle_whitelist function - Enables/disables whitelist entry

  Lines 156-171: Initialize accounts struct
  - Defines PDA creation with "fund_account" seed
  - Requires payer and system program

  Lines 173-186: StoreFunds accounts struct
  - Source and destination token accounts
  - Authority must sign

  Lines 188-207: AllocateFunds accounts struct
  - Validates whitelist entry PDA exists
  - Admin must sign

  Lines 217-236: AddWhitelist accounts struct
  - Creates whitelist PDA with address as seed
  - Admin pays for account creation

  Lines 259-266: FundAccount data structure
  - Stores admin, balance, bump seed, whitelist count

  Lines 268-277: WhitelistEntry data structure
  - Stores whitelisted address, label, status, creator, timestamp

  Lines 279-293: Error enum defining custom error messages

  The contract implements a fund management system where an admin can receive deposits, maintain a whitelist, and distribute funds only to approved
  addresses.
