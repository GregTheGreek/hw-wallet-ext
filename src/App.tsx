import * as React from 'react';
import './App.css';
import { ethers } from "ethers";
import { Dropdown, List, Input, Button } from 'semantic-ui-react';
// @ts-ignore
import { DEFAULT_DROPDOWN_VALUES, LEDGER_LIVE, LEDGER_LIVE_PATH, DEFAULT_NETWORK_VALUE, NETWORK_OPTIONS } from "./transport/eth/constants";
import { EthLedgerTransport, Account, UnsignedTxOpts } from "./transport/eth";
import 'semantic-ui-css/semantic.min.css'

interface IAppState {
    addresses: Account[];
    connected: boolean;
    network: string;
    HDPath: string;
    ledgerTransport: any;
    loadingHD: boolean;
    maxNumAddresses: number;
    recipient: string;
    sendAmount: string;
    currentAccount?: Account;
    displayAccountSelect?: boolean;
    web3?: any;
}

class App extends React.Component<{}, IAppState> {
    constructor(props: any) {
        super(props);
        this.state = {
            network: DEFAULT_NETWORK_VALUE,
            ledgerTransport: new EthLedgerTransport(),
            recipient: "",
            connected: false,
            displayAccountSelect: false,
            loadingHD: false,
            addresses: [],
            HDPath: LEDGER_LIVE_PATH,
            maxNumAddresses: 1,
            sendAmount: ""
        }

        this.handleSend = this.handleSend.bind(this);
        this.handleChangeAddress = this.handleChangeAddress.bind(this);
        this.handleChangeAmount = this.handleChangeAmount.bind(this);
        this.connect = this.connect.bind(this);
        this.onHDPathChange = this.onHDPathChange.bind(this);
        this.onSelectAccount = this.onSelectAccount.bind(this);
    }

    public async fetchAddresses() {
        const addresses = await this.state.ledgerTransport.getAllAddresses(
            this.state.HDPath,
            this.state.maxNumAddresses
        )
        this.setState({
            addresses,
            loadingHD: false
        })
    }

    public renderAddressesList() {
        const items = this.state.addresses.map((a: Account) => {
            let link;
            if (this.state.network === "mainnet") {
                link = `https://etherscan.io/address/${a.address}`
            } else {
                link = `https://${this.state.network}.etherscan.io/address/${a.address}`
            }
            return (
                <List.Item
                    className="AccountItem"
                    t={a}
                    key={a.address}
                    onClick={() => this.onSelectAccount(a)}
                >
                    <List.Content>
                        <List.Header>
                            {this.formatAddress(a.address)}
                            <a target="_blank" href={link}> Etherscan</a>
                        </List.Header>
                    </List.Content>
                </List.Item>
            );
        })
        return (
            <List
                className="AccountList"
                relaxed="very"
                size="small"
            >
                {items}
            </List>
        )
    }

    public renderAddressesDropdown() {
        return this.state.addresses.map((a: Account) => {
            return {
                key: a.address,
                text: this.formatAddress(a.address),
                value: JSON.stringify(a)
            }
        })
    }

    public onHoverAccount(e: any, state: any) {
        if (state) {
            e.target.style.background = 'red';
        } else {
            e.target.style.background = 'none';
        }
    }

    public async onSelectAccount(stringAccount: any) {
        let account = stringAccount;

        // If values from dropdown menu
        if (typeof stringAccount === "string") {
            account = JSON.parse(stringAccount);
        }
        this.setState({ 
            displayAccountSelect: false,
            currentAccount: account,
        });
    }

    public formatAddress(address: string): string {
        // return `${address.slice(0, 6)} . . . ${address.slice(-4)} - ${formatBalance(balance, 4)} ETH`;
        return `${address.slice(0, 6)} . . . ${address.slice(-4)}`;
    }

    public onHDPathChange({ value }: any) {
        this.setState({
            HDPath: value,
            addresses: [], // Reset Addresses
            loadingHD: true,
            currentAccount: undefined,
        }, () => {
            this.fetchAddresses();
        });
    }

    public async connect() {
        const err = await this.state.ledgerTransport.connect();
        if (err) {
            alert(err);
        } else {
            this.setState({ connected: true })
        }
    }

    public handleChangeAmount(e: any, { value }: any) {
        this.setState({
            sendAmount: value
        });
    }

    public handleChangeAddress(e: any, { value }: any) {
        this.setState({
            recipient: value
        });
    }

    public async handleSend() {
        const transaction: UnsignedTxOpts = {
            to: this.state.recipient,
            amount: this.state.sendAmount,
            path: this.state.currentAccount?.derivationPath as string,
            chainId: this.state.network,
        };
        const provider = ethers.getDefaultProvider(this.state.network.toLowerCase());
        // @ts-ignore
        const {tx, sig} = await this.state.ledgerTransport.signTransaction(transaction, provider);
        tx.gasLimit = await provider.estimateGas(tx);
        tx.gasPrice = await provider.getGasPrice();

        const signedTx = ethers.utils.serializeTransaction(tx, sig);
        console.log("signed", signedTx)
        const p = ethers.utils.parseTransaction(signedTx);
        console.log(p);
        if (p.from !== this.state.currentAccount?.address) {
            console.log(`Incorrect signer!
            GOT ${p.from}
            Wanted ${this.state.currentAccount?.address}`
            )
            return;
        } else {
            try {
                await provider.sendTransaction(signedTx);
            } catch (e) {
                console.log(e)
            }
        }
    }

    public updateNetwork(network: any) {
        this.setState({network});
    }

    public render() {
        return (
            <div className="App">
                <header className="App-header">
                    {this.state.ledgerTransport.network}
                    <Dropdown
                        selection={true}
                        search={true}
                        defaultValue={DEFAULT_NETWORK_VALUE}
                        name="network"
                        disabled={this.state.loadingHD}
                        options={NETWORK_OPTIONS}
                        onChange={(_, { value }) => this.updateNetwork(value)}
                    />
                </header>

                {!this.state.connected ?
                    <div className="buttonConnect" onClick={this.connect}>
                        Connect!
          </div>
                    : null
                }

                {this.state.connected ?
                    <div className="Main">
                        <Dropdown
                            selection={true}
                            name="HD Path"
                            loading={this.state.loadingHD}
                            disabled={this.state.loadingHD}
                            placeholder={LEDGER_LIVE + " - " + LEDGER_LIVE_PATH}
                            options={DEFAULT_DROPDOWN_VALUES}
                            onChange={(_, val) => this.onHDPathChange(val)}
                        />
                        <div>
                            {this.state.addresses.length > 0 ?
                                <div className="AccountListContainer">
                                    {this.state.currentAccount ?
                                        `${this.state.currentAccount.address}\n ${this.state.currentAccount.derivationPath}`:
                                        null
                                    }
                                    {this.state.currentAccount && this.state.displayAccountSelect == false ? 
                                        <div onClick={() => this.setState({ displayAccountSelect: true })}>
                                            Change accounts
                                        </div>
                                        :
                                        this.renderAddressesList()
                                    }
                                </div>
                            : null}
                        </div>
                        {this.state.currentAccount ?
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <Input
                                    name="sendAmount"
                                    label="Amount (ETH)"
                                    placeholder="1.23"
                                    onChange={this.handleChangeAmount}
                                />
                                <Input
                                    width={8}
                                    label="Recipient Address"
                                    name="recipient"
                                    placeholder="0x1234..."
                                    onChange={this.handleChangeAddress}
                                />
                                <Button onClick={this.handleSend}>Send</Button>
                            </div>
                            : null}
                    </div>
                    : null
                }
            </div>
        );
    }
}

export default App;
