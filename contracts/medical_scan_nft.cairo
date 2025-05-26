#[starknet::contract]
mod MedicalNFT {
    use starknet::{ContractAddress, get_caller_address};
    use core::pedersen::pedersen;

    #[storage]
    struct Storage {
        token_counter: u256,
        token_owner: LegacyMap<u256, ContractAddress>,
        token_metadata_patient_id: LegacyMap<u256, felt252>,
        token_metadata_scan_type: LegacyMap<u256, felt252>,
        token_metadata_ipfs_hash: LegacyMap<u256, felt252>,
        token_metadata_doctor: LegacyMap<u256, felt252>,
        token_metadata_timestamp: LegacyMap<u256, felt252>,
        patient_token_count: LegacyMap<felt252, u256>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        NFTMinted: NFTMinted,
    }

    #[derive(Drop, starknet::Event)]
    struct NFTMinted {
        #[key]
        patient_id: felt252,
        #[key]
        token_id: u256,
        ipfs_hash: felt252,
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.token_counter.write(0);
    }

    #[external(v0)]
    fn mint_medical_nft(
        ref self: ContractState,
        patient_id: felt252,
        scan_type: felt252,
        ipfs_hash: felt252,
        doctor: felt252,
        upload_timestamp: felt252,
        diagnosis_summary: felt252,
        notes: felt252
    ) -> u256 {
        let caller = get_caller_address();
        
        // Get current token counter and increment
        let current_count = self.token_counter.read();
        let new_token_id = current_count + 1;
        
        // Update token counter
        self.token_counter.write(new_token_id);
        
        // Store token owner
        self.token_owner.write(new_token_id, caller);
        
        // Store metadata
        self.token_metadata_patient_id.write(new_token_id, patient_id);
        self.token_metadata_scan_type.write(new_token_id, scan_type);
        self.token_metadata_ipfs_hash.write(new_token_id, ipfs_hash);
        self.token_metadata_doctor.write(new_token_id, doctor);
        self.token_metadata_timestamp.write(new_token_id, upload_timestamp);
        
        // Update patient token count
        let patient_count = self.patient_token_count.read(patient_id);
        self.patient_token_count.write(patient_id, patient_count + 1);
        
        // Emit event
        self.emit(NFTMinted { 
            patient_id, 
            token_id: new_token_id, 
            ipfs_hash 
        });
        
        new_token_id
    }

    #[external(v0)]
    fn get_token_owner(self: @ContractState, token_id: u256) -> ContractAddress {
        self.token_owner.read(token_id)
    }

    #[external(v0)]
    fn get_token_metadata(
        self: @ContractState, 
        token_id: u256
    ) -> (felt252, felt252, felt252, felt252, felt252) {
        let patient_id = self.token_metadata_patient_id.read(token_id);
        let scan_type = self.token_metadata_scan_type.read(token_id);
        let ipfs_hash = self.token_metadata_ipfs_hash.read(token_id);
        let doctor = self.token_metadata_doctor.read(token_id);
        let timestamp = self.token_metadata_timestamp.read(token_id);
        
        (patient_id, scan_type, ipfs_hash, doctor, timestamp)
    }

    #[external(v0)]
    fn get_total_supply(self: @ContractState) -> u256 {
        self.token_counter.read()
    }

    #[external(v0)]
    fn get_patient_token_count(self: @ContractState, patient_id: felt252) -> u256 {
        self.patient_token_count.read(patient_id)
    }
}