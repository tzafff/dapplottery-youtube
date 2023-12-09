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

    if(accounts.length) {
      store.dispatch(setWallet(accounts[0]))
    } else {
      store.dispatch(setWallet(''))
      reportError('Please, connect wallet, no accounts found')
    }
  } catch (error) {
    reportError(error)
  }
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
export { connectWallet, truncate, monitorWalletConnection }
