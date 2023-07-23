<h3 align="center">Platarium Wallet Node</h3>

This is a simple project with a self-implemented blockchain for creating and managing wallets and transactions.

## Requirements <a name="getting_started"></a>
Before getting started, ensure you have the following prerequisites installed:

Node.js (version 12 or higher)
npm (Node Package Manager, comes with Node.js)
### Installation
Clone the repository to your computer:
bash
Copy code

```
git clone https://github.com/Platarium-com/walletNode/wallet.js.git
```

Navigate to the project directory:
bash
Copy code
```
cd wallet.js
```
Install the dependencies using npm:
bash
Copy code
npm install
### Usage
## Generate a Mnemonic Phrase and Create a New Wallet
Run the program using the following command:

bash
Copy code
node wallet.js
You will see a menu with available options. Choose "create" to generate a new wallet. The program will generate a mnemonic phrase for wallet recovery, public and private keys, which will be displayed on the screen. Save the mnemonic phrase in a secure place as it is required to recover your wallet.

### View Saved Wallets
To view the list of saved wallets, choose "list" during program execution.

### Create a New Transaction
To create a new transaction, choose "transaction" during program execution. Enter the wallet number from which you want to make the transfer, the recipient's address, and the transaction amount. The transaction will be created and sent to the server.

### Add a New Wallet Manually
To manually add a new wallet, choose "add" during program execution. Enter your public and private keys.

### Restore a Wallet from a Mnemonic Phrase
To restore a wallet from a mnemonic phrase, choose "restore" during program execution. Enter the 24 words for wallet recovery. The wallet will be restored, and the public and private keys will be displayed on the screen.

### Exit the Program
To exit the program, choose "exit" during program execution.

### License
This project is licensed under the MIT License.

### Author
Platarium (support@platarium.com)
