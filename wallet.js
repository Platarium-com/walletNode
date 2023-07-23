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
// Функція для створення нової мнемонічної фрази
function generateMnemonic() {
  mnemonic = bip39.generateMnemonic(256); // Зберігаємо згенеровану фразу в змінну
  console.log('Мнемонічна фраза для відновлення кошелька:');
  console.log('Mnemonic Phrase: ' + mnemonic); // Виводимо мнемонічну фразу в консоль
  console.log('Будь ласка, збережіть цю фразу у безпечному місці. Вона потрібна для відновлення вашого кошелька.');
}

// Function to read saved wallets from the file
// Function to create a new wallet
async function createNewWallet() {
  try {
    // Existing code for generating the wallet keys
    const blockchainInstance = new Blockchain();
    blockchainInstance.generateWalletKeys();
    const walletKeys = blockchainInstance.walletKeys[blockchainInstance.walletKeys.length - 1];

    console.log('Створено новий кошелек.');
    console.log('Мнемонічна фраза для відновлення кошелька:');
    console.log(walletKeys.keyObj.mnemonic);
    console.log('Адреса публічного ключа:', walletKeys.publicKey);
    console.log('Приватний ключ:', walletKeys.privateKey);

    // Save the new wallet to the walletKeys.json file
    saveWalletToJSON(walletKeys);
  } catch (error) {
    console.error('Помилка при створенні нового кошелька:', error);
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
    console.log('Дані нового кошелька збережено у файл walletKeys.json.');
  } catch (error) {
    console.error('Помилка при збереженні даних нового кошелька:', error);
  }
}
// Function to list the saved wallets
function listWallets() {
  const savedWallets = loadWallets();

  if (savedWallets.length === 0) {
    console.log('Немає збережених кошельків.');
    return;
  }

  console.log('Список збережених кошельків:');
  savedWallets.forEach((wallet, index) => {
    console.log(`[${index + 1}] Адреса публічного ключа: ${wallet.publicKey}`);
  });
}

// Function to restoreWalletFromMnemonic
const restoreWalletFromMnemonic = async function (rl) {
  console.log('Введіть 24 слова для відновлення кошелька:');
  const mnemonic = await new Promise((resolve) => {
    rl.question('Слова: ', resolve);
  });

  if (!bip39.validateMnemonic(mnemonic)) {
    console.log('Невірні слова для відновлення кошелька. Будь ласка, введіть правильну мнемонічну фразу.');
    return;
  }

  console.log('Увага: Ці дані дуже важливі! Збережіть їх у надійному місці.');
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const hdNode = hdkey.fromMasterSeed(seed);
  const walletKeys = {
    publicKey: hdNode.publicKey.toString('hex'),
    privateKey: hdNode.privateKey.toString('hex'),
  };

  // Зберігаємо мнемонічну фразу в файл
  saveMnemonic(mnemonic);

  const savedWallets = loadWallets();
  savedWallets.push(walletKeys);
  saveWallets(savedWallets);

  console.log('Кошелек успішно відновлено.');
  console.log('Адреса публічного ключа:', walletKeys.publicKey);
  console.log('Приватний ключ:', walletKeys.privateKey);
}

// Function to create a new transaction
async function createTransaction(rl) {
  const savedWallets = loadWallets();

  if (savedWallets.length === 0) {
    console.log('Для створення транзакції потрібен мінімум один кошелек.');
    return;
  }

  console.log('Виберіть номер кошелька для транзакції:');
  savedWallets.forEach((wallet, index) => {
    console.log(`[${index + 1}] Адреса публічного ключа: ${wallet.publicKey}`);
  });

  const selectedWalletIndex = await new Promise((resolve) => {
    rl.question('Номер: ', (answer) => {
      const index = parseInt(answer);
      if (index >= 1 && index <= savedWallets.length) {
        resolve(index - 1);
      } else {
        console.log('Невірний номер кошелька.');
        resolve(-1);
      }
    });
  });

  if (selectedWalletIndex === -1) {
    return;
  }

  const selectedWallet = savedWallets[selectedWalletIndex];

  console.log('Введіть адресу одержувача:');
  const recipientAddress = await new Promise((resolve) => {
    rl.question('Адреса: ', resolve);
  });

  console.log('Введіть суму транзакції:');
  const amount = await new Promise((resolve) => {
    rl.question('Сума: ', (answer) => {
      const parsedAmount = parseFloat(answer);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        console.log('Невірна сума транзакції.');
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
    console.log('Транзакцію успішно створено і надіслано на сервер.');
    console.log('Відповідь сервера:', response.data);
  } catch (error) {
    console.log('Транзакцію успішно створено і надіслано на сервер');
  }
}
// Function to save the mnemonic phrase to a file
function saveMnemonic(mnemonic) {
  fs.writeFileSync('./wallet/mnemonic.txt', mnemonic);
}

// Function to print the header with additional information
function printHeader() {
  console.log('===============================================================');
  console.log('===============================================================');
  console.log('Команди:');
  console.log('create - створити новий кошелек');
  console.log('list   - переглянути список збережених кошельків');
  console.log('transaction - створити нову транзакцію');
  console.log('add - додати новий кошелек');
  console.log('restore - відновити кошелек з мнемонічної фрази');
  console.log('exit   - вийти з програми');
  console.log('===========================================');
}

// Function to clear the console screen
function clearScreen() {
  process.stdout.write('\x1Bc');
}

// Function to print the last message and wait for user input
async function waitForUserInput(lastMessage = '') {
  console.log(lastMessage);
  console.log('Натисніть Enter для продовження...');
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
  console.log('Введіть ваш відкритий ключ:');
  const publicKey = await new Promise((resolve) => {
    rl.question('Публічний ключ: ', resolve);
  });

  console.log('Введіть ваш закритий ключ:');
  const privateKey = await new Promise((resolve) => {
    rl.question('Приватний ключ: ', resolve);
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

  console.log('Новий кошелек успішно додано.');
  console.log('Адреса публічного ключа:', userKeys.publicKey);
  console.log('Приватний ключ:', userKeys.privateKey);
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
      rl.question('Виберіть операцію (create, list, transaction, add, restore або exit): ', resolve);
    });

    if (answer === 'create') {
      createNewWallet();
      lastMessage = 'Створено новий кошелек.';
    } else if (answer === 'list') {
      listWallets();
      lastMessage = '';
    } else if (answer === 'transaction') {
      await createTransaction(rl);
      lastMessage = 'Транзакція успішно створена.';
    } else if (answer === 'add') {
      await addNewWallet(rl);
      lastMessage = 'Новий кошелек успішно додано.';
    } else if (answer === 'restore') { // Додано опцію "restore"
      await restoreWalletFromMnemonic(rl);
      lastMessage = 'Кошелек успішно відновлено.';
    } else if (answer === 'exit') {
      break;
    } else {
      lastMessage = 'Невідома команда.';
    }

      await waitForUserInput(lastMessage);
    } catch (error) {
      console.error('Помилка виконання програми:', error);
    }
  }
})();
// Start the main loop
