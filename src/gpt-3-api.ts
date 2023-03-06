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

		const body = await this.#generateText(
			`Using the tips provided below, write a long, deep, explicit, lustful and engaging erotica of super high-quality with a length of approximately 10,000 words, detailed descriptions, and ${ending} ending. Your erotica should focus on ${suffix}. Do not add a title.\n\n
		To start, write a captivating opening that immediately hooks the reader. Next, determine the genre and target audience of your erotica. From there, develop an inspiring idea that will capture the reader's attention and maintain their interest throughout the erotica.
		To enhance the eroticism, create a setting that is conducive to sexual tension and desire. Develop interesting characters with unique physical attributes, motivations, and intentions. Additionally, create a compelling plot with tension, conflict, suspense, and cliffhangers.
		As you write, build sexual tension through descriptive language and dialogue, using a "show, don't tell" approach. Use informal, vivid, seductive, and sensory language that may include profanity or vulgarity. Ensure a smooth flow, fully developed characters, and appropriate pacing that keeps the erotica moving forward.
		Experiment and push boundaries by exploring taboos, including consensual and non-consensual themes such as BDSM, Wholesome, Lovely, Domination, Submission, Horror, Transgressive, Interracial, Hentai, Fantasy, Paranormal, Incest, Polygamy, Orgy, Celebrity, infidelity, cheating, and heartbreak.
		Lastly, write your erotica with the intention of captivating readers and ensuring that it endures the test of time, leaving a lasting impression on your readers.`,
		);

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
