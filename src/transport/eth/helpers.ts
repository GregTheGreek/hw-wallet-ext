import { MAINNET, ROPSTEN, GOERLI } from "./constants";

export function getNetworkId(name: string): number {
    switch (name) {
        case MAINNET:
            return 1;
        case ROPSTEN:
            return 3;
        case GOERLI:
            return 5;
        default:
            return 5;
    }
}