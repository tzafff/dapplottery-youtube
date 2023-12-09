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

const reportError = (error) => {
  console.log(error.message)
}
export { connectWallet, truncate, monitorWalletConnection, getLotteries, getLottery }
