import Head from 'next/head'
import SubHeader from '@/components/SubHeader'
import ResultTable from '@/components/ResultTable'
import Winners from '@/components/Winners'
import {
  generateLottery,
  generateLotteryParticipants,
} from '@/services/fakeData'

function Result({lottery, participantList, lotteryResult}) {
  console.log({lottery,participantList,lotteryResult});
  return (
    <div>
      <Head>
        <title>Dapp Lottery - Result</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-slate-100">
        <SubHeader />
        <ResultTable jackpot={lottery} participants={participantList} result={lotteryResult}/>
        <Winners />
      </div>
    </div>
  )
}

export default Result

export const getServerSideProps = async (context) => {
  const { resultId } = context.query //Grab URL ID eg: http://localhost:3000/results/1 <-
  const lottery = generateLottery(resultId)
  const participantList = generateLotteryParticipants(6)
  const lotteryResult = []

  return {
    props: {
      lottery: JSON.parse(JSON.stringify(lottery)),
      participantList: JSON.parse(JSON.stringify(participantList)),
      lotteryResult: JSON.parse(JSON.stringify(lotteryResult)),
    },
  }
}
