import Head from 'next/head'
import SubHeader from '@/components/SubHeader'
import JackpotTable from '@/components/JackpotTable'
import {  getPurchasedNumbers } from '@/services/fakeData'
import { getLottery, getLuckyNumbers } from '@/services/blockchain'
import Generator from '@/components/Generator'

function Jackpot({ lottery, lotteryNumbers, numbersPurchased }) {
  return (
    <div>
      <Head>
        <title>Dapp Lottery - Jackpot</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-slate-100">
        <SubHeader />
        <JackpotTable
          jackpot={lottery}
          luckyNumbers={lotteryNumbers}
          participants={numbersPurchased}
        />
        <Generator />
      </div>
    </div>
  )
}

export default Jackpot

export const getServerSideProps = async (context) => {
  const { jackpotId } = context.query //Grab URL ID eg: http://localhost:3000/jackpots/1 <-
  const lottery = await getLottery(jackpotId)
  const purchasedNumbers = getPurchasedNumbers(5)
  const lotteryNumbers = await getLuckyNumbers(jackpotId)

  return {
    props: {
      lottery: JSON.parse(JSON.stringify(lottery)),
      lotteryNumbers: JSON.parse(JSON.stringify(lotteryNumbers)),
      numbersPurchased: JSON.parse(JSON.stringify(purchasedNumbers)),
    },
  }
}
