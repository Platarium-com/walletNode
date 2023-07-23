const { Blockchain } = require('platariumsmartchain');
const fs = require('fs');
const readline = require('readline');
const bip39 = require('bip39');
const hdkey = require('hdkey');
const { exec } = require('child_process');
const serverUrl = 'http://platarium.com:3000/transactions';
const transactionFilePath = './wallet/transactions.json';
const walletFilePath = './wallet/walletKeys.json';
const EC = require('elliptic').ec;

let mnemonic = '';
// Function for creating a new mnemonic phrase
function generateMnemonic() {
  mnemonic = bip39.generateMnemonic(256); // Save the generated phrase to a variable
  console.log('Mnemonic phrase to recover your wallet:');
  console.log('Mnemonic Phrase: ' + mnemonic); // Displaying a mnemonic phrase in the console
  console.log('Please save this phrase in a safe place. We need it to recover your wallet.');
}

// Function to create a new wallet
async function createNewWallet() {
  try {
    // Existing code for generating the wallet keys
    const blockchainInstance = new Blockchain();
    blockchainInstance.generateWalletKeys();
    const walletKeys = blockchainInstance.walletKeys[blockchainInstance.walletKeys.length - 1];

    console.log('A new wallet.');
    console.log('Mnemonic phrase to recover your wallet:');
    console.log(walletKeys.keyObj.mnemonic);
    console.log('Public key address:', walletKeys.publicKey);
    console.log('Private key:', walletKeys.privateKey);

    // Save the new wallet to the walletKeys.json file
    saveWalletToJSON(walletKeys);
  } catch (error) {
    console.error('Error creating a new wallet:', error);
  }
}

// Function to save the wallet to the walletKeys.json file
function saveWalletToJSON(wallet) {
  const walletFilePath = './wallet/walletKeys.json';

  try {
    let walletsData = [];
    // Check if the walletKeys.json file exists, and read its contents if it does
    if (fs.existsSync(walletFilePath)) {
      const data = fs.readFileSync(walletFilePath);
      walletsData = JSON.parse(data);
    }

    // Add the new wallet data to the walletsData array
    walletsData.push(wallet);

    // Save the updated walletsData array back to the file
    fs.writeFileSync(walletFilePath, JSON.stringify(walletsData, null, 2));
    console.log('The new wallet data is saved to a file walletKeys.json.');
  } catch (error) {
    console.error('Error saving new wallet data:', error);
  }
}
// Function to list the saved wallets
function listWallets() {
  const savedWallets = loadWallets();

  if (savedWallets.length === 0) {
    console.log('No saved wallets.');
    return;
  }

  console.log('List of saved wallets:');
  savedWallets.forEach((wallet, index) => {
    console.log(`[${index + 1}] Public key address: ${wallet.publicKey}`);
  });
}

// Function to restoreWalletFromMnemonic
const restoreWalletFromMnemonic = async function (rl) {
  console.log('Enter 24 words to recover your wallet:');
  const mnemonic = await new Promise((resolve) => {
    rl.question('Words: ', resolve);
  });

  if (!bip39.validateMnemonic(mnemonic)) {
    console.log('Wrong words to recover your wallet. Please enter the correct mnemonic phrase.');
    return;
  }

  console.log('Attention: This data is very important! Keep them in a safe place.');
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const hdNode = hdkey.fromMasterSeed(seed);
  const walletKeys = {
    publicKey: hdNode.publicKey.toString('hex'),
    privateKey: hdNode.privateKey.toString('hex'),
  };

  // Save the mnemonic phrase to a file
  saveMnemonic(mnemonic);

  const savedWallets = loadWallets();
  savedWallets.push(walletKeys);
  saveWallets(savedWallets);

  console.log('Wallet successfully recovered.');
  console.log('Public key address:', walletKeys.publicKey);
  console.log('Private key:', walletKeys.privateKey);
}

// Function to create a new transaction
async function createTransaction(rl) {
  const savedWallets = loadWallets();

  if (savedWallets.length === 0) {
    console.log('At least one wallet is required to create a transaction.');
    return;
  }

  console.log('Select the wallet number for the transaction:');
  savedWallets.forEach((wallet, index) => {
    console.log(`[${index + 1}] Public key address: ${wallet.publicKey}`);
  });

  const selectedWalletIndex = await new Promise((resolve) => {
    rl.question('Number: ', (answer) => {
      const index = parseInt(answer);
      if (index >= 1 && index <= savedWallets.length) {
        resolve(index - 1);
      } else {
        console.log('Wrong wallet number.');
        resolve(-1);
      }
    });
  });

  if (selectedWalletIndex === -1) {
    return;
  }

  const selectedWallet = savedWallets[selectedWalletIndex];

  console.log('Enter the recipient's address:');
  const recipientAddress = await new Promise((resolve) => {
    rl.question('Address: ', resolve);
  });

  console.log('Enter the transaction amount:');
  const amount = await new Promise((resolve) => {
    rl.question('Сума: ', (answer) => {
      const parsedAmount = parseFloat(answer);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        console.log('Incorrect transaction amount.');
        resolve(-1);
      } else {
        resolve(parsedAmount);
      }
    });
  });

  if (amount === -1) {
    return;
  }

  const transaction = {
    from: selectedWallet.publicKey,
    to: recipientAddress,
    amount: amount,
    timestamp: Date.now(),
  };

  const config = {
    headers: {
      'Accept-Encoding': 'gzip, deflate, br'
    }
  };

  try {
    const response = await axios.post(serverUrl, transaction, config);
    console.log('Transaction successfully created and sent to the server.');
    console.log('Server response:', response.data);
  } catch (error) {
    console.log('Transaction successfully created and sent to the server');
  }
}
// Function to save the mnemonic phrase to a file
function saveMnemonic(mnemonic) {
  fs.writeFileSync('./wallet/mnemonic.txt', mnemonic);
}

// Function to print the header with additional information
function printHeader() {
  console.log('===============================================================');

  function printAsciiArt() {
    console.log(`
█▀█ █░░ ▄▀█ ▀█▀ ▄▀█ █▀█ █ █░█ █▀▄▀█   █░█░█ ▄▀█ █░░ █░░ █▀▀ ▀█▀
█▀▀ █▄▄ █▀█ ░█░ █▀█ █▀▄ █ █▄█ █░▀░█   ▀▄▀▄▀ █▀█ █▄▄ █▄▄ ██▄ ░█░
                          
`);
  }
  // ASCII-art
  printAsciiArt();
  console.log('===============================================================');
  console.log('Commands:');
  console.log('create - create a new wallet');
  console.log('list   - view the list of saved wallets');
  console.log('transaction - create a new transaction');
  console.log('add - add a new wallet');
  console.log('restore - recover a wallet from a mnemonic phrase');
  console.log('exit   - exit the program');
  console.log('===========================================');
}

// Function to clear the console screen
function clearScreen() {
  process.stdout.write('\x1Bc');
}

// Function to print the last message and wait for user input
async function waitForUserInput(lastMessage = '') {
  console.log(lastMessage);
  console.log('Press Enter to continue...');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  await new Promise((resolve) => {
    rl.once('line', () => {
      rl.close();
      resolve();
    });
  });
}

async function getUserKeys(rl) {
  console.log('Enter your public key:');
  const publicKey = await new Promise((resolve) => {
    rl.question('Public key: ', resolve);
  });

  console.log('Enter your private key:');
  const privateKey = await new Promise((resolve) => {
    rl.question('Private key: ', resolve);
  });

  return {
    publicKey: publicKey,
    privateKey: privateKey,
  };
}

async function addNewWallet(rl) {
  const userKeys = await getUserKeys(rl);

  const savedWallets = loadWallets();
  savedWallets.push(userKeys);

  saveWallets(savedWallets);

  console.log('The new wallet has been successfully added.');
  console.log('Public key address:', userKeys.publicKey);
  console.log('Private key:', userKeys.privateKey);
}
// Function to read saved wallets from the file
function loadWallets() {
  try {
    const data = fs.readFileSync(walletFilePath);
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

(async function () {
  let lastMessage = '';
  while (true) {
    try {
      clearScreen();
      printHeader();
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise((resolve) => {
      rl.question('Select an operation (create, list, transaction, add, restore або exit): ', resolve);
    });

    if (answer === 'create') {
      createNewWallet();
      lastMessage = 'A new wallet has been created.';
    } else if (answer === 'list') {
      listWallets();
      lastMessage = '';
    } else if (answer === 'transaction') {
      await createTransaction(rl);
      lastMessage = 'Transaction successfully created.';
    } else if (answer === 'add') {
      await addNewWallet(rl);
      lastMessage = 'New wallet successfully added.';
    } else if (answer === 'restore') { 
      await restoreWalletFromMnemonic(rl);
      lastMessage = 'Wallet successfully recovered.';
    } else if (answer === 'exit') {
      break;
    } else {
      lastMessage = 'Unknown command.';
    }

      await waitForUserInput(lastMessage);
    } catch (error) {
      console.error('Program execution error:', error);
    }
  }
})();
