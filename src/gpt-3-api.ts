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

		const {data: {choices: {0: result}}} = await this.#openai.createCompletion({
			model: 'text-davinci-003',
			prompt: input,
			// eslint-disable-next-line @typescript-eslint/naming-convention
			max_tokens: 4097 - encode(input).length,
		});

		const text = result.text?.trim();

		if (result.finish_reason !== 'stop') {
			throw new Error(`Error finish_reason is ${result.finish_reason!} and text is ${result.text!}`);
		}

		if (!text) {
			throw new Error('Error generated empty text');
		}

		return text;
	}

	async #generateThumbnail(input: string) {
		const {data: {data: {0: result}}} = await this.#openai.createImage({
			prompt: input.toLowerCase().trim(),
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
		const body = await this.#generateText(`Generate a 10,000-word erotic story ${suffix} with a captivating opening, detailed descriptions, and ${ending} ending. Build sexual tension through descriptive language and dialogue using a "show, don't tell" approach. Develop unique characters with interesting physical attributes, motivations, and intentions, and create a compelling plot with tension, conflict, suspense, and cliffhangers. Experiment with taboos such as BDSM, horror, transgressive, incest, and heartbreak. Write with the intention of leaving a lasting impression on the reader. Don't generate the title.`);
		const features = await this.#generateText(`Provide a G-rated description of the physical appearance of the individuals in the following erotic story ${suffix}. The description should be clear and concise. Include only physical features. The story is as follows:\n${body}`);
		const imgData = await this.#generateThumbnail(`Generate a high-resolution (Ultra HD) 4K image to depict a love story ${suffix}:\n${features}`);
		const titleRaw = await this.#generateText(`Give a Title to the Following Erotic Story ${suffix}:\n${body}`);

		let title: string;

		if (titleRaw.startsWith('Title: ') || titleRaw.startsWith('title: ')) {
			title = titleRaw.split('Title: ')[1] || titleRaw.split('title: ')[1];
		} else {
			const titleRawSplit = titleRaw.split('"');

			title = titleRawSplit.length === 3 ? titleRawSplit[1] : titleRaw;
		}

		return [title, body, imgData, [category, adjective.split(' ')[1]]] as [string, string, string, [string, string]];
	}
}

export default Gpt3ApI;
