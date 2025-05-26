%lang starknet

from starkware.cairo.common.cairo_builtins import HashBuiltin
from starkware.starknet.common.syscalls import get_caller_address
from starkware.cairo.common.uint256 import Uint256, uint256_add
from starkware.cairo.common.alloc import alloc

# Storage variables
@storage_var
func token_counter() -> (count: Uint256):
end

@storage_var
func token_owner(token_id: Uint256) -> (owner: felt):
end

@storage_var
func token_metadata_patient_id(token_id: Uint256) -> (patient_id: felt):
end

@storage_var
func token_metadata_scan_type(token_id: Uint256) -> (scan_type: felt):
end

@storage_var
func token_metadata_ipfs_hash(token_id: Uint256) -> (ipfs_hash: felt):
end

@storage_var
func token_metadata_doctor(token_id: Uint256) -> (doctor: felt):
end

@storage_var
func token_metadata_timestamp(token_id: Uint256) -> (timestamp: felt):
end

@storage_var
func patient_token_count(patient_id: felt) -> (count: Uint256):
end

# Events
@event
func NFTMinted(patient_id: felt, token_id: Uint256, ipfs_hash: felt):
end

# Constructor
@constructor
func constructor{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}():
    token_counter.write(Uint256(0, 0))
    return ()
end

# Main minting function
@external
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
    
    # Get current token counter and increment
    let (current_count) = token_counter.read()
    let (new_token_id, _) = uint256_add(current_count, Uint256(1, 0))
    
    # Update token counter
    token_counter.write(new_token_id)
    
    # Store token owner
    token_owner.write(new_token_id, caller)
    
    # Store metadata separately
    token_metadata_patient_id.write(new_token_id, patient_id)
    token_metadata_scan_type.write(new_token_id, scan_type)
    token_metadata_ipfs_hash.write(new_token_id, ipfs_hash)
    token_metadata_doctor.write(new_token_id, doctor)
    token_metadata_timestamp.write(new_token_id, upload_timestamp)
    
    # Update patient token count
    let (patient_count) = patient_token_count.read(patient_id)
    let (new_patient_count, _) = uint256_add(patient_count, Uint256(1, 0))
    patient_token_count.write(patient_id, new_patient_count)
    
    # Emit event
    NFTMinted.emit(patient_id, new_token_id, ipfs_hash)
    
    return (new_token_id)
end

# View functions
@view
func get_token_owner{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    token_id: Uint256
) -> (owner: felt):
    let (owner) = token_owner.read(token_id)
    return (owner)
end

@view
func get_token_metadata{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    token_id: Uint256
) -> (patient_id: felt, scan_type: felt, ipfs_hash: felt, doctor: felt, timestamp: felt):
    let (patient_id) = token_metadata_patient_id.read(token_id)
    let (scan_type) = token_metadata_scan_type.read(token_id)
    let (ipfs_hash) = token_metadata_ipfs_hash.read(token_id)
    let (doctor) = token_metadata_doctor.read(token_id)
    let (timestamp) = token_metadata_timestamp.read(token_id)
    
    return (patient_id, scan_type, ipfs_hash, doctor, timestamp)
end