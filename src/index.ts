import {domain, openAiSecret, password, codeInjectionHead, mailgunApiKey, mailgunBaseUrl, mailgunDomain} from './env.js';
import GhostApi from './ghost-api.js';
import Gpt3ApI from './gpt-3-api.js';

const main = async () => {
	const gh = new GhostApi({domain, password, codeInjectionHead, mailgunApiKey, mailgunBaseUrl, mailgunDomain});

	await gh.init();

	const gpt3 = new Gpt3ApI(openAiSecret);
	const [title, blog, imgData, tags] = await gpt3.generateBlog();

	await gh.publish(title, blog, imgData, tags);
};

// eslint-disable-next-line unicorn/prefer-top-level-await
main().catch(error => {
	throw error as unknown as Error;
});
