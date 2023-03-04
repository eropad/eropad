import {encode} from 'gpt-3-encoder';
import {Configuration, OpenAIApi} from 'openai';
import categories from './categories.js';

class Gpt3ApI {
	#openai;

	#adjectives = [
		'An Adventurous',
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
		'A Debasing',
		'A Lovely',
		'A Wholesome',
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

	async #generateText(input: string) {
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
		const ending = this.#getRandom(['Happy', 'Surprise', 'Sad', 'Shocking', 'Unexpected']);

		const body = await this.#generateText(`Using the tips below, write a long (10000 words), lustful, engaging, deep, detailed, explicit, and super high-quality erotica ${suffix} with a ${ending} Ending:
		01. Start with an inspiring idea
		02. Decide a genre and audience
		03. Create a setting conducive to eroticism
		04. Develop interesting characters
		05. Create a compelling plot
		06. Write a strong opening
		07. Build sexual tension through description and dialogue
		08. Show, don't tell
		09. Use tension, conflict, suspense, and cliffhangers
		10. Be descriptive with vivid, profane/vulgar, seductive, sensory language
		11. Ensure smooth flow, fully developed characters, and appropriate pacing which keeps the erotica moving forward
		12. Experiment and push boundaries exploring taboos and non-consensual themes (example: BDSM, Horror, Transgressive, Paranormal, Incest, Polygamy, Orgy)
		13. Write with the intention of captivating readers and ensuring that the erotica endures the test of time`);

		const features = await this.#generateText(`Describe The Physical Features Of The People Involved In The Following Love Story ${suffix}:\n\n\n${body}`);
		const imgData = await this.#generateThumbnail(`Generate An Ultra HD 4K Featured Image For A Love Story ${suffix} Involving:\n\n\n${features}.`);
		const titleRaw = await this.#generateText(`Generate The Title For The Following Erotica ${suffix}:\n\n\n${body}`);
		const titleRawSplit = titleRaw.split('"');

		if (titleRawSplit.length !== 3) {
			throw new Error('Error `titleRawSplit.length !== 3`');
		}

		const title = titleRaw.split('"')[1];
		const titleExists = title || (titleRaw.startsWith('Title: ') && titleRaw.split('Title: ')[1]);

		if (!titleExists) {
			throw new Error('Error generated empty title');
		}

		return [titleExists, body, imgData, [category, adjective.split(' ')[1]]] as [string, string, string, [string, string]];
	}
}

export default Gpt3ApI;
