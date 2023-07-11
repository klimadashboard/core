import { saveQuizAnswerToDb, getQuizAnswersFromDb } from '../../../lib/components/charts/climateQuiz/climateQuizDbClient.server';
import { json } from '@sveltejs/kit';

export async function GET (request) {
    const searchParams = request.url.searchParams.get('questionUuid')
    if (searchParams) {
        const result = await getQuizAnswersFromDb(searchParams)
        return json(result)
    }
    return json({})
}

export async function POST ({ request }) {
    const req = await request.json()
    const result = await saveQuizAnswerToDb(req.postAnswer)
    return json(result)
}
