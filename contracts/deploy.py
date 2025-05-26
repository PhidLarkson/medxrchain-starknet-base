#!/usr/bin/env python3
"""
Medical NFT Contract Deployment Script for Starknet Testnet
"""

import asyncio
import json
from starknet_py.net.full_node_client import FullNodeClient
from starknet_py.net.models import StarknetChainId
from starknet_py.net.account.account import Account
from starknet_py.net.signer.stark_curve_signer import KeyPair
from starknet_py.contract import Contract
from starknet_py.net.client_models import Call

# Configuration
TESTNET_RPC_URL = "https://starknet-sepolia.public.blastapi.io/rpc/v0_7"
ACCOUNT_ADDRESS = "YOUR_ACCOUNT_ADDRESS_HERE"  # Replace with your account address
PRIVATE_KEY = "YOUR_PRIVATE_KEY_HERE"  # Replace with your private key
CONTRACT_COMPILED_PATH = "medical_scan_nft_compiled.json"

async def deploy_contract():
    """Deploy the Medical NFT contract to Starknet testnet"""
    
    print("🏥 Starting Medical NFT Contract Deployment...")
    
    # Initialize client
    client = FullNodeClient(node_url=TESTNET_RPC_URL)
    
    # Create account
    key_pair = KeyPair.from_private_key(PRIVATE_KEY)
    account = Account(
        address=ACCOUNT_ADDRESS,
        client=client,
        key_pair=key_pair,
        chain=StarknetChainId.SEPOLIA
    )
    
    print(f"📱 Using account: {hex(account.address)}")
    
    # Load compiled contract
    try:
        with open(CONTRACT_COMPILED_PATH, "r") as f:
            compiled_contract = json.load(f)
    except FileNotFoundError:
        print(f"❌ Contract file not found: {CONTRACT_COMPILED_PATH}")
        print("Make sure you've compiled the contract with 'scarb build'")
        return
    
    print("📄 Contract loaded successfully")
    
    # Declare the contract
    print("📤 Declaring contract...")
    declare_result = await account.sign_declare_v2(
        compiled_contract=compiled_contract,
        max_fee=int(1e16)  # 0.01 ETH max fee
    )
    
    await account.client.wait_for_tx(declare_result.transaction_hash)
    print(f"✅ Contract declared with class hash: {hex(declare_result.class_hash)}")
    
    # Deploy the contract
    print("🚀 Deploying contract...")
    deploy_result = await account.sign_invoke_v1(
        calls=[
            Call(
                to_addr=declare_result.class_hash,
                selector="constructor",
                calldata=[]
            )
        ],
        max_fee=int(1e16)
    )
    
    await account.client.wait_for_tx(deploy_result.transaction_hash)
    
    # Get the deployed contract address
    receipt = await client.get_transaction_receipt(deploy_result.transaction_hash)
    contract_address = receipt.events[0].from_address
    
    print(f"🎉 Contract deployed successfully!")
    print(f"📍 Contract Address: {hex(contract_address)}")
    print(f"🔗 Transaction Hash: {hex(deploy_result.transaction_hash)}")
    print(f"🏷️  Class Hash: {hex(declare_result.class_hash)}")
    
    # Save deployment info
    deployment_info = {
        "contract_address": hex(contract_address),
        "class_hash": hex(declare_result.class_hash),
        "transaction_hash": hex(deploy_result.transaction_hash),
        "network": "starknet-sepolia"
    }
    
    with open("deployment_info.json", "w") as f:
        json.dump(deployment_info, f, indent=2)
    
    print("💾 Deployment info saved to deployment_info.json")
    
    return contract_address

async def test_contract(contract_address):
    """Test the deployed contract"""
    print("\n🧪 Testing deployed contract...")
    
    client = FullNodeClient(node_url=TESTNET_RPC_URL)
    key_pair = KeyPair.from_private_key(PRIVATE_KEY)
    account = Account(
        address=ACCOUNT_ADDRESS,
        client=client,
        key_pair=key_pair,
        chain=StarknetChainId.SEPOLIA
    )
    
    # Load contract ABI
    with open(CONTRACT_COMPILED_PATH, "r") as f:
        contract_data = json.load(f)
    
    contract = Contract(
        address=contract_address,
        abi=contract_data["abi"],
        provider=account
    )
    
    # Test: Get total supply (should be 0 initially)
    total_supply = await contract.functions["get_total_supply"].call()
    print(f"📊 Total Supply: {total_supply.total_supply}")
    
    # Test: Mint a medical NFT
    print("🏥 Minting test medical NFT...")
    
    mint_tx = await contract.functions["mint_medical_nft"].invoke_v1(
        patient_id=1234567890,  # Example patient ID
        scan_type=1,  # 1 for X-ray, 2 for MRI, etc.
        ipfs_hash=0x1234567890abcdef,  # Example IPFS hash
        doctor=0x9876543210fedcba,  # Example doctor identifier
        upload_timestamp=1640995200,  # Example timestamp
        diagnosis_summary=0xabcdef1234567890,  # Example diagnosis
        notes=0xfedcba0987654321,  # Example notes
        max_fee=int(1e16)
    )
    
    await account.client.wait_for_tx(mint_tx.transaction_hash)
    print(f"✅ NFT minted! Transaction: {hex(mint_tx.transaction_hash)}")
    
    # Check total supply again
    total_supply = await contract.functions["get_total_supply"].call()
    print(f"📊 Total Supply after minting: {total_supply.total_supply}")
    
    # Get token metadata
    metadata = await contract.functions["get_token_metadata"].call(token_id=1)
    print(f"📋 Token Metadata: {metadata}")

if __name__ == "__main__":
    print("=== Medical NFT Contract Deployment ===\n")
    
    # Check if configuration is set
    if ACCOUNT_ADDRESS == "YOUR_ACCOUNT_ADDRESS_HERE" or PRIVATE_KEY == "YOUR_PRIVATE_KEY_HERE":
        print("❌ Please configure your account address and private key in the script")
        print("You can get these from your Starknet wallet (ArgentX or Braavos)")
        exit(1)
    
    try:
        contract_address = asyncio.run(deploy_contract())
        if contract_address:
            asyncio.run(test_contract(contract_address))
    except Exception as e:
        print(f"❌ Deployment failed: {e}")
        print("Make sure you have enough ETH in your account for gas fees")