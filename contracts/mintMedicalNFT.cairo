%lang starknet

from starkware.cairo.common.cairo_builtins import HashBuiltin
from starkware.starknet.common.syscalls import get_caller_address, get_contract_address
from starkware.starknet.common.storage import Storage
from starkware.starknet.common.events import emit_event
from starkware.cairo.common.uint256 import Uint256, uint256_add

from starkware.starknet.common.contracts.erc721 import ERC721

@contract_interface
namespace IERC721:
    func mint(recipient: felt, token_id: Uint256) -> ():
    end
end

struct MedicalScanMetadata:
    patient_id: felt
    scan_type: felt
    ipfs_hash: felt  # store IPFS hash as felt (e.g. CID mapped to felt)
    doctor: felt
    upload_timestamp: felt
    diagnosis_summary: felt
    notes: felt
    # medicalTags could be hashed or stored off-chain due to gas cost
end

@storage_var
func token_owner(token_id: Uint256) -> (owner: felt):
end

@storage_var
func token_metadata(token_id: Uint256) -> (metadata: MedicalScanMetadata):
end

@storage_var
func patient_tokens(patient_id: felt, index: Uint256) -> (token_id: Uint256):
end

@storage_var
func patient_token_count(patient_id: felt) -> (count: Uint256):
end

# ERC721 base methods and events omitted for brevity

@event
func NFTMinted(patient_id: felt, token_id: Uint256, ipfs_hash: felt):
end

@contract
namespace MedicalScanNFT:
    func mint_medical_nft{
        syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr
    }(
        patient_id: felt,
        scan_type: felt,
        ipfs_hash: felt,
        doctor: felt,
        upload_timestamp: felt,
        diagnosis_summary: felt,
        notes: felt
    ) -> (token_id: Uint256):
        alloc_locals

        let (caller) = get_caller_address()

        # Create new token ID (e.g. increment counter)
        let (count) = patient_token_count.read(patient_id)
        let (new_token_id) = uint256_add(count, Uint256(1, 0))

        # Mint the token to caller
        ERC721.mint(caller, new_token_id)

        # Store owner info
        token_owner.write(new_token_id, caller)

        # Store metadata
        token_metadata.write(new_token_id, MedicalScanMetadata(
            patient_id=patient_id,
            scan_type=scan_type,
            ipfs_hash=ipfs_hash,
            doctor=doctor,
            upload_timestamp=upload_timestamp,
            diagnosis_summary=diagnosis_summary,
            notes=notes
        ))

        # Update patient token list
        patient_tokens.write(patient_id, count, new_token_id)
        patient_token_count.write(patient_id, new_token_id)

        # Emit event
        emit_event NFTMinted(patient_id, new_token_id, ipfs_hash)

        return (new_token_id)
    end
end
