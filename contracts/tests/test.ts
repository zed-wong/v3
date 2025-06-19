import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { FundManager } from "../target/types/fund_manager";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo, getAccount, getAssociatedTokenAddress, createAssociatedTokenAccount } from "@solana/spl-token";
import { expect } from "chai";

describe("Fund Manager", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.FundManager as Program<FundManager>;
  
  let admin: Keypair;
  let user1: Keypair;
  let user2: Keypair;
  let newAdmin: Keypair;
  let mint: PublicKey;
  let fundAccount: PublicKey;
  let fundAccountBump: number;
  let fundTokenAccount: PublicKey;
  let user1TokenAccount: PublicKey;
  let user2TokenAccount: PublicKey;

  const INITIAL_MINT_AMOUNT = 1_000_000_000; // 1 billion tokens (9 decimals)
  const DEPOSIT_AMOUNT = 100_000_000; // 100 tokens
  const ALLOCATION_AMOUNT = 50_000_000; // 50 tokens

  before(async () => {
    // Generate test keypairs
    admin = Keypair.generate();
    user1 = Keypair.generate();
    user2 = Keypair.generate();
    newAdmin = Keypair.generate();

    // Airdrop SOL to test accounts
    const connection = provider.connection;
    await Promise.all([
      connection.requestAirdrop(admin.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL),
      connection.requestAirdrop(user1.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL),
      connection.requestAirdrop(user2.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL),
      connection.requestAirdrop(newAdmin.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL),
    ]);

    // Wait for airdrops to confirm
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create test token mint
    mint = await createMint(
      connection,
      admin,
      admin.publicKey,
      null,
      9 // 9 decimals
    );

    // Find fund account PDA
    [fundAccount, fundAccountBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("fund_account")],
      program.programId
    );

    // Create token accounts using Associated Token Accounts
    user1TokenAccount = await createAssociatedTokenAccount(connection, admin, mint, user1.publicKey);
    user2TokenAccount = await createAssociatedTokenAccount(connection, admin, mint, user2.publicKey);
    
    // For the fund account, we need to create a regular token account since PDA can't own ATA
    const fundTokenKeypair = Keypair.generate();
    fundTokenAccount = await createAccount(connection, admin, mint, fundAccount, fundTokenKeypair);

    // Mint tokens to users
    await Promise.all([
      mintTo(connection, admin, mint, user1TokenAccount, admin, INITIAL_MINT_AMOUNT),
      mintTo(connection, admin, mint, user2TokenAccount, admin, INITIAL_MINT_AMOUNT),
    ]);
  });

  describe("Initialization", () => {
    it("should initialize fund manager successfully", async () => {
      await program.methods
        .initialize(admin.publicKey)
        .accounts({
          fundAccount,
          payer: admin.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([admin])
        .rpc();

      const fundAccountData = await program.account.fundAccount.fetch(fundAccount);
      expect(fundAccountData.admin.toString()).to.equal(admin.publicKey.toString());
      expect(fundAccountData.totalFunds.toNumber()).to.equal(0);
      expect(fundAccountData.bump).to.equal(fundAccountBump);
    });

    it("should fail to initialize twice", async () => {
      try {
        await program.methods
          .initialize(admin.publicKey)
          .accounts({
            fundAccount,
            payer: admin.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([admin])
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("already in use");
      }
    });
  });

  describe("Fund Storage", () => {
    it("should allow users to store funds", async () => {
      const initialUserBalance = await getAccount(provider.connection, user1TokenAccount);
      const initialFundBalance = await getAccount(provider.connection, fundTokenAccount);

      await program.methods
        .storeFunds(new anchor.BN(DEPOSIT_AMOUNT))
        .accounts({
          fundAccount,
          fromTokenAccount: user1TokenAccount,
          fundTokenAccount,
          authority: user1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user1])
        .rpc();

      const finalUserBalance = await getAccount(provider.connection, user1TokenAccount);
      const finalFundBalance = await getAccount(provider.connection, fundTokenAccount);
      const fundAccountData = await program.account.fundAccount.fetch(fundAccount);

      expect(Number(initialUserBalance.amount) - Number(finalUserBalance.amount)).to.equal(DEPOSIT_AMOUNT);
      expect(Number(finalFundBalance.amount) - Number(initialFundBalance.amount)).to.equal(DEPOSIT_AMOUNT);
      expect(fundAccountData.totalFunds.toNumber()).to.equal(DEPOSIT_AMOUNT);
    });

    it("should allow multiple users to store funds", async () => {
      const initialFundBalance = await getAccount(provider.connection, fundTokenAccount);
      const initialTotalFunds = (await program.account.fundAccount.fetch(fundAccount)).totalFunds.toNumber();

      await program.methods
        .storeFunds(new anchor.BN(DEPOSIT_AMOUNT))
        .accounts({
          fundAccount,
          fromTokenAccount: user2TokenAccount,
          fundTokenAccount,
          authority: user2.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user2])
        .rpc();

      const finalFundBalance = await getAccount(provider.connection, fundTokenAccount);
      const fundAccountData = await program.account.fundAccount.fetch(fundAccount);

      expect(Number(finalFundBalance.amount) - Number(initialFundBalance.amount)).to.equal(DEPOSIT_AMOUNT);
      expect(fundAccountData.totalFunds.toNumber()).to.equal(initialTotalFunds + DEPOSIT_AMOUNT);
    });

    it("should fail with insufficient user funds", async () => {
      const excessiveAmount = INITIAL_MINT_AMOUNT + 1;
      
      try {
        await program.methods
          .storeFunds(new anchor.BN(excessiveAmount))
          .accounts({
            fundAccount,
            fromTokenAccount: user1TokenAccount,
            fundTokenAccount,
            authority: user1.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([user1])
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("insufficient");
      }
    });
  });

  describe("Fund Allocation", () => {
    let recipientAccount: PublicKey;

    beforeEach(async () => {
      const recipient = Keypair.generate();
      recipientAccount = await createAssociatedTokenAccount(
        provider.connection,
        admin,
        mint,
        recipient.publicKey
      );
    });

    it("should allow admin to allocate funds", async () => {
      const initialFundBalance = await getAccount(provider.connection, fundTokenAccount);
      const initialRecipientBalance = await getAccount(provider.connection, recipientAccount);
      const initialTotalFunds = (await program.account.fundAccount.fetch(fundAccount)).totalFunds.toNumber();

      await program.methods
        .allocateFunds(new anchor.BN(ALLOCATION_AMOUNT), admin.publicKey)
        .accounts({
          fundAccount,
          fundTokenAccount,
          toTokenAccount: recipientAccount,
          admin: admin.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([admin])
        .rpc();

      const finalFundBalance = await getAccount(provider.connection, fundTokenAccount);
      const finalRecipientBalance = await getAccount(provider.connection, recipientAccount);
      const fundAccountData = await program.account.fundAccount.fetch(fundAccount);

      expect(Number(initialFundBalance.amount) - Number(finalFundBalance.amount)).to.equal(ALLOCATION_AMOUNT);
      expect(Number(finalRecipientBalance.amount) - Number(initialRecipientBalance.amount)).to.equal(ALLOCATION_AMOUNT);
      expect(fundAccountData.totalFunds.toNumber()).to.equal(initialTotalFunds - ALLOCATION_AMOUNT);
    });

    it("should fail when non-admin tries to allocate funds", async () => {
      try {
        await program.methods
          .allocateFunds(new anchor.BN(ALLOCATION_AMOUNT), user1.publicKey)
          .accounts({
            fundAccount,
            fundTokenAccount,
            toTokenAccount: recipientAccount,
            admin: user1.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([user1])
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("UnauthorizedAdmin");
      }
    });

    it("should fail when allocating more than available funds", async () => {
      const currentFunds = (await program.account.fundAccount.fetch(fundAccount)).totalFunds.toNumber();
      const excessiveAmount = currentFunds + 1;

      try {
        await program.methods
          .allocateFunds(new anchor.BN(excessiveAmount), admin.publicKey)
          .accounts({
            fundAccount,
            fundTokenAccount,
            toTokenAccount: recipientAccount,
            admin: admin.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([admin])
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("InsufficientFunds");
      }
    });
  });

  describe("Admin Management", () => {
    it("should allow current admin to set new admin", async () => {
      await program.methods
        .setAdmin(newAdmin.publicKey)
        .accounts({
          fundAccount,
          currentAdmin: admin.publicKey,
        })
        .signers([admin])
        .rpc();

      const fundAccountData = await program.account.fundAccount.fetch(fundAccount);
      expect(fundAccountData.admin.toString()).to.equal(newAdmin.publicKey.toString());
    });

    it("should allow new admin to allocate funds", async () => {
      const recipient = Keypair.generate();
      const recipientAccount = await createAssociatedTokenAccount(
        provider.connection,
        admin,
        mint,
        recipient.publicKey
      );

      const remainingFunds = (await program.account.fundAccount.fetch(fundAccount)).totalFunds.toNumber();
      const allocationAmount = Math.min(10_000_000, remainingFunds); // 10 tokens or remaining funds

      if (allocationAmount > 0) {
        await program.methods
          .allocateFunds(new anchor.BN(allocationAmount), newAdmin.publicKey)
          .accounts({
            fundAccount,
            fundTokenAccount,
            toTokenAccount: recipientAccount,
            admin: newAdmin.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([newAdmin])
          .rpc();

        const recipientBalance = await getAccount(provider.connection, recipientAccount);
        expect(Number(recipientBalance.amount)).to.equal(allocationAmount);
      }
    });

    it("should fail when old admin tries to allocate funds", async () => {
      const recipient = Keypair.generate();
      const recipientAccount = await createAssociatedTokenAccount(
        provider.connection,
        admin,
        mint,
        recipient.publicKey
      );

      try {
        await program.methods
          .allocateFunds(new anchor.BN(1_000_000), admin.publicKey)
          .accounts({
            fundAccount,
            fundTokenAccount,
            toTokenAccount: recipientAccount,
            admin: admin.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([admin])
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("UnauthorizedAdmin");
      }
    });

    it("should fail when non-admin tries to set new admin", async () => {
      try {
        await program.methods
          .setAdmin(user1.publicKey)
          .accounts({
            fundAccount,
            currentAdmin: user1.publicKey,
          })
          .signers([user1])
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("UnauthorizedAdmin");
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero amount deposits", async () => {
      try {
        await program.methods
          .storeFunds(new anchor.BN(0))
          .accounts({
            fundAccount,
            fromTokenAccount: user1TokenAccount,
            fundTokenAccount,
            authority: user1.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([user1])
          .rpc();
      } catch (error) {
        expect(error.message).to.include("cannot transfer 0");
      }
    });

    it("should handle zero amount allocations", async () => {
      const recipient = Keypair.generate();
      const recipientAccount = await createAssociatedTokenAccount(
        provider.connection,
        admin,
        mint,
        recipient.publicKey
      );

      try {
        await program.methods
          .allocateFunds(new anchor.BN(0), newAdmin.publicKey)
          .accounts({
            fundAccount,
            fundTokenAccount,
            toTokenAccount: recipientAccount,
            admin: newAdmin.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([newAdmin])
          .rpc();
      } catch (error) {
        expect(error.message).to.include("cannot transfer 0");
      }
    });
  });
});
