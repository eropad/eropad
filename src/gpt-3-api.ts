import {encode} from 'gpt-3-encoder';
import {Configuration, OpenAIApi} from 'openai';
import getRandom from './get-random.js';

class Gpt3ApI {
	#openai;

	#tags = [
		'Lesbian',
		'Straight',
		'Gay',
	];

	constructor(openAiSecret: string) {
		const configuration = new Configuration({
			apiKey: openAiSecret,
		});

		this.#openai = new OpenAIApi(configuration);
	}

	#textToHtml(text: string) {
		return `<html><head></head><body><p>${text.replace(/\n/g, '<br> ')}</p></body></html>`;
	}

	#generatePrompt = () => {
		const tag = getRandom(this.#tags);

		return [tag, `The Featured Image For A Love Story About A Passionate, Beautiful And Young ${tag} Couple.`];
	};

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
		const [prompt, imgPrompt] = this.#generatePrompt();
		const imgData = await this.#generateThumbnail(imgPrompt);
		const body = await this.#generateText(`Write a long, explicit and highly detailed ${prompt} erotica.`);
		const titleRaw = await this.#generateText(`Give a title to this erotica:\n\n\n${body}`);
		const titleRawSplit = titleRaw.split('"');

		if (titleRawSplit.length !== 3) {
			throw new Error('Error `titleRawSplit.length !== 3`');
		}

		const title = titleRaw.split('"')[1];

		if (!title) {
			throw new Error('Error generated empty title');
		}

		return [title, this.#textToHtml(body), imgData];
	}
}

export default Gpt3ApI;
