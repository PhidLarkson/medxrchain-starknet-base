#[starknet::contract]
mod patient_registry {
    use starknet::ContractAddress;
    use starknet::get_caller_address;

    struct Patient {
        wallet: ContractAddress,
        name: felt252,
        metadata_uri: felt252, // e.g. IPFS hash or description
    }

    #[storage]
    struct Storage {
        patients: LegacyMap<felt252, Patient>, // id => Patient
    }

    #[external]
    fn register_patient(id: felt252, name: felt252, metadata_uri: felt252) {
        let caller = get_caller_address();
        let patient = Patient { wallet: caller, name, metadata_uri };
        patients::write(id, patient);
    }

    #[view]
    fn get_patient(id: felt252) -> Patient {
        patients::read(id)
    }
}
