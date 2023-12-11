import { store } from '@/store'
import { ethers } from 'ethers'
import { globalActions } from '@/store/globalSlices'
import address from '@/artifacts/contractAddress.json'
import abi from '@/artifacts/contracts/DappLottery.sol/DappLottery.json'

const { setWallet, setPurchasedNumbers, setLuckyNumbers, setJackpot, setResult, setParticipants } =
  globalActions
const contractAddress = address.address
const contractAbi = abi.abi
let tx, ethereum

if (typeof window !== 'undefined') {
  ethereum = window.ethereum
}

const toWei = (num) => ethers.utils.parseEther(num.toString())
const fromWei = (num) => ethers.utils.formatEther(num)

const csrEthereumContract = async () => {
  const provider = new ethers.providers.Web3Provider(ethereum)
  const signer = provider.getSigner()
  const contract = new ethers.Contract(contractAddress, contractAbi, signer)
  return contract
}

const ssrEthereumContract = async () => {
  //const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545/');
  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545/')

  const network = await provider.getNetwork()
  console.log('Connected to network:', network)

  const wallet = ethers.Wallet.createRandom()
  const signer = provider.getSigner(wallet.address)
  const contract = new ethers.Contract(contractAddress, contractAbi, signer)
  return contract
}

const connectWallet = async () => {
  try {
    if (!ethereum) return reportError('Please install Metamask')
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
    store.dispatch(setWallet(accounts[0]))
  } catch (error) {
    reportError(error)
  }
}

const monitorWalletConnection = async () => {
  try {
    if (!ethereum) return reportError('Please install Metamask')
    const accounts = await ethereum.request({ method: 'eth_accounts' })

    window.ethereum.on('chainChanged', (chainId) => {
      window.location.reload()
    })

    window.ethereum.on('accountsChanged', async () => {
      store.dispatch(setWallet(accounts[0]))
      await monitorWalletConnection()
    })

    if (accounts.length) {
      store.dispatch(setWallet(accounts[0]))
    } else {
      store.dispatch(setWallet(''))
      reportError('Please, connect wallet, no accounts found.')
    }
  } catch (error) {
    reportError(error)
  }
}

const getLotteries = async () => {
  const contract = await ssrEthereumContract()
  const lotteries = await contract.getLotteries()
  return structureLotteries(lotteries)
}

const getLottery = async (id) => {
  const contract = await ssrEthereumContract()
  const lottery = await contract.getLottery(id)
  return structureLotteries([lottery])[0] //  Pass it like array because structureLotteries needs array
}

const getLuckyNumbers = async (id) => {
  const contract = await ssrEthereumContract()
  const luckyNumbers = await contract.getLotteryLuckyNumbers(id)
  return luckyNumbers
}

const getPurchasedNumbers = async (id) => {
  const contract = await ssrEthereumContract()
  const participants = await contract.getLotteryParticipants(id)
  return structuredNumbers(participants)
}

const createJackpot = async ({ title, description, imageUrl, prize, ticketPrice, expiresAt }) => {
  try {
    if (!ethereum) return reportError('Please install Metamask')
    const wallet = store.getState().globalStates.wallet
    const contract = await csrEthereumContract()
    tx = await contract.createLottery(
      title,
      description,
      imageUrl,
      toWei(prize),
      toWei(ticketPrice),
      expiresAt,
      {
        from: wallet,
      }
    )
    tx.wait()
  } catch (error) {
    reportError(error)
  }
}

const exportLuckyNumbers = async (id, luckyNumbers) => {
  try {
    if (!ethereum) return reportError('Please install Metamask')
    const wallet = store.getState().globalStates.wallet
    const contract = await csrEthereumContract()

    tx = await contract.importLuckyNumbers(id, luckyNumbers, {
      from: wallet,
    })
    tx.wait()
  } catch (error) {
    reportError(error)
  }
}

const buyTicket = async (id, luckyNumberId, ticketPrice) => {
  try {
    if (!ethereum) return reportError('Please install Metamask')
    const wallet = store.getState().globalStates.wallet
    const contract = await csrEthereumContract()

    tx = await contract.buyTicket(id, luckyNumberId, {
      from: wallet,
      value: toWei(ticketPrice)
    })
    tx.wait()
  } catch (error) {
    reportError(error)
  }
}

const structureLotteries = (lotteries) =>
  lotteries.map((lottery) => ({
    id: Number(lottery.id),
    title: lottery.title,
    description: lottery.description,
    owner: lottery.owner.toLowerCase(),
    prize: fromWei(lottery.prize),
    ticketPrice: fromWei(lottery.ticketPrice),
    image: lottery.image,
    createdAt: formatDate(Number(lottery.createdAt)),
    drawsAt: formatDate(Number(lottery.expiresAt)),
    expiresAt: Number(lottery.expiresAt),
    winners: Number(lottery.winners),
    participants: Number(lottery.participants),
    drawn: lottery.drawn,
  }))

const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthsOfYear = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]

  const dayOfWeek = daysOfWeek[date.getDay()]
  const monthOfYear = monthsOfYear[date.getMonth()]
  const dayOfMonth = date.getDate()
  const year = date.getFullYear()

  return `${dayOfWeek} ${monthOfYear} ${dayOfMonth}, ${year}`
}

const truncate = (text, startChars, endChars, maxLength) => {
  if (text.length > maxLength) {
    let start = text.substring(0, startChars)
    let end = text.substring(text.length - endChars, text.length)
    while (start.length + end.length < maxLength) {
      start = start + '.'
    }
    return start + end
  }
  return text
}

const generateLuckyNumbers = (count) => {
  const result = []
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  for (let i = 0; i < count; i++) {
    let string = ''
    for (let j = 0; j < 6; j++) {
      string += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    result.push(string)
  }
  return result
}

const structuredNumbers = (participants) => {
  const purchasedNumbers = []

  for (let i = 0; i < participants.length; i++) {
    const purchasedNumber = participants[i][1]
    purchasedNumbers.push(purchasedNumber)
  }

  return purchasedNumbers
}

const reportError = (error) => {
  console.log(error.message)
}
export {
  connectWallet,
  truncate,
  monitorWalletConnection,
  getLotteries,
  getLottery,
  createJackpot,
  exportLuckyNumbers,
  generateLuckyNumbers,
  getLuckyNumbers,
  buyTicket,
  getPurchasedNumbers
}
