interface QuizQuestion {
	question: string;
	answers: QuizAnswer[];
	showOnPages: ShowOnPages[] | null;
	showOnVersions: string;
	text_answer: string;
	text_question: string;
	uuid: string;
}

interface QuizAnswer {
	help: string;
	id: number;
	istrue: string;
	label: string;
	count: number;
}

interface DbQuizAnswer {
	answerId: number;
	questionUuid: string;
}

interface DbCountQuizAnswer {
	answerId: number;
	count: number;
}

interface ShowOnPages {
	uid: string;
	uuid: string;
}
