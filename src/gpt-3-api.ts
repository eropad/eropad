import {encode} from 'gpt-3-encoder';
import {Configuration, OpenAIApi} from 'openai';

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
		'Hetrosexual',
		'Lesbian',
		'Gay',
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
		const category = this.#getRandom(this.#categories);
		const adjective = this.#getRandom(this.#adjectives);
		const suffix = `About A Beautiful, Young And ${adjective} ${category} Couple`;
		const body = await this.#generateText(`Write A Lengthy, Explicit, Engaging And Highly Detailed Erotica ${suffix}.`);
		const features = await this.#generateText(`Describe In Depth The Physical Features Of The People Involved In The Following Love Story:\n\n\n${body}`);
		const imgData = await this.#generateThumbnail(`The Featured Image For A Love Story ${suffix} Involving:\n\n\n${features}.`);
		const titleRaw = await this.#generateText(`Generate The Title For The Following Erotica:\n\n\n${body}`);
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
