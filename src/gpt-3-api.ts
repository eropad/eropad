import {encode} from 'gpt-3-encoder';
import {Configuration, OpenAIApi} from 'openai';
import getRandom from './get-random.js';

class Gpt3ApI {
	#openai;

	#adjectives = [
		'Destructive',
		'Romantic',
		'Experimental',
		'Wicked',
		'Adventurous',
		'Spontaneous',
		'Impulsive',
		'Dirty',
		'Filthy',
		'Debasing',
		'Toxic',
		'Passionate',
	];

	#categories = [
		'Gay',
		'Lesbian',
		'Straight',
	];

	constructor(openAiSecret: string) {
		const configuration = new Configuration({
			apiKey: openAiSecret,
		});

		this.#openai = new OpenAIApi(configuration);
	}

	async #generateText(input: string) {
		const {data: {choices: {0: result}}} = await this.#openai.createCompletion({
			model: 'text-davinci-003',
			prompt: input,
			// eslint-disable-next-line @typescript-eslint/naming-convention
			max_tokens: 4096 - encode(input).length,
		});

		const text = result.text?.trim();

		if (result.finish_reason !== 'stop' || !text) {
			throw new Error('Error while generating text');
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
		const category = getRandom(this.#categories);
		const adjective = getRandom(this.#adjectives);
		const suffix = `About A Beautiful, Young And ${adjective} ${category} Couple.`;
		const imgData = await this.#generateThumbnail(`The Featured Image For A Love Story ${suffix}`);
		const body = await this.#generateText(`Write A Long, Explicit, Engaging And Highly Detailed Erotica ${suffix}`);
		const titleRaw = await this.#generateText(`Suggest A Title For The Following:\n\n\n${body}`);
		const titleRawSplit = titleRaw.split('"');

		if (titleRawSplit.length !== 3) {
			throw new Error('Error `titleRawSplit.length !== 3`');
		}

		const title = titleRaw.split('"')[1];

		if (!title) {
			throw new Error('Error generated empty title');
		}

		return [title, body, imgData, [category, adjective]] as [string, string, string, [string, string]];
	}
}

export default Gpt3ApI;
