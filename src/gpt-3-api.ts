import {encode} from 'gpt-3-encoder';
import {Configuration, OpenAIApi} from 'openai';
import categories from './categories.js';

class Gpt3ApI {
	#openai;

	#adjectives = [
		'An Adventurous',
		'A Debasing',
		'A Destructive',
		'A Dirty',
		'An Experimental',
		'A Filthy',
		'An Impulsive',
		'A Passionate',
		'A Romantic',
		'A Spontaneous',
		'A Toxic',
		'A Wicked',
	];

	constructor(openAiSecret: string) {
		const configuration = new Configuration({
			apiKey: openAiSecret,
		});

		this.#openai = new OpenAIApi(configuration);
	}

	#getRandom<T>(items: T[]) {
		return items[Math.floor(Math.random() * items.length)];
	}

	async #generateText(rawInput: string) {
		const input = rawInput.toLowerCase().trim();

		try {
			const {data: {choices: {0: result}}} = await this.#openai.createChatCompletion({
				model: 'gpt-3.5-turbo',
				messages: [{role: 'user', content: input}],
			});

			const text = result.message?.content.trim();

			if (result.finish_reason !== 'stop') {
				throw new Error(`Error finish_reason is ${result.finish_reason!}`);
			}

			if (!text) {
				throw new Error('Error generated empty text');
			}

			return text;
		} catch (error: unknown) {
			console.error(error);
			console.log('Retrying...');

			const {data: {choices: {0: result}}} = await this.#openai.createCompletion({
				model: 'text-davinci-003',
				prompt: input,
				// eslint-disable-next-line @typescript-eslint/naming-convention
				max_tokens: 4097 - encode(input).length,
			});

			const text = result.text?.trim();

			if (result.finish_reason !== 'stop') {
				throw new Error(`Error finish_reason is ${result.finish_reason!}`);
			}

			if (!text) {
				throw new Error('Error generated empty text');
			}

			return text;
		}
	}

	async #generateThumbnail(input: string) {
		const {data: {data: {0: result}}} = await this.#openai.createImage({
			prompt: input,
			// eslint-disable-next-line @typescript-eslint/naming-convention
			response_format: 'b64_json',
		});

		return result.b64_json!;
	}

	async generateBlog() {
		const category = this.#getRandom(categories);
		const adjective = this.#getRandom(this.#adjectives);
		const suffix = category ? `About ${adjective} ${category} Couple` : `About ${adjective} Couple`;
		const ending = this.#getRandom(['A Satisfying', 'A Surprise', 'A Sad', 'A Shocking', 'An Unexpected']);

		const body = await this.#generateText(`Using the tips below, write a long/lengthy (~10,000 words), deep, detailed, engaging, explicit, lustful and super high-quality erotica ${suffix} with ${ending} ending:
		Begin with an inspiring idea.
		Determine the genre and target audience.
		Create a setting that enhances eroticism.
		Develop interesting characters, including their physical attributes and motivations/intentions.
		Create a compelling plot.
		Write a strong opening.
		Build sexual tension through descriptive language and dialogue (show, don't tell).
		Use tension, conflict, suspense, and cliffhangers.
		Be descriptive using vivid, seductive, sensory language that may include profanity or vulgarity.
		Ensure smooth flow, fully developed characters, and appropriate pacing that keeps the erotica moving forward.
		Experiment and push boundaries by exploring taboos and non-consensual themes such as Wholesome, Lovely, Domination, Submission, BDSM, Horror, Transgressive, Interracial, Hentai, Fantasy, Paranormal, Incest, Polygamy, Orgy, Celebrity, infidelity, and heartbreak.
		Write with the intention of captivating readers and ensuring that the erotica endures the test of time and always comes out on top.`);

		const features = await this.#generateText(`Describe The Physical Features Of The People Involved In The Following Love Story ${suffix}:\n\n\n${body}`);
		const imgData = await this.#generateThumbnail(`Generate An Ultra HD 4K Featured Image For A Love Story ${suffix} Involving:\n\n\n${features}.`);
		const titleRaw = await this.#generateText(`Generate The Title For The Following Erotica ${suffix}:\n\n\n${body}`);

		let title: string;

		if (titleRaw.startsWith('Title: ')) {
			title = titleRaw.split('Title: ')[1];
		} else {
			const titleRawSplit = titleRaw.split('"');

			title = titleRawSplit.length === 3 ? titleRawSplit[1] : titleRaw;
		}

		return [title, body, imgData, [category, adjective.split(' ')[1]]] as [string, string, string, [string, string]];
	}
}

export default Gpt3ApI;
