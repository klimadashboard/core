import { MONGODB_COLLECTION_ANSWER_API } from '$env/static/private';
import { getDb } from './dbConnector.server';

export async function saveQuizAnswerToDb(answer: DbQuizAnswer) {
	try {
		const dbClient = await getDb();
		const collection = dbClient.collection(MONGODB_COLLECTION_ANSWER_API);
		await collection.insertOne(answer);
		// console.log('saved to db: ', answer);
		return { success: true };
	} catch (error) {
		// console.log('error: while saving new status to db \n', error);
		return { success: false };
	}
}

export async function getQuizAnswersFromDb(questionUuid: string) {
	try {
		const dbClient = await getDb();
		const collection = dbClient.collection(MONGODB_COLLECTION_ANSWER_API);
		const aggregation = [
			{ $match: { questionUuid: questionUuid } },
			{
				$group: {
					_id: '$answerId',
					answerId: { $first: '$answerId' },
					count: { $sum: 1 }
				}
			}
		];
		const result = await collection.aggregate(aggregation).toArray();
		// console.log('retrieved from db: ', result);
		return result;
	} catch (error) {
		// console.log('error: while fatching from collection: %s db \n', error);
		return {};
	}
}
