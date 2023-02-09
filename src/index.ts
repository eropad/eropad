import {domain, openAiSecret, password} from './env.js';
import GhostApi from './ghost-api.js';
import Gpt3ApI from './gpt-3-api.js';

const main = async () => {
	const gh = new GhostApi({domain, password});

	await gh.init();

	const gpt3 = new Gpt3ApI(openAiSecret);
	const [title, blog, imgData] = await gpt3.generateBlog();

	await gh.publish(title, blog, imgData);
};

// eslint-disable-next-line unicorn/prefer-top-level-await
main().catch(error => {
	throw error as unknown as Error;
});
