import { ethers, utils } from "ethers";
import { LEDGER_LIVE, LEGACY_HD, LEGACY_HD_PATH, LEDGER_LIVE_PATH } from "./constants";
import { getNetworkId } from "./helpers";
// @ts-ignore
import Transport from "@ledgerhq/hw-transport-webusb";
// import Transport from "@ledgerhq/hw-transport-u2f";
const eth = require("@ledgerhq/hw-app-eth").default;

export interface Account {
    publicKey: string;
    address: string;
    derivationPath: string;
}

export interface UnsignedTxOpts {
    path: string;
    amount: string;
    to: string;
    chainId: string;
}

export class EthLedgerTransport {
    public transport: any;
    public ethApp: any;

    public async connect() {
        try {
            const transport = await Transport.create();
            const ethApp = new eth(transport);

            this.transport = transport;
            this.ethApp = ethApp;
        } catch (e) {
            console.log(e)
            return "Connecting to transport failed!";
        }
    }

    public async getAddress(derivationPath: string): Promise<Account | Error> {
        try {
            const res: Account = await this.ethApp.getAddress(derivationPath);
            res.derivationPath = derivationPath;
            console.log(derivationPath)
            res.address = res.address.toLowerCase();
            return res;
        } catch (e) {
            // console.log(e);
            return new Error("Could not get ethereum address");
        }
    }

    public async signTransaction({ to, amount, chainId, path }: UnsignedTxOpts) {
        const tx = {
            to,
            value: ethers.utils.parseEther(amount),
            chainId: getNetworkId(chainId)
        }
        // const tx = {
        //     to: "0xb2Fb89aaBba7a6C8DD061fD2a6F046fb94394ee6",
        //     value: ethers.utils.parseEther(amount),
        //     chainId: 5
        // }
        // path = "44'/60'/0'/0";

        
        console.log("transaction", tx)
        console.log(path)
        const unsignedTx = ethers.utils.serializeTransaction(tx).substring(2);
        console.log("unsigned", unsignedTx)
        const signature = await this.ethApp.signTransaction(path, unsignedTx);
        console.log(signature)
        let sig = {
            v: parseInt(signature.v, 16),
            r: '0x' + signature.r,
            s: '0x' + signature.s,
        };

        console.log("sig", sig)
        return {tx, sig};
    }

    public async signMessage(msg: any, derivationPath: any) {
        return this.ethApp.signPersonalMessage(derivationPath, Buffer.from(msg).toString("hex"))
            .then((result: any) => {
                let v;
                v = result['v'] - 27;
                v = v.toString(16);
                if (v.length < 2) {
                    v = "0" + v;
                }
                return "Signature 0x" + result['r'] + result['s'] + v;
            })
            .catch((e: any) => {
                // console.log(e)
            });
    }

    public async getAllAddresses(type: string, numAddresses: number): Promise<Account[]> {
        const funcs = [...Array(numAddresses)].map((_, i) => () => {
            const path = getDerivationPath(type, i);
            return this.getAddress(path);
        });

        return funcs.reduce((promise, func) =>
            // @ts-ignore
            promise.then(result =>
                func().then(Array.prototype.concat.bind(result))),
            Promise.resolve([]));
    }
}

export function getDerivationPath(type: string, account: number) {
    switch (type) {
        case LEGACY_HD:
            const legacy = LEGACY_HD_PATH.split("/");
            // Splice returns the removed items
            legacy.splice(2, 1, `${account}'`);
            return legacy.join("/");
        case LEDGER_LIVE:
            const ledgerLive = LEDGER_LIVE_PATH.split("/");
            // Splice returns the removed items
            ledgerLive.splice(2, 1, `${account}'`);
            return ledgerLive.join("/");
        default:
            const defaultLedgerLive = LEDGER_LIVE_PATH.split("/");
            // Splice returns the removed items
            defaultLedgerLive.splice(2, 1, `${account}'`);
            return defaultLedgerLive.join("/");
    }
}

// export async function getBalance(address: any, network = null) {
export async function getBalance(address: any, network: any) {
    // Todo, move this somewehre
    const provider = ethers.getDefaultProvider(network);
    const balance = await provider.getBalance(address);
    return ethers.utils.formatEther(balance);
}

export function formatBalance(balance: string, decimalPlaces: number) {
    const arr = balance.split(".");
    arr[1] = arr[1].slice(0, decimalPlaces);
    return arr.join(".");
}
