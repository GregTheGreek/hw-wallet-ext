// Paths
export const LEGACY_HD = "LEGACY_HD";
export const LEGACY_HD_PATH = "44'/60'/0'/0"
export const LEDGER_LIVE = "LEDGER_LIVE";
export const LEDGER_LIVE_PATH = "44'/60'/0'/0/0";
export const DEFAULT_DROPDOWN_VALUES = [
    {
        key: LEDGER_LIVE,
        text: LEDGER_LIVE + " - " + LEDGER_LIVE_PATH,
        value: LEDGER_LIVE
    },
    {
        key: LEGACY_HD,
        text: LEGACY_HD + " - " + LEGACY_HD_PATH,
        value: LEGACY_HD,
    }
]

// Networks
export const MAINNET = "MAINNET";
export const GOERLI = "GOERLI";
export const ROPSTEN = "ROPSTEN";
export const DEFAULT_NETWORK_VALUE = GOERLI;
export const NETWORK_OPTIONS = [
    { key: "Goerli", text: "Goerli", value: GOERLI },
    { key: "Ropsten", text: "Ropsten", value: ROPSTEN },
    { key: "Mainnet", text: "Mainnet", value: MAINNET },
];
